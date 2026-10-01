import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isCareerLaunchRequest } from "@/lib/career/chatRoute";
import { Check, Clipboard, History, Loader2, LogOut, Mic, Square, RotateCcw, Trash2, Volume2, VolumeX, ArrowUp } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { ChatAssetCards } from "./ChatAssetCards";
import { ChatCalculationCard } from "./ChatCalculationCard";
import { ChatComparisonTable } from "./ChatComparisonTable";
import { ChatNewsList } from "./ChatNewsList";
import { ChatAuthGate } from "./ChatAuthGate";
import { useAuth } from "@/context/useAuth";
import { createConversation, deleteConversation, listConversations, loadMessages, saveMessage, type ChatConversation } from "@/lib/copilot/chatHistory";
import { ChatSiteLaunch } from "./ChatSiteLaunch";
import { ChatToolPanel } from "./ChatToolPanel";
import { ChatToolMenu } from "./ChatToolMenu";
import { toolForPath } from "./chatTools";
import { openingLine } from "@/lib/copilot/toolKeywords";
import { resolveToolKeyword } from "@/lib/copilot/toolKeywords";
import { ChatRelated } from "./ChatRelated";
import { ChatSidePanel } from "./ChatSidePanel";
import { hasVisuals, useWide } from "./chatPanelState";
import { resolveSiteIntent, SITE_CAPABILITIES, type SiteCapability } from "@/lib/copilot/siteCapabilities";
import { ChatDataDesk } from "./ChatDataDesk";
import { ChatCalcCard } from "./ChatCalcCard";
import { ChatLearnPath } from "./ChatLearnPath";
import { ChatKnowledge, FeedbackButtons } from "./ChatKnowledge";
import { searchKnowledge, recordGap } from "@/lib/knowledge/knowledgeClient";
import { wantsKnowledgeLookup, type KnowledgeItem } from "@/lib/knowledge/knowledge";
import { looksLikeLearningPathRequest } from "@/lib/copilot/learnDesk";
import { runCalcDesk, type CalcDeskResult } from "@/lib/copilot/calcDesk";
import { loadDataDesk, resolveDataDesk, type DataDeskResult } from "@/lib/copilot/dataDesk";
import { ChatStrategyCard } from "./ChatStrategyCard";
import { ChatStrategyFitCard } from "./ChatStrategyFitCard";
import { speak, stopSpeaking, unlockSpeech, getSynth, type SpeakResult } from "@/lib/copilot/speechOutput";
import { appendDictation, getSpeechRecognition, joinTranscript, speechLocale, type SpeechRecognitionLike } from "@/lib/copilot/voiceInput";
import { useAnalysis } from "@/context/useAnalysis";
import type { CopilotResponse } from "@/lib/copilotResponse";

interface Message { role: "user" | "copilot"; text: string; response?: CopilotResponse; careerLaunch?: boolean; siteCaps?: SiteCapability[]; desk?: DataDeskResult; calc?: CalcDeskResult; learnPath?: boolean; question?: string; knowledge?: KnowledgeItem[]; }

