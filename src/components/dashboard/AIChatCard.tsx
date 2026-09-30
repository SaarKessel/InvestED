import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { isCareerLaunchRequest } from "@/lib/career/chatRoute";
import { Check, Clipboard, Loader2, Mic, Square, RotateCcw, Send, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { ChatAssetCards } from "./ChatAssetCards";
import { ChatCalculationCard } from "./ChatCalculationCard";
import { ChatComparisonTable } from "./ChatComparisonTable";
import { ChatNewsList } from "./ChatNewsList";
import { ChatSiteLaunch } from "./ChatSiteLaunch";
import { resolveSiteIntent, SITE_CAPABILITIES, type SiteCapability } from "@/lib/copilot/siteCapabilities";
import { ChatDataDesk } from "./ChatDataDesk";
import { loadDataDesk, resolveDataDesk, type DataDeskResult } from "@/lib/copilot/dataDesk";
import { ChatStrategyCard } from "./ChatStrategyCard";
import { ChatStrategyFitCard } from "./ChatStrategyFitCard";
import { appendDictation, getSpeechRecognition, joinTranscript, speechLocale, type SpeechRecognitionLike } from "@/lib/copilot/voiceInput";
import { useAnalysis } from "@/context/useAnalysis";
import type { CopilotResponse } from "@/lib/copilotResponse";

interface Message { role: "user" | "copilot"; text: string; response?: CopilotResponse; careerLaunch?: boolean; siteCaps?: SiteCapability[]; desk?: DataDeskResult; }

export function AIChatCard() {
  const { t, language } = useLanguage();
  const { askCopilot, isAnalyzing, reset } = useAnalysis();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const SpeechCtor = getSpeechRecognition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  useEffect(() => () => recognitionRef.current?.stop(), []);
  function toggleVoice() {
    if (!SpeechCtor) return;
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = new SpeechCtor();
    rec.lang = speechLocale(language); rec.interimResults = false; rec.continuous = false;
    const before = question;
    rec.onresult = (event) => setQuestion(appendDictation(before, joinTranscript(event.results)));
    rec.onerror = () => { setVoiceError(true); setListening(false); };
    rec.onend = () => setListening(false);
    setVoiceError(false); recognitionRef.current = rec;
    try { rec.start(); setListening(true); } catch { setVoiceError(true); }
  }
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, isAnalyzing]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || isAnalyzing) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text }]);
    if (isCareerLaunchRequest(text)) {
      setMessages((current) => [...current, { role: "copilot", text: t("career_chat_launch"), careerLaunch: true }]);
      return;
    }
    const site = resolveSiteIntent(text);
    if (site) {
      setMessages((current) => [...current, site.kind === "overview"
        ? { role: "copilot", text: t("cap_overview"), siteCaps: SITE_CAPABILITIES }
        : { role: "copilot", text: t("cap_open_lead"), siteCaps: site.matches }]);
      return;
    }
    const deskKind = resolveDataDesk(text);
    if (deskKind) {
      try {
        const desk = await loadDataDesk(deskKind);
        setMessages((current) => [...current, { role: "copilot", text: t(`desk_${deskKind}_lead`), desk }]);
      } catch {
        setMessages((current) => [...current, { role: "copilot", text: t("desk_unavailable") }]);
      }
      return;
    }
    try {
      const turn = await askCopilot(text);
      setMessages((current) => [...current, { role: "copilot", text: turn.response.text, response: turn.response }]);
    } catch {
      setMessages((current) => [...current, { role: "copilot", text: t("copilot_error") }]);
    }
  }

  function clearConversation() { reset(); setMessages([]); setQuestion(""); }
  async function copyMessage(text: string, index: number) { await navigator.clipboard.writeText(text); setCopied(index); window.setTimeout(() => setCopied(null), 1500); }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div><div><h2 className="text-xl font-bold">{t("copilot_header")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("copilot_subtitle")}</p></div></div>
        {messages.length > 0 && <button type="button" onClick={clearConversation} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t("copilot_clear")}</span></button>}
      </div>
      <div ref={scrollRef} aria-live="polite" aria-busy={isAnalyzing} className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pe-1">
        {messages.length === 0 && <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{t("copilot_empty")}</p>}
        {messages.map((message, index) => {
          const response = message.response;
          const assets = response?.assets ?? [];
          return <div key={index} className={`group max-w-[92%] rounded-xl p-3 text-sm leading-6 sm:max-w-[86%] ${message.role === "user" ? "ms-auto bg-primary text-primary-foreground" : "bg-muted"}`}>
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.desk && <ChatDataDesk data={message.desk} />}
            {message.siteCaps && <ChatSiteLaunch capabilities={message.siteCaps} />}
            {message.careerLaunch && <Link to="/career-lab" className="mt-3 inline-block rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary">{t("career_chat_open")}</Link>}
            {response?.toolResult && <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs"><p className="font-semibold">{t("copilot_verified_calculation")}</p>{response.toolResult.formula && <p className="mt-1 font-mono" dir="ltr">{response.toolResult.formula}</p>}{response.toolResult.assumptions.length > 0 && <p className="mt-1 text-muted-foreground">{t("copilot_assumptions")}: {response.toolResult.assumptions.join(" · ")}</p>}</div>}
            {response?.calculation && <ChatCalculationCard projection={response.calculation} />}
            {assets.length > 0 && <ChatNewsList symbols={assets.map((asset) => asset.symbol)} />}
            {response?.strategyExplanation && <ChatStrategyCard explanation={response.strategyExplanation} />}
            {response?.strategyFit && <ChatStrategyFitCard fit={response.strategyFit} />}
            {response?.comparison && response.comparison.length >= 2
              ? <ChatComparisonTable assets={response.comparison} />
              : <ChatAssetCards assets={assets} />}
            {message.role === "copilot" && <button type="button" onClick={() => copyMessage(message.text, index)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-70 hover:opacity-100" aria-label={t("copilot_copy")}>{copied === index ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}{copied === index ? t("copilot_copied") : t("copilot_copy")}</button>}
          </div>;
        })}
        {isAnalyzing && <div className="flex max-w-[86%] items-center gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("copilot_working")}</div>}
      </div>
      <form onSubmit={submit} className="mt-5 flex items-end gap-2">
        <textarea rows={2} aria-label={t("copilot_input")} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={t("copilot_placeholder")} className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        {SpeechCtor && <button type="button" onClick={toggleVoice} aria-pressed={listening} aria-label={t(listening ? "voice_stop" : "voice_start")} title={t(listening ? "voice_stop" : "voice_start")} className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border ${listening ? "bg-primary text-primary-foreground animate-pulse" : "text-primary hover:border-primary"}`}>{listening ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}</button>}
        <button type="submit" disabled={!question.trim() || isAnalyzing} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span className="hidden sm:inline">{t("copilot_send")}</span></button>
      </form>
      <p className="mt-2 text-[11px] text-muted-foreground" aria-live="polite">{voiceError ? t("voice_error") : listening ? t("voice_listening") : t("copilot_enter_hint")}</p>
    </div>
  );
}
