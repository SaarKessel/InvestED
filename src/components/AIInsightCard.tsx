import type { AIInsight } from "@/lib/aiExplanationEngine";

interface Props {
  insight: AIInsight;
}

export function AIInsightCard({ insight }: Props) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-5 text-2xl font-bold text-foreground">
        🧠 ניתוח AI של InvestED
      </h2>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">תרחיש</p>
          <p className="font-bold text-foreground">{insight.headline}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">רמת סיכון</p>
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