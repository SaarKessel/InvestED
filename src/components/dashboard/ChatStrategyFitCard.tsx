// Facelift phase 2: in-chat strategy fit card. Renders the strategy
// engine's validated educational fit assessment - status, fit level,
// reasons and disclaimer all arrive localized from the engine. This is
// education, never personalized advice.
import { useLanguage } from "@/context/languageContext";
import type { StrategyFitAssessment } from "@/types";

export function ChatStrategyFitCard({ fit }: { fit: StrategyFitAssessment }) {
  const { t } = useLanguage();
  const badge = fit.status === "needs_profile"
    ? { label: t("copilot_fit_needs_profile"), className: "text-muted-foreground" }
    : fit.fit === "high"
      ? { label: t("copilot_fit_high"), className: "text-emerald-600 dark:text-emerald-400" }
      : fit.fit === "moderate"
        ? { label: t("copilot_fit_moderate"), className: "text-amber-700 dark:text-amber-400" }
        : { label: t("copilot_fit_low"), className: "text-red-600 dark:text-red-400" };
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="font-semibold">{t("copilot_fit_title")}</p>
        <span className={`font-semibold ${badge.className}`}>{badge.label}</span>
      </div>
      <p className="mb-1 font-mono text-[11px] text-muted-foreground" dir="ltr">{fit.strategyId}</p>
      {fit.reasons.length > 0 && (
        <ul className="list-disc space-y-1 ps-4">
          {fit.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
        </ul>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">{fit.disclaimer}</p>
    </div>
  );
}
