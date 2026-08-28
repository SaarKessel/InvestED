import type { AIInsight } from "@/lib/aiExplanationEngine";
import { useLanguage } from "@/context/languageContext";

interface Props {
  insight: AIInsight;
}

export function AIInsightCard({ insight }: Props) {
  const { t } = useLanguage();

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-5 text-2xl font-bold text-foreground">
        {t("ai_insight_emoji_thinking", "🧠 ניתוח AI של InvestED")}
      </h2>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{t("ai_insight_scenario_label", "תרחיש")}</p>
          <p className="font-bold text-foreground">{insight.headline}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">{t("ai_insight_risk_level_label", "רמת סיכון")}</p>
          <p className="text-xl font-bold text-foreground">
            {insight.riskEmoji} {insight.riskLevel}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-sm leading-7 text-foreground">
            {insight.horizonInsight}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-sm leading-7 whitespace-pre-line text-foreground">
            {insight.growthInsight}
          </p>
        </div>

        <div className="text-sm font-bold text-success">
          ✅ {insight.recommendation}
        </div>
      </div>
    </div>
  );
}