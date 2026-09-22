import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Clipboard, Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { useAnalysis } from "@/context/useAnalysis";
import type { CopilotResponse } from "@/lib/copilotResponse";

interface Message { role: "user" | "copilot"; text: string; response?: CopilotResponse; }

export function AIChatCard() {
  const { t, language } = useLanguage();
  const { askCopilot, isAnalyzing, reset } = useAnalysis();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, isAnalyzing]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || isAnalyzing) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text }]);
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
            {response?.toolResult && <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs"><p className="font-semibold">{t("copilot_verified_calculation")}</p>{response.toolResult.formula && <p className="mt-1 font-mono" dir="ltr">{response.toolResult.formula}</p>}{response.toolResult.assumptions.length > 0 && <p className="mt-1 text-muted-foreground">{t("copilot_assumptions")}: {response.toolResult.assumptions.join(" · ")}</p>}</div>}
            {assets.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{assets.map((asset) => <span key={asset.symbol} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground" dir="ltr">{asset.symbol} · {asset.dataSource} · {t(`copilot_freshness_${asset.freshness ?? "unavailable"}`, asset.freshness ?? "unavailable")}{asset.timestamp ? ` · ${new Date(asset.timestamp).toLocaleString(language === "he" ? "he-IL" : "en-US", { timeZone: "Asia/Jerusalem", dateStyle: "short", timeStyle: "short" })}` : ""}</span>)}</div>}
            {message.role === "copilot" && <button type="button" onClick={() => copyMessage(message.text, index)} className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground opacity-70 hover:opacity-100" aria-label={t("copilot_copy")}>{copied === index ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}{copied === index ? t("copilot_copied") : t("copilot_copy")}</button>}
          </div>;
        })}
        {isAnalyzing && <div className="flex max-w-[86%] items-center gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("copilot_working")}</div>}
      </div>
      <form onSubmit={submit} className="mt-5 flex items-end gap-2">
        <textarea rows={2} aria-label={t("copilot_input")} value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={t("copilot_placeholder")} className="min-h-12 min-w-0 flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button type="submit" disabled={!question.trim() || isAnalyzing} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span className="hidden sm:inline">{t("copilot_send")}</span></button>
      </form>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("copilot_enter_hint")}</p>
    </div>
  );
}
