import { FormEvent, useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { useAnalysis } from "@/context/useAnalysis";

interface Message {
  role: "user" | "copilot";
  text: string;
  meta?: string;
}

/**
 * Strategy Lab Q&A. Uses the same AnalysisContext session and
 * orchestration as the dashboard Copilot — strategy questions
 * are routed to the Strategy Engine by the conversation layer.
 */
export function StrategyAskCopilot({ strategyName }: { strategyName: string }) {
  const { t } = useLanguage();
  const { askCopilot, isAnalyzing } = useAnalysis();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || isAnalyzing) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text }]);
    try {
      const turn = await askCopilot(text);
      if (!mountedRef.current) return;
      const response = turn.response;
      const showsProvenance = /(?:Source:|מקור:)/i.test(response.text);
      const provenance = response.dataSources.length && !showsProvenance
        ? `${response.dataSources.join(", ")} · ${response.dataFreshness.join(", ")}`
        : undefined;
      setMessages((current) => [...current, { role: "copilot", text: response.text, meta: provenance }]);
    } catch {
      if (!mountedRef.current) return;
      setMessages((current) => [...current, { role: "copilot", text: t("slab_ask_error") }]);
    }
  }

  return (
    <section aria-label={t("slab_ask_aria")} className="mt-6 rounded-2xl border border-border bg-muted/30 p-5">
      <div className="flex items-center gap-2 text-primary">
        <Sparkles className="h-4 w-4" />
        <h3 className="text-sm font-bold">{t("slab_ask_title")}</h3>
      </div>

      <div aria-live="polite" className="mt-4 max-h-64 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <p className="rounded-xl bg-muted/60 p-3 text-xs leading-6 text-muted-foreground">
            {t("slab_ask_empty")}
          </p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[90%] rounded-xl p-3 text-sm leading-6 ${
              message.role === "user" ? "ms-auto bg-primary text-primary-foreground" : "bg-muted"
            }`}
          >
            <p>{message.text}</p>
            {message.meta && <p className="mt-2 text-[11px] opacity-70">{message.meta}</p>}
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          aria-label={t("slab_ask_aria")}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={t("slab_ask_placeholder")}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!question.trim() || isAnalyzing}
          aria-label={`${t("slab_ask_send")} - ${strategyName}`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="hidden sm:inline">{t("slab_ask_send")}</span>
        </button>
      </form>
    </section>
  );
}
