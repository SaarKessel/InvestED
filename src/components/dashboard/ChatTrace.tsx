import { useLanguage } from "@/context/languageContext";
import { stepLabel, trustLabel, type TraceStep } from "@/lib/copilot/planner";

/** Collapsed "What I did" list under an answer. Plain steps, with the trust class where one applies. */
export function ChatTrace({ steps }: { steps: TraceStep[] }) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  if (!steps.length) return null;
  return (
    <details className="mt-2 text-[11px] text-muted-foreground">
      <summary className="cursor-pointer select-none opacity-80 hover:opacity-100">{t("trace_title")}</summary>
      <ol className="mt-1.5 list-decimal space-y-1 ps-5">
        {steps.map((s, i) => (
          <li key={i}>{stepLabel(s, lang)}{s.trust ? <span className="ms-1.5 rounded border border-[#E0B253]/50 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-[#B8862B] dark:text-[#E0B253]">{trustLabel(s.trust, lang)}</span> : null}</li>
        ))}
      </ol>
    </details>
  );
}
