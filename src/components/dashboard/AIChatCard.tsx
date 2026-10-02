import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isCareerLaunchRequest } from "@/lib/career/chatRoute";
import { Check, Clipboard, History, Loader2, LogOut, Mic, Square, RotateCcw, Volume2, VolumeX, ArrowUp, Paperclip } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { ChatAssetCards } from "./ChatAssetCards";
import { ChatCalculationCard } from "./ChatCalculationCard";
import { ChatComparisonTable } from "./ChatComparisonTable";
import { ChatNewsList } from "./ChatNewsList";
import { ChatAuthGate } from "./ChatAuthGate";
import { useAuth } from "@/context/useAuth";
import { createConversation, deleteConversation, listConversations, loadMessages, saveMessage, type ChatConversation } from "@/lib/copilot/chatHistory";
import { ChatSiteLaunch } from "./ChatSiteLaunch";
import { ChatCockpit } from "./ChatCockpit";
import { ChatProvenance } from "./ChatProvenance";
import { runTool } from "@/lib/intelligence/tools";
import type { Provenance } from "@/lib/intelligence/envelope";
import { ChatChartCard } from "./ChatChartCard";
import { ChatCompareChart } from "./ChatCompareChart";
import { ChatToolPanel } from "./ChatToolPanel";
import { ChatToolMenu } from "./ChatToolMenu";
import { toolForPath } from "./chatTools";
import { openingLine } from "@/lib/copilot/toolKeywords";
import { ChatRelated } from "./ChatRelated";
import { ChatAlsoAsked } from "./ChatAlsoAsked";
import { ChatTrace } from "./ChatTrace";
import { formatAgentResult, parseAgentRequest } from "@/lib/intelligence/superAgents";
import { runPlan, shouldOrchestrate } from "@/lib/copilot/orchestrate";
import { planQuestion } from "@/lib/copilot/planner";
import { retrieve, type Passage } from "@/lib/search/retrieve";
import { critique } from "@/lib/intelligence/critique";
import { describePlan, decompose } from "@/lib/copilot/decompose";
import { recordTrace } from "@/lib/intelligence/traceStore";
import { isDeepRequest, runDeepResearch, stepsForLevel, stripTrigger } from "@/lib/copilot/deepResearch";
import { defaultMemoryApi } from "@/lib/memory/memoryApi";
import { downloadText, printHtml, toCsv, toPrintHtml } from "@/lib/copilot/exportChat";
import { briefHeader, conceptOfTheDay, isDailyBrief } from "@/lib/copilot/dailyBrief";
import { askNext, gradeAnswer, isExamStart, newExamState, parseExamAnswer } from "@/lib/copilot/examDesk";
import { buildQuizBank } from "@/lib/quizBank";
import { parseMemoryCommand } from "@/lib/memory/memoryCommands";
import { runMemoryCommand } from "@/lib/memory/memoryChat";
import { ChatSidebar, type SidebarMode } from "./ChatSidebar";
import { isSaved, loadSaved, removeSaved, toggleSaved, type SavedAnswer } from "@/lib/copilot/savedAnswers";
import { ChatLinkedText } from "./ChatLinkedText";
import { type TraceStep } from "@/lib/copilot/planner";
import { routeRequest } from "@/lib/intelligence/router";
import { VoiceOrb } from "./VoiceOrb";
import { LevelPicker } from "./LevelPicker";
import { checkFile, giveConsent, hasConsent } from "@/lib/copilot/fileAnalysis";
import { askAboutFile, prepareFile, type PreparedFile } from "@/lib/copilot/fileClient";
import { readLevel, saveLevel, setActiveLevel, type Level } from "@/lib/copilot/levels";
import { ChatSidePanel } from "./ChatSidePanel";
import { hasVisuals, useWide } from "./chatPanelState";
import { resolveSiteIntent, SITE_CAPABILITIES, type SiteCapability } from "@/lib/copilot/siteCapabilities";
import { ChatDataDesk } from "./ChatDataDesk";
import { ChatCalcCard } from "./ChatCalcCard";
import { ChatMathCard } from "./ChatMathCard";
import { ChatDepth } from "./ChatDepth";
import { depthSections } from "@/lib/copilot/depth";
import { ChatAgentTag } from "./ChatAgentTag";
import { getAgent, readPickedAgent, routeAgent, savePickedAgent, AGENTS } from "@/lib/agents";
import { ChatSymbolCard } from "./ChatSymbolCard";
import { parseSymbolQuestion, type SymbolInfo } from "@/lib/copilot/symbolDesk";
import { ChatScenarioCard } from "./ChatScenarioCard";
import { type ScenarioPart } from "@/lib/copilot/scenarioDesk";
import { ChatWbCard } from "./ChatWbCard";
import { type WbResult } from "@/lib/copilot/worldBankDesk";
import { ChatFxCard } from "./ChatFxCard";
import { type FxResult } from "@/lib/copilot/fxDesk";
import { type MathDeskResult } from "@/lib/copilot/mathDesk";
import { ChatLearnPath } from "./ChatLearnPath";
import { ChatKnowledge, FeedbackButtons } from "./ChatKnowledge";
import { searchKnowledge, recordGap } from "@/lib/knowledge/knowledgeClient";
import { wantsKnowledgeLookup, type KnowledgeItem } from "@/lib/knowledge/knowledge";
import { looksLikeLearningPathRequest } from "@/lib/copilot/learnDesk";
import { type CalcDeskResult } from "@/lib/copilot/calcDesk";
import { loadDataDesk, type DataDeskResult } from "@/lib/copilot/dataDesk";
import { ChatStrategyCard } from "./ChatStrategyCard";
import { ChatStrategyFitCard } from "./ChatStrategyFitCard";
import { speak, stopSpeaking, unlockSpeech, getSynth, type SpeakResult } from "@/lib/copilot/speechOutput";
import { appendDictation, getSpeechRecognition, joinTranscript, speechLocale, voiceProblem, isIOS, type SpeechRecognitionLike, type VoiceProblem } from "@/lib/copilot/voiceInput";
import { useAnalysis } from "@/context/useAnalysis";
import type { CopilotResponse } from "@/lib/copilotResponse";

