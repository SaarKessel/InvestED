import { FormEvent, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { useAnalysis } from "@/context/useAnalysis";

interface Message { role: "user" | "copilot"; text: string; meta?: string; }

export function AIChatCard() {
  const { t } = useLanguage();
  const { askCopilot, isAnalyzing } = useAnalysis();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || isAnalyzing) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text }]);
    try {
      const turn = await askCopilot(text);
      const response = turn.response;
      const textAlreadyShowsProvenance = /(?:Source:|מקור:)/i.test(response.text);
      const provenance = response.dataSources.length && !textAlreadyShowsProvenance
        ? `${response.dataSources.join(", ")} · ${response.dataFreshness.join(", ")}`
        : undefined;
      setMessages((current) => [...current, { role: "copilot", text: response.text, meta: provenance }]);
    } catch {
      setMessages((current) => [...current, {
        role: "copilot",
        text: t("copilot_error", "The Copilot could not complete that request. Please try again."),
      }]);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></div>
        <div><h2 className="text-xl font-bold">{t("copilot_header", "InvestED AI Copilot")}</h2><p className="mt-1 text-sm text-muted-foreground">{t("copilot_subtitle", "AI-powered financial intelligence connected to InvestED's engines")}</p></div>
      </div>
      <div aria-live="polite" className="mt-5 max-h-80 space-y-3 overflow-y-auto">
        {messages.length === 0 && <p className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">{t("copilot_empty", "Ask about a calculation, market asset, comparison, your profile, or a financial concept.")}</p>}
        {messages.map((message, index) => <div key={index} className={`max-w-[88%] rounded-xl p-3 text-sm leading-6 ${message.role === "user" ? "ms-auto bg-primary text-primary-foreground" : "bg-muted"}`}><p>{message.text}</p>{message.meta && <p className="mt-2 text-[11px] opacity-70">{message.meta}</p>}</div>)}
      </div>
      <form onSubmit={submit} className="mt-5 flex gap-2">
        <input aria-label={t("copilot_input", "Ask InvestED")} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t("copilot_placeholder", "Ask InvestED...")} className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button type="submit" disabled={!question.trim() || isAnalyzing} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">{isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}<span className="hidden sm:inline">{t("copilot_send", "Send")}</span></button>
      </form>
    </div>
  );
}
