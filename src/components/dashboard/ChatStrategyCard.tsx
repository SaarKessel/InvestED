// Facelift phase 2: in-chat strategy card. Renders the strategy engine's
// validated explanation extras - risk level, strengths, limitations and
// educational notes, all localized by the engine. Educational only.
import { useLanguage } from "@/context/languageContext";
import type { StrategyExplanation } from "@/lib/strategy/strategyEngine";

export function ChatStrategyCard({ explanation }: { explanation: StrategyExplanation }) {
  const { t } = useLanguage();
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="font-semibold">{explanation.name}</p>
        <span className="font-semibold text-muted-foreground">
          {explanation.riskLabel} · {t("copilot_strategy_risk")} <span dir="ltr">{explanation.riskLevel}/10</span>
        </span>
      </div>
      {explanation.strengths.length > 0 && (
        <div className="mb-1">
          <p className="font-semibold text-emerald-700 dark:text-emerald-400">{t("copilot_strategy_strengths")}</p>
          <ul className="list-disc space-y-1 ps-4">
            {explanation.strengths.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      )}
      {explanation.limitations.length > 0 && (
        <div className="mb-1">
          <p className="font-semibold text-red-600 dark:text-red-400">{t("copilot_strategy_limitations")}</p>
          <ul className="list-disc space-y-1 ps-4">
            {explanation.limitations.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      )}
      {explanation.educationalNotes && <p className="mt-2 text-[11px] text-muted-foreground">{explanation.educationalNotes}</p>}
    </div>
  );
}
