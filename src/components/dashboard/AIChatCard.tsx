import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { isCareerLaunchRequest } from "@/lib/career/chatRoute";
import { Check, Clipboard, History, Loader2, LogOut, Mic, Square, RotateCcw, Send, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { ChatAssetCards } from "./ChatAssetCards";
import { ChatCalculationCard } from "./ChatCalculationCard";
import { ChatComparisonTable } from "./ChatComparisonTable";
import { ChatNewsList } from "./ChatNewsList";
import { ChatAuthGate } from "./ChatAuthGate";
import { useAuth } from "@/context/useAuth";
import { createConversation, deleteConversation, listConversations, loadMessages, saveMessage, type ChatConversation } from "@/lib/copilot/chatHistory";
import { ChatSiteLaunch } from "./ChatSiteLaunch";
import { resolveSiteIntent, SITE_CAPABILITIES, type SiteCapability } from "@/lib/copilot/siteCapabilities";
import { ChatDataDesk } from "./ChatDataDesk";
import { ChatCalcCard } from "./ChatCalcCard";
import { ChatLearnPath } from "./ChatLearnPath";
import { looksLikeLearningPathRequest } from "@/lib/copilot/learnDesk";
import { runCalcDesk, type CalcDeskResult } from "@/lib/copilot/calcDesk";
import { loadDataDesk, resolveDataDesk, type DataDeskResult } from "@/lib/copilot/dataDesk";
import { ChatStrategyCard } from "./ChatStrategyCard";
import { ChatStrategyFitCard } from "./ChatStrategyFitCard";
import { appendDictation, getSpeechRecognition, joinTranscript, speechLocale, type SpeechRecognitionLike } from "@/lib/copilot/voiceInput";
import { useAnalysis } from "@/context/useAnalysis";
import type { CopilotResponse } from "@/lib/copilotResponse";

interface Message { role: "user" | "copilot"; text: string; response?: CopilotResponse; careerLaunch?: boolean; siteCaps?: SiteCapability[]; desk?: DataDeskResult; calc?: CalcDeskResult; learnPath?: boolean; }

export function AIChatCard() {
  const { t, language } = useLanguage();
  const { askCopilot, isAnalyzing, reset } = useAnalysis();
  const { user, loading: authLoading, signOut } = useAuth();
  const conversationId = useRef<string | null>(null);
  const savedCount = useRef(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
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
  useEffect(() => {
    if (!user || messages.length <= savedCount.current) return;
    const pending = messages.slice(savedCount.current);
    savedCount.current = messages.length;
    void (async () => {
      try {
        if (!conversationId.current) conversationId.current = await createConversation(pending[0].text);
        for (const m of pending) await saveMessage(conversationId.current, { role: m.role, text: m.text });
      } catch { /* history is best-effort; the chat keeps working */ }
    })();
  }, [messages, user]);
  async function toggleHistory() {
    const next = !historyOpen; setHistoryOpen(next);
    if (next) { try { setConversations(await listConversations()); } catch { setConversations([]); } }
  }
  async function openConversation(id: string) {
    try {
      const stored = await loadMessages(id);
      conversationId.current = id; savedCount.current = stored.length; reset();
      setMessages(stored.map((m) => ({ role: m.role, text: m.text }))); setHistoryOpen(false);
    } catch { /* ignore */ }
  }
  async function removeConversation(id: string) {
    try { await deleteConversation(id); setConversations((c) => c.filter((x) => x.id !== id)); if (conversationId.current === id) clearConversation(); } catch { /* ignore */ }
  }
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, isAnalyzing]);

  function submit(event: FormEvent) { event.preventDefault(); void send(question); }
  async function send(raw: string) {
    const text = raw.trim();
    if (!text || isAnalyzing) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text }]);
    if (isCareerLaunchRequest(text)) {
      setMessages((current) => [...current, { role: "copilot", text: t("career_chat_launch"), careerLaunch: true }]);
      return;
    }
    if (looksLikeLearningPathRequest(text)) {
      setMessages((current) => [...current, { role: "copilot", text: t("learnpath_lead"), learnPath: true }]);
      return;
    }
    const site = resolveSiteIntent(text);
    if (site) {
      setMessages((current) => [...current, site.kind === "overview"
        ? { role: "copilot", text: t("cap_overview"), siteCaps: SITE_CAPABILITIES }
        : { role: "copilot", text: t("cap_open_lead"), siteCaps: site.matches }]);
      return;
    }
    const calc = runCalcDesk(text);
    if (calc) {
      setMessages((current) => [...current, { role: "copilot", text: t("calc_lead"), calc }]);
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

  function clearConversation() { reset(); setMessages([]); setQuestion(""); conversationId.current = null; savedCount.current = 0; }
  async function copyMessage(text: string, index: number) { await navigator.clipboard.writeText(text); setCopied(index); window.setTimeout(() => setCopied(null), 1500); }

  const started = messages.length > 0;
  return (
    <div className={`mx-auto flex w-full max-w-3xl flex-col ${started ? "min-h-[calc(100vh-9rem)]" : "min-h-[calc(100vh-14rem)] justify-center"}`}>
      {!started && (
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/copilot-avatar.png" alt="" width="56" height="56" className="h-14 w-14 rounded-2xl object-cover" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{t("copilot_home_title")}</h1>
        </div>
      )}
      {user && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <button type="button" onClick={() => void toggleHistory()} aria-expanded={historyOpen} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><History className="h-3.5 w-3.5" aria-hidden="true" />{t("history_open")}</button>
          <button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><LogOut className="h-3.5 w-3.5" aria-hidden="true" />{t("auth_sign_out")}</button>
        </div>
      )}
      {user && historyOpen && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-3">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("history_title")}</p>
          {conversations.length === 0 ? <p className="text-xs text-muted-foreground">{t("history_empty")}</p> : (
            <ul className="space-y-1">{conversations.map((c) => <li key={c.id} className="flex items-center gap-2"><button type="button" onClick={() => void openConversation(c.id)} className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-start text-sm hover:bg-muted">{c.title || "..."}</button><button type="button" aria-label={t("history_delete")} onClick={() => void removeConversation(c.id)} className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button></li>)}</ul>
          )}
        </div>
      )}
      {started && (
        <div className="mb-2 flex justify-end">
          <button type="button" onClick={clearConversation} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /><span>{t("copilot_clear")}</span></button>
        </div>
      )}
      {started && <h1 className="sr-only">{t("chat_page_title")}</h1>}
      <div ref={scrollRef} aria-live="polite" aria-busy={isAnalyzing} className={started ? "flex-1 space-y-6 pb-6" : ""}>
        {messages.map((message, index) => {
          const response = message.response;
          const assets = response?.assets ?? [];
          return <div key={index} className={message.role === "user" ? "ms-auto w-fit max-w-[85%] rounded-3xl bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground" : "group flex gap-3 text-sm leading-7"}>
            {message.role === "copilot" && <img src="/copilot-avatar.png" alt="" width="36" height="36" className="mt-0.5 h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-amber-400/30" />}
            <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.desk && <ChatDataDesk data={message.desk} />}
            {message.calc && <ChatCalcCard data={message.calc} />}
            {message.learnPath && <ChatLearnPath />}
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
            </div>
          </div>;
        })}
        {isAnalyzing && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("copilot_working")}</div>}
      </div>
      {!user && !authLoading && <ChatAuthGate />}
      {user && <div className={started ? "sticky bottom-0 bg-background/90 pb-3 pt-2 backdrop-blur" : ""}>
        <form onSubmit={submit} className="welcome-composer flex items-end gap-2 rounded-[1.75rem] border border-border/60 bg-muted/50 p-2.5">
          <textarea rows={1} aria-label={t("copilot_input")} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={t("copilot_placeholder")} className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none" />
          {SpeechCtor && <button type="button" onClick={toggleVoice} aria-pressed={listening} aria-label={t(listening ? "voice_stop" : "voice_start")} title={t(listening ? "voice_stop" : "voice_start")} className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${listening ? "animate-pulse bg-primary text-primary-foreground" : "text-primary hover:bg-primary/10"}`}>{listening ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}</button>}
          <button type="submit" disabled={!question.trim() || isAnalyzing} aria-label={t("copilot_send")} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:-scale-x-100" />}</button>
        </form>
        {!started && (
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {["copilot_sugg_1","copilot_sugg_2","copilot_sugg_3","copilot_sugg_4"].map((key) => <li key={key}><button type="button" onClick={() => void send(t(key))} className="welcome-chip rounded-full border border-border/70 px-4 py-2 text-sm text-foreground">{t(key)}</button></li>)}
          </ul>
        )}
        <p className="mt-3 text-center text-[11px] text-muted-foreground" aria-live="polite">{voiceError ? t("voice_error") : listening ? t("voice_listening") : t("copilot_disclaimer_short")}</p>
      </div>}
    </div>
  );
}