/** Minimum BM25 score for a retrieved passage to be shown; weaker matches are noise. */
const MIN_RETRIEVE_SCORE = 3;
interface Message { retrieved?: Passage[]; prov?: Provenance; agent?: { id: string | null; switchTo?: string }; deep?: { steps: number; reworded: boolean }; trace?: TraceStep[]; role: "user" | "copilot"; fileNote?: string; fromFile?: boolean; text: string; response?: CopilotResponse; careerLaunch?: boolean; siteCaps?: SiteCapability[]; desk?: DataDeskResult; calc?: CalcDeskResult; math?: MathDeskResult; fx?: FxResult | null; fxFailed?: boolean; symbol?: SymbolInfo; wb?: WbResult | null; scenario?: ScenarioPart[]; learnPath?: boolean; question?: string; knowledge?: KnowledgeItem[]; }

export function AIChatCard({ workstation = false }: { workstation?: boolean } = {}) {
  const { t, language } = useLanguage();
  const { askCopilot, isAnalyzing, reset } = useAnalysis();
  const navigate = useNavigate();
  const toolOpen = toolForPath(useLocation().pathname) !== null;
  const { user, loading: authLoading, signOut } = useAuth();
  const examRef = useRef(newExamState());
  const memoryApi = useMemo(() => (user ? defaultMemoryApi(user.id) : undefined), [user]);
  const conversationId = useRef<string | null>(null);
  const savedCount = useRef(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [saved, setSaved] = useState<SavedAnswer[]>([]);
  useEffect(() => { setSaved(user ? loadSaved(user.id) : []); }, [user]);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [dismissedPanel, setDismissedPanel] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const SpeechCtor = getSpeechRecognition();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<VoiceProblem>(null);
  const [voiceCode, setVoiceCode] = useState<string | null>(null);
  const [voiceTrace, setVoiceTrace] = useState<string[]>([]);
  const vtrace = (step: string) => setVoiceTrace((cur) => [...cur.slice(-5), step]);
  const voiceNote = !SpeechCtor ? t("voice_unsupported") : voiceError ? t(voiceError === "permission" ? "voice_error" : voiceError === "service" && isIOS() ? "voice_service_ios" : `voice_${voiceError}`) : null;
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileBusy, setFileBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState<PreparedFile | null>(null);
  const [fileNote, setFileNote] = useState<string | null>(null);
  const [consentAsk, setConsentAsk] = useState(false);
  const [consented, setConsented] = useState(() => hasConsent());
  function openFilePicker() { if (!consented) { setConsentAsk(true); return; } fileInput.current?.click(); }
  async function onFileChosen(file: File | undefined) {
    if (!file) return;
    const problem = checkFile(file);
    if (problem) { setFileNote(t(problem === "type" ? "file_bad_type" : "file_too_big")); return; }
    const prepared = await prepareFile(file).catch(() => null);
    if (!prepared) { setFileNote(t("file_too_big")); return; }
    setFileNote(null); setPendingFile(prepared);
  }
  const [pickedAgent, setPickedAgent] = useState<string | null>(() => readPickedAgent(user?.id));
  useEffect(() => { setPickedAgent(readPickedAgent(user?.id)); }, [user?.id]);
  const pickAgent = (id: string | null) => { setPickedAgent(id); savePickedAgent(user?.id, id); };
  const [level, setLevel] = useState<Level>(() => readLevel(user?.id));
  useEffect(() => { setLevel(readLevel(user?.id)); }, [user?.id]);
  useEffect(() => { setActiveLevel(level); }, [level]);
  const changeLevel = (l: Level) => { if (saveLevel(user?.id, l)) setLevel(l); };
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
  function toggleTalk() { if (talk) { setTalk(false); stopSpeaking(); setSpeakingIdx(null); recognitionRef.current?.stop(); } else { unlockSpeech(); setTalk(true); if (SpeechCtor && !listening) toggleVoice(); } }
  useEffect(() => () => stopSpeaking(), []);
  useEffect(() => () => recognitionRef.current?.stop(), []);
  const wantListening = useRef(false);
  const fallbackLang = useRef<string | null>(null);
  const dictated = useRef("");
  function startRecognition(base: string) {
    if (!SpeechCtor) return;
    vtrace("new recognizer");
    const rec = new SpeechCtor();
    rec.onstart = () => vtrace("onstart"); rec.onaudiostart = () => vtrace("audio on"); rec.onspeechstart = () => vtrace("speech heard"); rec.onnomatch = () => vtrace("no match");
    rec.lang = fallbackLang.current ?? speechLocale(language); rec.interimResults = true; rec.continuous = false;
    rec.onresult = (event) => {
      const said = appendDictation(base, joinTranscript(event.results));
      dictated.current = said;
      if (talkRef.current) return;
      setQuestion(said);
    };
    rec.onerror = (e) => {
      vtrace(`error: ${e?.error ?? "unknown"}`);
      // iOS can answer service-not-allowed for a language its recognizer lacks. Try English once so the cause is visible and English users are served.
      if ((e?.error === "service-not-allowed" || e?.error === "language-not-supported") && !fallbackLang.current && rec.lang.startsWith("he")) { fallbackLang.current = "en-US"; vtrace("retry en-US"); recognitionRef.current = null; window.setTimeout(() => { try { startRecognition(dictated.current || base); } catch { setVoiceError("service"); setVoiceCode("service-not-allowed"); wantListening.current = false; setListening(false); } }, 0); return; }
      setVoiceCode(e?.error ?? "unknown"); wantListening.current = false; setVoiceError(voiceProblem(e?.error)); setListening(false); };
    rec.onend = () => {
      if (recognitionRef.current !== rec) return; // replaced by the English retry
      vtrace("onend");
      // Browsers stop after a short pause; a long question keeps going until the user taps stop.
      if (wantListening.current && !talkRef.current) { try { startRecognition(dictated.current || base); return; } catch { /* fall through */ } }
      const said = dictated.current; wantListening.current = false; setListening(false);
      if (talkRef.current && said.trim()) { setQuestion(""); void sendRef.current?.(said); }
    };
    recognitionRef.current = rec;
    vtrace("calling start()");
    rec.start();
    vtrace("start() returned");
  }
  function toggleVoice() {
    vtrace(SpeechCtor ? "tap" : "tap: no SpeechRecognition in this browser");
    if (!SpeechCtor) return;
    if (listening) { wantListening.current = false; recognitionRef.current?.stop(); return; }
    setVoiceError(null); setVoiceCode(null); dictated.current = ""; wantListening.current = true;
    try { startRecognition(question); setListening(true); } catch (err) { wantListening.current = false; setVoiceError("permission"); setVoiceCode(`start() threw: ${err instanceof Error ? err.name + " " + err.message : String(err)}`.slice(0, 120)); vtrace("start() threw"); }
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
  const modes: SidebarMode[] = [
    { id: "learn", label: t("mode_learn"), prompt: t("mode_learn_prompt") },
    { id: "calc", label: t("mode_calc"), prompt: t("mode_calc_prompt") },
    { id: "market", label: t("mode_market"), prompt: t("mode_market_prompt") },
    { id: "deep", label: t("mode_deep"), prompt: t("mode_deep_prompt") },
  ];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!workstation && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setQuestion("/"); composerRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [workstation]);
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
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [messages, isAnalyzing]);

  const exportable = () => messages.filter((m) => m.text).map((m) => ({ role: m.role, text: m.text }));
  function exportCsv() { downloadText("invested-chat.csv", "text/csv;charset=utf-8", toCsv(exportable(), language === "he" ? "he" : "en")); }
  function exportPdf() { const he = language === "he"; printHtml(toPrintHtml(exportable(), he ? "he" : "en", he ? "שיחה עם InvestED+" : "InvestED+ conversation", he ? "יוצא מהמסך. לא ייעוץ השקעות." : "Exported from the screen. Not investment advice.")); }
  function submit(event: FormEvent) { event.preventDefault(); void send(question); }
  async function send(raw: string) {
    const text = raw.trim();
    if ((!text && !pendingFile) || isAnalyzing) return;
    setQuestion("");
    if (pendingFile) {
      const file = pendingFile; setPendingFile(null);
      setMessages((current) => [...current, { role: "user", text: text || file.name, fileNote: file.name }]);
      setFileBusy(true);
      const reply = await askAboutFile(file, text, language === "he" ? "he" : "en");
      setFileBusy(false);
      setMessages((current) => [...current, { role: "copilot", text: reply ?? t("file_failed"), fromFile: reply !== null }]);
      return;
    }
    { const r = routeAgent(text, pickedAgent); setMessages((current) => [...current, { role: "user", text, agent: { id: r.agentId, switchTo: r.suggestSwitchTo } }]); }
    if (isDailyBrief(text)) { const d = new Date(), lang3 = language === "he" ? "he" : "en"; setMessages((current) => [...current, { role: "copilot", text: briefHeader(d, lang3) }]); await send(conceptOfTheDay(d, lang3).ask); await send(lang3 === "he" ? "מובילי השוק" : "market movers"); const a = askNext(examRef.current, buildQuizBank(t), lang3); examRef.current = a.state; setMessages((current) => [...current, { role: "copilot", text: a.text }]); return; }
    { const ex = examRef.current; const pick = ex.current ? parseExamAnswer(text, ex.current.options.length) : null; const lang2 = language === "he" ? "he" : "en";
      if (ex.current && pick !== null) { const g = gradeAnswer(ex, pick, lang2); examRef.current = g.state; setMessages((current) => [...current, { role: "copilot", text: g.text }]); return; }
      if (isExamStart(text)) { const a = askNext(ex, buildQuizBank(t), lang2); examRef.current = a.state; setMessages((current) => [...current, { role: "copilot", text: a.text }]); return; } }
    { const mc = parseMemoryCommand(text); if (mc) { const reply = await runMemoryCommand(mc, memoryApi, language === "he" ? "he" : "en"); setMessages((current) => [...current, { role: "copilot", text: reply }]); return; } }
    await dispatch(text);
  }
  /** Long questions with an engine part run as an ordered plan; everything else is answered as one question. */
  async function dispatch(text: string) {
    if (!isDeepRequest(text)) {
      const d = decompose(text);
      if (shouldOrchestrate(text, d, planQuestion(text).route)) {
        const he = language === "he";
        const outcomes = await runPlan(d.tasks, async (task) => {
          setMessages((current) => [...current, { role: "copilot", text: `${he ? "משימה" : "Task"} ${task.index + 1}/${d.tasks.length}: ${task.text}` }]);
          await answerOne(task.text);
        });
        const bad = outcomes.filter((o) => o.status !== "done");
        if (bad.length) setMessages((current) => [...current, { role: "copilot", text: he ? `לא הושלמו ${bad.length} משימות: ${bad.map((o) => o.task.index + 1).join(", ")}.` : `${bad.length} task(s) did not finish: ${bad.map((o) => o.task.index + 1).join(", ")}.` }]);
        return;
      }
    }
    await answerOne(text);
  }
  /** Records route and timing for every answer (deep research records its own, with its self-check). Only a hash of the question is kept. */
  async function answerOne(text: string) {
    if (isDeepRequest(text)) return answerCore(text);
    const plan = planQuestion(text);
    const started = Date.now();
    let ok = true;
    try { await answerCore(text); } catch (e) { ok = false; throw e; } finally {
      recordTrace({ at: Date.now(), route: plan.route, tools: plan.tools, ms: Date.now() - started, ok, failedChecks: ok ? [] : ["error"], live: "none", question: text });
    }
  }
  async function answerCore(text: string) {
    const agentReq = parseAgentRequest(text);
    if (agentReq) {
      const lang = /[א-ת]/.test(agentReq.question) ? "he" : "en";
      const result = agentReq.agent.run(agentReq.question, lang);
      const trace: TraceStep[] = [
        { text: { en: `Handed the question to the ${agentReq.agent.title.en.toLowerCase()}.`, he: `העברתי את השאלה ל${agentReq.agent.title.he}.` } },
        { text: { en: "Took stored explanations and links between stored concepts. No web, no live data, no model.", he: "לקחתי הסברים שמורים וקשרים בין מושגים שמורים. בלי רשת, בלי נתונים חיים ובלי מודל." }, trust: "EDUCATIONAL" },
      ];
      setMessages((current) => [...current, { role: "copilot", text: formatAgentResult(result, lang), trace, question: agentReq.question }]);
      return;
    }
    if (isDeepRequest(text)) {
      const lang = /[א-ת]/.test(text) ? "he" : "en";
      const q = stripTrigger(text);
      const at = { i: -1 };
      setMessages((current) => { at.i = current.length; return [...current, { role: "copilot", text: t("deep_working") }]; });
      const started = Date.now();
      const result = await runDeepResearch(q, lang, (done, total, label) => setMessages((current) => current.map((m, i) => i === at.i ? { ...m, text: `${t("deep_working")} ${done}/${total}: ${label}` } : m)), undefined, level);
      const trace: TraceStep[] = [
        { text: { en: `Split the question into ${result.steps.length} known topics (max ${stepsForLevel(level)} on this level) and took the stored explanation for each, one after the other.`, he: `פיצלתי את השאלה ל-${result.steps.length} נושאים מוכרים (עד ${stepsForLevel(level)} ברמה הזו) ולקחתי לכל אחד את ההסבר השמור, בזה אחר זה.` }, trust: "EDUCATIONAL" },
        { text: result.reworded ? { en: "A free AI model reworded the joined text. The server rejected any new number or ticker.", he: "מודל AI חינמי ניסח מחדש את הטקסט המחובר. השרת פוסל כל מספר או סימול חדש." } : { en: "No AI rewording this time. The stored text is shown as written.", he: "בלי ניסוח מחדש הפעם. הטקסט השמור מוצג כפי שנכתב." }, trust: "ANALYSIS" },
        { text: { en: describePlan(decompose(q), "en"), he: describePlan(decompose(q), "he") }, trust: "EDUCATIONAL" },
      ];
      const review = result.text ? critique(result.text, { sources: result.steps.map((st) => ({ label: st.label, text: st.text })), lang, missingTopics: result.missing }) : null;
      if (review) trace.push({ text: review.ok ? { en: "Self-check passed: numbers match the sources, no advice or guarantee wording, language matches.", he: "בדיקה עצמית עברה: המספרים תואמים למקורות, אין ניסוח של ייעוץ או הבטחה, והשפה תואמת." } : { en: `Self-check flagged: ${review.failed.map((c) => c.note.en).join(" ")}`, he: `הבדיקה העצמית סימנה: ${review.failed.map((c) => c.note.he).join(" ")}` }, trust: "ANALYSIS" });
      recordTrace({ at: Date.now(), route: "deep", tools: [], ms: Date.now() - started, ok: review?.ok ?? false, failedChecks: review?.failed.map((c) => c.id) ?? ["empty"], live: "none", question: q });
      setMessages((current) => current.map((m, i) => i === at.i ? { role: "copilot", text: result.text ? result.text + (result.missing.length ? `\n\n${t("deep_missing")} ${result.missing.join(", ")}` : "") : t("deep_none"), trace: result.text ? trace : undefined, deep: result.text ? { steps: result.steps.length, reworded: result.reworded } : undefined, question: result.text ? q : undefined } : m));
      return;
    }
    const symQ = parseSymbolQuestion(text);
    if (symQ) {
      const symOut = await runTool<SymbolInfo>("symbol", symQ, { agentId: pickedAgent });
      const info = symOut.ok ? symOut.result.value : null;
      if (info && symOut.ok) {
        const trace: TraceStep[] = [
          { text: { en: "Recognized a question about a ticker.", he: "זיהיתי שאלה על סימול." } },
          { text: { en: "Looked it up in a static list built from FinanceDatabase. It holds names and types, not prices.", he: "חיפשתי ברשימה סטטית שנבנתה מ-FinanceDatabase. היא כוללת שמות וסוגים, בלי מחירים." }, trust: "KNOWLEDGE" },
          { text: { en: "No model wrote this.", he: "אף מודל לא כתב את זה." } }];
        setMessages((current) => [...current, { role: "copilot", trace, text: language === "he" ? `${info.symbol} הוא ${info.kind === "equity" ? "סימול של מניה" : "סימול של קרן סל או קרן"}:` : `${info.symbol} is ${info.kind === "equity" ? "a stock" : "an ETF or fund"}:`, symbol: info, prov: symOut.result.provenance }]);
        return;
      }
    }
    const plan = routeRequest(text).plan;
    const trace = plan.trace;
    const keywordPath = plan.toolPath ?? null;
    const keywordTool = keywordPath ? toolForPath(keywordPath) : null;
    if (keywordPath && keywordTool) {
      setMessages((current) => [...current, { role: "copilot", trace, text: openingLine(text, keywordTool.tool?.labelKey) }]);
      navigate(keywordPath);
      return;
    }
    if (isCareerLaunchRequest(text)) {
      setMessages((current) => [...current, { role: "copilot", trace, text: t("career_chat_launch"), careerLaunch: true }]);
      return;
    }
    if (looksLikeLearningPathRequest(text)) {
      setMessages((current) => [...current, { role: "copilot", trace, text: t("learnpath_lead"), learnPath: true }]);
      return;
    }
    const site = resolveSiteIntent(text);
    if (site) {
      setMessages((current) => [...current, site.kind === "overview"
        ? { role: "copilot", trace, text: t("cap_overview"), siteCaps: SITE_CAPABILITIES }
        : { role: "copilot", trace, text: t("cap_open_lead"), siteCaps: site.matches }]);
      return;
    }
    const calcOut = plan.calc ? await runTool<CalcDeskResult>(plan.tools[0], text, { agentId: pickedAgent }) : null;
    const calc = calcOut && calcOut.ok ? calcOut.result.value : (plan.calc ?? null);
    if (calc) {
      setMessages((current) => [...current, { role: "copilot", trace, text: t("calc_lead"), calc, prov: calcOut && calcOut.ok ? calcOut.result.provenance : undefined }]);
      return;
    }
    if (plan.scenario) {
      const scOut = await runTool(plan.tools[0], text, { agentId: pickedAgent });
      setMessages((current) => [...current, { role: "copilot", trace, text: language === "he" ? "חילקתי את השאלה לחלקים והנה כל חישוב:" : "I split your question into parts. Here is each calculation:", scenario: plan.scenario, prov: scOut.ok ? scOut.result.provenance : undefined }]);
      return;
    }
    if (plan.wb) {
      const wbOut = await runTool<WbResult>(plan.tools[0], plan.wb, { agentId: pickedAgent });
      const wb = wbOut.ok ? wbOut.result.value : null;
      setMessages((current) => [...current, { role: "copilot", trace, text: wb ? (language === "he" ? "הנה הנתון:" : "Here is the statistic:") : (language === "he" ? "לא הצלחתי לטעון עכשיו את הנתון מהבנק העולמי, ולכן לא מציגה כלום. נסו שוב בעוד רגע." : "I could not load that statistic from the World Bank right now, so I am not showing anything. Try again in a moment."), wb, prov: wbOut.ok ? wbOut.result.provenance : undefined }]);
      return;
    }
    if (plan.fx) {
      const fxOut = await runTool<FxResult>(plan.tools[0], plan.fx, { agentId: pickedAgent });
      const fx = fxOut.ok ? fxOut.result.value : null;
      setMessages((current) => [...current, { role: "copilot", trace, text: fx ? (language === "he" ? "הנה ההמרה:" : "Here is the conversion:") : (language === "he" ? "לא הצלחתי לטעון עכשיו את שער היחס, ולכן לא המרתי. נסו שוב בעוד רגע." : "I could not load the reference rate right now, so I did not convert anything. Try again in a moment."), fx, prov: fxOut.ok ? fxOut.result.provenance : undefined }]);
      return;
    }
    if (plan.math) {
      const mOut = await runTool(plan.tools[0], text, { agentId: pickedAgent });
      setMessages((current) => [...current, { role: "copilot", trace, text: language === "he" ? "הנה החישוב:" : "Here is the calculation:", math: plan.math, prov: mOut.ok ? mOut.result.provenance : undefined }]);
      return;
    }
    const deskKind = plan.desk ?? null;
    if (deskKind) {
      try {
        const desk = await loadDataDesk(deskKind);
        setMessages((current) => [...current, { role: "copilot", trace, text: t(`desk_${deskKind}_lead`), desk }]);
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
      const asked = turn.response.language === "he" ? "he" : "en";
      const mainText = turn.response.text;
      const retrieved = wantsKnowledgeLookup(turn.response.intent) && !knowledge.length ? retrieve(text, asked, 3).filter((r) => r.score >= MIN_RETRIEVE_SCORE && !mainText.includes(r.text.slice(0, 30))).slice(0, 2) : [];
      setMessages((current) => [...current, { role: "copilot", trace, text: turn.response.text, response: turn.response, question: text, knowledge, retrieved }]);
    } catch {
      setMessages((current) => [...current, { role: "copilot", text: t("copilot_error") }]);
    }
  }

  sendRef.current = send; toggleVoiceRef.current = toggleVoice;
  useEffect(() => { const last = messages[messages.length - 1]; if (talk && last?.role === "copilot" && last.text) speakMessage(last.text, messages.length - 1); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);
  function clearConversation() { examRef.current = newExamState(); reset(); setMessages([]); setQuestion(""); conversationId.current = null; savedCount.current = 0; }
  async function copyMessage(text: string, index: number) { await navigator.clipboard.writeText(text); setCopied(index); window.setTimeout(() => setCopied(null), 1500); }

  const wideViewport = useWide();
  const wide = wideViewport && !workstation;
  const panelIndex = wide ? messages.reduce((acc, m, i) => (m.role === "copilot" && hasVisuals(m) ? i : acc), -1) : -1;
  const panelOpen = panelIndex >= 0 && dismissedPanel !== panelIndex;
  const inPanel = (index: number) => panelOpen && index === panelIndex;
  const visuals = (message: Message) => {
    const response = message.response;
    const assets = response?.assets ?? [];
    return (<>
            {!wide && assets.length > 0 && <div className="mt-3 space-y-3">{assets.length >= 2 && <ChatCompareChart symbols={[assets[0].symbol, assets[1].symbol]} />}{assets.slice(0, 2).map((a) => <ChatChartCard key={a.symbol} symbol={a.symbol} />)}</div>}
            {message.desk && <ChatDataDesk data={message.desk} />}
            {message.calc && <ChatCalcCard data={message.calc} />}
            {message.symbol && <ChatSymbolCard info={message.symbol} onAsk={(q) => void send(q)} />}
            {message.scenario && <ChatScenarioCard parts={message.scenario} />}
            {message.wb && <ChatWbCard data={message.wb} />}
            {message.fx && <ChatFxCard data={message.fx} />}
            {message.prov && <ChatProvenance prov={message.prov} />}
            {message.math && <ChatMathCard data={message.math} />}
            {message.retrieved && message.retrieved.length > 0 && (
              <div className="mt-2 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs leading-6" data-testid="retrieved-passages">
                <p className="font-semibold">{t("retrieved_lead")}</p>
                {message.retrieved.map((r) => <p key={r.id}><span className="font-medium">{r.label}: </span>{r.text}</p>)}
              </div>
            )}
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
  const started = messages.length > 0 || (!workstation && toolOpen);
  const panelSymbols = panelOpen ? (messages[panelIndex].response?.assets ?? []).map((a) => a.symbol) : [];
  return (
    <div data-workstation={workstation || undefined} dir="ltr" className={panelOpen ? "mx-auto grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]" : "contents"}>
    {panelOpen && <ChatSidePanel symbols={panelSymbols} onClose={() => setDismissedPanel(panelIndex)}>{visuals(messages[panelIndex])}</ChatSidePanel>}
    <div dir={language === "he" ? "rtl" : "ltr"} className={`mx-auto flex w-full max-w-3xl flex-col ${started ? "min-h-[calc(100vh-9rem)]" : "min-h-[calc(100vh-14rem)] justify-center"}`}>
      {!started && (
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/copilot-avatar.png" alt="" width="56" height="56" className="h-14 w-14 rounded-2xl object-cover" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">{t(user || authLoading ? "copilot_home_title" : "gate_welcome")}</h1>
        </div>
      )}
      {!started && user && !workstation && <ChatCockpit saved={saved} onAsk={(q) => void send(q)} />}
      {user && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <button type="button" onClick={() => void toggleHistory()} aria-expanded={historyOpen} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><History className="h-3.5 w-3.5" aria-hidden="true" />{t("history_open")}</button>
          <button type="button" onClick={() => { clearConversation(); void signOut(); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><LogOut className="h-3.5 w-3.5" aria-hidden="true" />{t("auth_sign_out")}</button>
        </div>
      )}
      {user && <ChatSidebar open={historyOpen} onClose={() => setHistoryOpen(false)} onNew={clearConversation}
        conversations={conversations} onOpenConversation={(id) => void openConversation(id)} onDeleteConversation={(id) => void removeConversation(id)}
        saved={saved} onAskSaved={(q) => void send(q)} onRemoveSaved={(id) => setSaved(removeSaved(user.id, id))}
        modes={modes} onMode={(prompt) => setQuestion(prompt)} memoryApi={memoryApi} onExportCsv={messages.length ? exportCsv : undefined} onExportPdf={messages.length ? exportPdf : undefined} agents={AGENTS} pickedAgent={pickedAgent} onPickAgent={pickAgent} />}
      {started && (
        <div className="mb-2 flex justify-end">
          <button type="button" onClick={clearConversation} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /><span>{t("copilot_clear")}</span></button>
        </div>
      )}
      {started && <h1 className="sr-only">{t("chat_page_title")}</h1>}
      <div ref={scrollRef} aria-live="polite" aria-busy={isAnalyzing} className={started ? "flex-1 space-y-6 pb-6" : ""}>
        {messages.map((message, index) => {
          const response = message.response;
          return <div key={index} className={message.role === "user" ? "ms-auto w-fit max-w-[85%] rounded-3xl bg-[hsl(221_83%_44%)] px-4 py-2.5 text-sm leading-6 text-white [&_p]:text-white" : "group flex gap-3 text-sm leading-7"}>
            {message.role === "copilot" && <img src="/copilot-avatar.png" alt="" width="36" height="36" className="mt-0.5 h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-amber-400/30" />}
            <div className="min-w-0 flex-1">
            {message.role === "copilot" && (() => { const prev = messages.slice(0, index).reverse().find((m) => m.role === "user"); return prev?.agent ? <ChatAgentTag agentId={prev.agent.id} switchTo={prev.agent.switchTo} onSwitch={pickAgent} /> : null; })()}
            {message.role === "copilot" && message.response ? <ChatLinkedText text={message.text} onAsk={(q) => void send(q)} /> : <p dir={/[א-ת]/.test(message.text) ? "rtl" : "ltr"} className="whitespace-pre-wrap">{message.text}</p>}
            {message.siteCaps && <ChatSiteLaunch capabilities={message.siteCaps} />}
            {message.careerLaunch && <Link to="/career-lab" className="mt-3 inline-block rounded-lg border border-primary px-3 py-2 text-xs font-bold text-primary">{t("career_chat_open")}</Link>}
            {!inPanel(index) && visuals(message)}
            {message.role === "copilot" && <button type="button" onClick={() => copyMessage(message.text, index)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-70 hover:opacity-100" aria-label={t("copilot_copy")}>{copied === index ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}{copied === index ? t("copilot_copied") : t("copilot_copy")}</button>}{message.role === "copilot" && canSpeak && <button type="button" onClick={() => speakingIdx === index ? (stopSpeaking(), setSpeakingIdx(null)) : speakMessage(message.text, index)} className="ms-3 mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-70 hover:opacity-100" aria-label={t(speakingIdx === index ? "speak_stop" : "speak_play")}>{speakingIdx === index ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}{t(speakingIdx === index ? "speak_stop" : "speak_play")}</button>}
            {message.deep && <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[#B8862B] dark:text-[#E0B253]">{t("deep_label").replace("{n}", String(message.deep.steps))}</p>}
            {message.role === "copilot" && level !== "basic" && <ChatDepth sections={depthSections(level, { calc: message.calc, desk: message.desk, assets: message.response?.assets, question: message.question, math: message.math, fx: message.fx, wb: message.wb, symbol: message.symbol, scenario: message.scenario })} />}
            {message.role === "copilot" && message.trace && <ChatTrace steps={message.trace} />}
            {message.role === "copilot" && message.question && user && <button type="button" onClick={() => setSaved(toggleSaved(user.id, message.question!, message.text))} aria-pressed={isSaved(saved, message.question, message.text)} className="mt-2 ms-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-70 hover:opacity-100">{isSaved(saved, message.question, message.text) ? t("saved_done") : t("saved_do")}</button>}
            {message.fromFile && <p className="mt-2 text-[11px] text-muted-foreground">{t("file_label")}</p>}
            {message.role === "copilot" && message.question && <ChatAlsoAsked question={message.question} answer={message.text} />}
            {message.role === "copilot" && message.question && <ChatRelated question={message.question} onAsk={(q) => void send(q)} />}
            {message.role === "copilot" && message.question && <FeedbackButtons question={message.question} knowledgeIds={(message.knowledge ?? []).map((k) => k.id)} lang={response?.language ?? "en"} />}
            </div>
          </div>;
        })}
        {toolOpen && !workstation && <ChatToolPanel />}
        {(isAnalyzing || fileBusy) && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("copilot_working")}</div>}
        <div ref={endRef} className="scroll-mb-48" aria-hidden="true" />
      </div>
      {talk && <VoiceOrb accent={(() => { const last = [...messages].reverse().find((m) => m.role === "user"); return getAgent(last?.agent?.id ?? pickedAgent)?.color ?? null; })()} state={speakingIdx !== null ? "speaking" : isAnalyzing ? "thinking" : listening ? "listening" : "idle"} onClose={toggleTalk} onTapOrb={() => { if (speakingIdx !== null) { stopSpeaking(); setSpeakingIdx(null); } else toggleVoice(); }} note={speechNote === "no_voice" ? t("speak_no_voice") : speechNote === "unsupported" ? t("speak_unsupported") : voiceNote} code={voiceError ? voiceCode : null} trace={voiceTrace} />}
      {!user && !authLoading && <ChatAuthGate />}
      {user && <div className={started ? "sticky bottom-0 bg-background/90 pb-3 pt-2 backdrop-blur" : ""}>
        {consentAsk && !consented && (
          <div role="alertdialog" aria-label={t("file_consent_title")} className="mb-2 rounded-2xl border border-border bg-muted/50 p-3 text-xs leading-5" data-testid="file-consent">
            <p className="font-semibold">{t("file_consent_title")}</p>
            <p className="mt-1 text-muted-foreground">{t("file_consent_body")}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { giveConsent(); setConsented(true); setConsentAsk(false); window.setTimeout(() => fileInput.current?.click(), 0); }} className="rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground">{t("file_consent_yes")}</button>
              <button type="button" onClick={() => setConsentAsk(false)} className="rounded-full border border-border px-3 py-1.5 text-muted-foreground">{t("file_consent_no")}</button>
            </div>
          </div>
        )}
        {(pendingFile || fileNote) && <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">{pendingFile ? <><Paperclip className="h-3.5 w-3.5" />{pendingFile.name}<button type="button" onClick={() => setPendingFile(null)} className="underline">{t("file_remove")}</button></> : fileNote}</p>}
        <form onSubmit={submit} className="welcome-composer relative flex flex-wrap items-end gap-1 sm:flex-nowrap rounded-[1.75rem] border border-border/60 bg-muted/50 p-2">
          <ChatToolMenu query={question.startsWith("/") ? question.slice(1) : null} onPlus={() => { setQuestion("/"); composerRef.current?.focus(); }} onPick={() => setQuestion((q) => (q.startsWith("/") ? "" : q))} />
          <textarea ref={composerRef} rows={1} style={{ scrollbarWidth: "none" }} aria-label={t("copilot_input")} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape" && question.startsWith("/")) { setQuestion(""); return; } if (event.key === "Enter" && !event.shiftKey && question.startsWith("/")) { event.preventDefault(); return; } if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={t("copilot_placeholder")} className="order-first max-h-40 min-h-11 w-full min-w-0 basis-full resize-none sm:order-none sm:w-auto sm:flex-1 sm:basis-0 bg-transparent px-2 py-2.5 text-[15px] leading-5 outline-none placeholder:text-muted-foreground/70" />
          <input ref={fileInput} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { void onFileChosen(e.target.files?.[0]); e.target.value = ""; }} />
          <button type="button" onClick={openFilePicker} aria-label={t("file_attach")} title={t("file_attach")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"><Paperclip className="h-[18px] w-[18px]" strokeWidth={1.75} /></button>
          <LevelPicker level={level} onChange={changeLevel} />
          {canSpeak && SpeechCtor && <button type="button" onClick={toggleTalk} aria-pressed={talk} aria-label={t(talk ? "talk_stop" : "talk_start")} title={t(talk ? "talk_stop" : "talk_start")} className={`ms-auto sm:ms-0 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${talk ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}><Volume2 className="h-[18px] w-[18px]" strokeWidth={1.75} /></button>}
          {SpeechCtor && <button type="button" onClick={toggleVoice} aria-pressed={listening} aria-label={t(listening ? "voice_stop" : "voice_start")} title={t(listening ? "voice_stop" : "voice_start")} className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${listening ? "animate-pulse bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>{listening ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-[18px] w-[18px]" strokeWidth={1.75} />}</button>}
          <button type="submit" disabled={(!question.trim() && !pendingFile) || isAnalyzing || fileBusy} aria-label={t("copilot_send")} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-all duration-150 hover:brightness-110 active:scale-95 disabled:bg-muted-foreground/20 disabled:text-muted-foreground disabled:shadow-none">{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.25} />}</button>
        </form>
        <p className="mt-3 truncate text-center text-[11px] text-muted-foreground" aria-live="polite">{speechNote === "no_voice" ? t("speak_no_voice") : speechNote === "unsupported" ? t("speak_unsupported") : voiceError ? voiceNote : listening ? t("voice_listening") : t("disclaimer_one_line")}</p>
        <p className="mt-1 truncate text-center text-[10px] leading-4 text-muted-foreground/80">{t("legal_line_credit")}</p>
      </div>}
    </div>
    </div>
  );
}