export function AIChatCard() {
  const { t, language } = useLanguage();
  const { askCopilot, isAnalyzing, reset } = useAnalysis();
  const navigate = useNavigate();
  const toolOpen = toolForPath(useLocation().pathname) !== null;
  const { user, loading: authLoading, signOut } = useAuth();
  const conversationId = useRef<string | null>(null);
  const savedCount = useRef(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [dismissedPanel, setDismissedPanel] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const SpeechCtor = getSpeechRecognition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const [talk, setTalk] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [speechNote, setSpeechNote] = useState<SpeakResult | null>(null);
  const talkRef = useRef(false); talkRef.current = talk;
  const canSpeak = !!getSynth();
  function speakMessage(text: string, index: number | null) {
    const r = speak(text, () => { setSpeakingIdx(null); if (talkRef.current && SpeechCtor) window.setTimeout(() => { if (talkRef.current) toggleVoiceRef.current?.(); }, 350); });
    setSpeechNote(r === "started" ? null : r); setSpeakingIdx(r === "started" ? index : null);
  }
  const toggleVoiceRef = useRef<(() => void) | null>(null);
  const sendRef = useRef<((raw: string) => Promise<void>) | null>(null);
  function toggleTalk() { if (talk) { setTalk(false); stopSpeaking(); setSpeakingIdx(null); recognitionRef.current?.stop(); } else { unlockSpeech(); setTalk(true); if (SpeechCtor && !listening) window.setTimeout(() => toggleVoiceRef.current?.(), 0); } }
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => () => recognitionRef.current?.stop(), []);
  function toggleVoice() {
    if (!SpeechCtor) return;
    if (listening) { recognitionRef.current?.stop(); return; }
    const rec = new SpeechCtor();
    rec.lang = speechLocale(language); rec.interimResults = false; rec.continuous = false;
    const before = question;
    rec.onresult = (event) => { const said = appendDictation(before, joinTranscript(event.results)); setQuestion(said); if (talkRef.current && said.trim()) { setQuestion(""); void sendRef.current?.(said); } };
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
    const keywordPath = resolveToolKeyword(text);
    const keywordTool = keywordPath ? toolForPath(keywordPath) : null;
    if (keywordPath && keywordTool) {
      setMessages((current) => [...current, { role: "copilot", text: openingLine(text, keywordTool.tool?.labelKey) }]);
      navigate(keywordPath);
      return;
    }
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
      let knowledge: KnowledgeItem[] = [];
      if (wantsKnowledgeLookup(turn.response.intent)) {
        knowledge = await searchKnowledge(text);
        if (!knowledge.length) void recordGap(text, turn.response.language, "no_hit");
      }
      setMessages((current) => [...current, { role: "copilot", text: turn.response.text, response: turn.response, question: text, knowledge }]);
    } catch {
      setMessages((current) => [...current, { role: "copilot", text: t("copilot_error") }]);
    }
  }

  sendRef.current = send; toggleVoiceRef.current = toggleVoice;
  useEffect(() => { const last = messages[messages.length - 1]; if (talk && last?.role === "copilot" && last.text) speakMessage(last.text, messages.length - 1); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);
  function clearConversation() { reset(); setMessages([]); setQuestion(""); conversationId.current = null; savedCount.current = 0; }
  async function copyMessage(text: string, index: number) { await navigator.clipboard.writeText(text); setCopied(index); window.setTimeout(() => setCopied(null), 1500); }

  const wide = useWide();
  const panelIndex = wide ? messages.reduce((acc, m, i) => (m.role === "copilot" && hasVisuals(m) ? i : acc), -1) : -1;
  const panelOpen = panelIndex >= 0 && dismissedPanel !== panelIndex;
  const inPanel = (index: number) => panelOpen && index === panelIndex;
  const visuals = (message: Message) => {
    const response = message.response;
    const assets = response?.assets ?? [];
    return (<>
            {message.desk && <ChatDataDesk data={message.desk} />}
            {message.calc && <ChatCalcCard data={message.calc} />}
            {message.knowledge && message.knowledge.length > 0 && <ChatKnowledge items={message.knowledge} />}
            {message.learnPath && <ChatLearnPath />}
            {response?.toolResult && <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs"><p className="font-semibold">{t("copilot_verified_calculation")}</p>{response.toolResult.formula && <p className="mt-1 font-mono" dir="ltr">{response.toolResult.formula}</p>}{response.toolResult.assumptions.length > 0 && <p className="mt-1 text-muted-foreground">{t("copilot_assumptions")}: {response.toolResult.assumptions.join(" · ")}</p>}</div>}
            {response?.calculation && <ChatCalculationCard projection={response.calculation} />}
            {assets.length > 0 && <ChatNewsList symbols={assets.map((asset) => asset.symbol)} />}
            {response?.strategyExplanation && <ChatStrategyCard explanation={response.strategyExplanation} />}
            {response?.strategyFit && <ChatStrategyFitCard fit={response.strategyFit} />}
            {response?.comparison && response.comparison.length >= 2
              ? <ChatComparisonTable assets={response.comparison} />
              : <ChatAssetCards assets={assets} />}
    </>);
  };
  const started = messages.length > 0 || toolOpen;
  const panelSymbols = panelOpen ? (messages[panelIndex].response?.assets ?? []).map((a) => a.symbol) : [];
  return (
    <div dir="ltr" className={panelOpen ? "mx-auto grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]" : "contents"}>
    {panelOpen && <ChatSidePanel symbols={panelSymbols} onClose={() => setDismissedPanel(panelIndex)}>{visuals(messages[panelIndex])}</ChatSidePanel>}
    <div dir={language === "he" ? "rtl" : "ltr"} className={`mx-auto flex w-full max-w-3xl flex-col ${started ? "min-h-[calc(100vh-9rem)]" : "min-h-[calc(100vh-14rem)] justify-center"}`}>
      {!started && (
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/copilot-avatar.png" alt="" width="56" height="56" className="h-14 w-14 rounded-2xl object-cover" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{t(user || authLoading ? "copilot_home_title" : "gate_welcome")}</h1>
        </div>
      )}
      {user && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <button type="button" onClick={() => void toggleHistory()} aria-expanded={historyOpen} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><History className="h-3.5 w-3.5" aria-hidden="true" />{t("history_open")}</button>
          <button type="button" onClick={() => { clearConversation(); void signOut(); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><LogOut className="h-3.5 w-3.5" aria-hidden="true" />{t("auth_sign_out")}</button>
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
          return <div key={index} className={message.role === "user" ? "ms-auto w-fit max-w-[85%] rounded-3xl bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground" : "group flex gap-3 text-sm leading-7"}>
            {message.role === "copilot" && <img src="/copilot-avatar.png" alt="" width="36" height="36" className="mt-0.5 h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-amber-400/30" />}
            <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap">{message.text}</p>
            {message.siteCaps && <ChatSiteLaunch capabilities={message.siteCaps} />}
            {message.careerLaunch && <Link to="/career-lab" className="mt-3 inline-block rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary">{t("career_chat_open")}</Link>}
            {!inPanel(index) && visuals(message)}
            {message.role === "copilot" && <button type="button" onClick={() => copyMessage(message.text, index)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-70 hover:opacity-100" aria-label={t("copilot_copy")}>{copied === index ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}{copied === index ? t("copilot_copied") : t("copilot_copy")}</button>}{message.role === "copilot" && canSpeak && <button type="button" onClick={() => speakingIdx === index ? (stopSpeaking(), setSpeakingIdx(null)) : speakMessage(message.text, index)} className="ms-3 mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-70 hover:opacity-100" aria-label={t(speakingIdx === index ? "speak_stop" : "speak_play")}>{speakingIdx === index ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}{t(speakingIdx === index ? "speak_stop" : "speak_play")}</button>}
            {message.role === "copilot" && message.question && <ChatRelated question={message.question} onAsk={(q) => void send(q)} />}
            {message.role === "copilot" && message.question && <FeedbackButtons question={message.question} knowledgeIds={(message.knowledge ?? []).map((k) => k.id)} lang={response?.language ?? "en"} />}
            </div>
          </div>;
        })}
        {toolOpen && <ChatToolPanel />}
        {isAnalyzing && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("copilot_working")}</div>}
      </div>
      {!user && !authLoading && <ChatAuthGate />}
      {user && <div className={started ? "sticky bottom-0 bg-background/90 pb-3 pt-2 backdrop-blur" : ""}>
        <form onSubmit={submit} className="welcome-composer flex items-end gap-1 rounded-[1.75rem] border border-border/60 bg-muted/50 p-2">
          <ChatToolMenu />
          <textarea rows={1} style={{ scrollbarWidth: "none" }} aria-label={t("copilot_input")} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={t("copilot_placeholder")} className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] leading-5 outline-none placeholder:text-muted-foreground/70" />
          {canSpeak && SpeechCtor && <button type="button" onClick={toggleTalk} aria-pressed={talk} aria-label={t(talk ? "talk_stop" : "talk_start")} title={t(talk ? "talk_stop" : "talk_start")} className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${talk ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}><Volume2 className="h-[18px] w-[18px]" strokeWidth={1.75} /></button>}
          {SpeechCtor && <button type="button" onClick={toggleVoice} aria-pressed={listening} aria-label={t(listening ? "voice_stop" : "voice_start")} title={t(listening ? "voice_stop" : "voice_start")} className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${listening ? "animate-pulse bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{listening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-[18px] w-[18px]" strokeWidth={1.75} />}</button>}
          <button type="submit" disabled={!question.trim() || isAnalyzing} aria-label={t("copilot_send")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-150 hover:brightness-110 active:scale-95 disabled:bg-muted-foreground/20 disabled:text-muted-foreground disabled:shadow-none">{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.25} />}</button>
        </form>
        <p className="mt-3 truncate text-center text-[11px] text-muted-foreground" aria-live="polite">{speechNote === "no_voice" ? t("speak_no_voice") : speechNote === "unsupported" ? t("speak_unsupported") : voiceError ? t("voice_error") : listening ? t("voice_listening") : t("disclaimer_one_line")}</p>
        <p className="mt-1 truncate text-center text-[10px] leading-4 text-muted-foreground/80">{t("legal_line_credit")}</p>
      </div>}
    </div>
    </div>
  );
}
