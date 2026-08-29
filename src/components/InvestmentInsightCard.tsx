import { useLanguage } from "@/context/languageContext";
import { formatCurrency } from "@/lib/format";

interface InvestmentInsightCardProps {
  finalBalance: number;
  totalContributed: number;
  growth: number;
  years: number;
  assetLabel: string;
  annualReturnPct: number;
  monthlyContribution: number;
  goal?: string;
  currency?: string;
}

export function InvestmentInsightCard({
  finalBalance,
  totalContributed,
  growth,
  years,
  assetLabel,
  annualReturnPct,
  monthlyContribution,
  goal: _goal,
  currency = "ILS",
}: InvestmentInsightCardProps) {
  const { language, t } = useLanguage();

  const growthShare =
    finalBalance > 0 ? Math.round((growth / finalBalance) * 100) : 0;

  const contributionShare =
    finalBalance > 0 ? Math.round((totalContributed / finalBalance) * 100) : 0;

  let insight = "";
  let icon = "";

  if (years >= 15) {
    insight = t("ai_insight_horizon_long", "אופק השקעה ארוך של {years} שנים מאפשר לריבית דריבית להשפיע בצורה משמעותית על צמיחת ההון, אך חשוב עדיין להתאים את רמת הסיכון למטרת ההשקעה.").replace("{years}", String(years));
    icon = "🚀";
  } else if (years >= 5) {
    insight = t("ai_insight_horizon_medium", "אופק השקעה בינוני של {years} שנים מאפשר לזמן ולריבית דריבית להשפיע על צמיחת ההון, תוך התחשבות בתנודתיות וברמת הסיכון.").replace("{years}", String(years));
    icon = "📈";
  } else {
    insight = t("ai_insight_horizon_short", "בטווח קצר יותר, לתנודתיות השוק יכולה להיות השפעה משמעותית ולכן חשוב להתאים את רמת הסיכון לאופק ההשקעה.");
    icon = "⚠️";
  }

  const investmentMultiple =
    totalContributed > 0 ? finalBalance / totalContributed : 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-2 text-2xl font-bold text-foreground">
        {t("ai_insight_title", "AI Simulation")}
      </h2>

      <h3 className="mb-2 text-xl font-bold text-foreground">
        {t("ai_insight_subtitle", "Smart analysis of your investment scenario")}
      </h3>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {t("ai_insight_desc", "The system analyzed the data and illustrated how time, returns, and contributions affect the outcome.")}
      </p>

      {/* Main Metrics */}
      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("ai_insight_asset", "Selected Asset")}
          </p>
          <p className="text-xl font-bold text-foreground">
            {assetLabel}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ai_insight_annual_return", "Estimated annual return:")}{" "}
            <span className="font-bold text-foreground">
              {annualReturnPct}%
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("ai_insight_total_invested", "Total Invested")}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(totalContributed, currency, language)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ai_insight_monthly_contribution", "Monthly contribution:")}{" "}
            <span className="font-bold text-foreground">
              {formatCurrency(monthlyContribution, currency, language)}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("ai_insight_final_value", "Final Value")}
          </p>
          <p className="text-2xl font-bold text-success">
            {formatCurrency(finalBalance, currency, language)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ai_insight_multiplier", "Investment multiplier:")}{" "}
            <span className="font-bold text-foreground">
              x{investmentMultiple.toFixed(1)}
            </span>
          </p>
        </div>
      </div>

      {/* Horizon */}
      <div className="mb-6 rounded-2xl border border-border bg-muted/20 p-5">
        <p className="text-sm leading-7 text-foreground">
          {icon} {insight}
        </p>
      </div>

      {/* Growth Breakdown */}
      <div className="mb-6">
        <h3 className="mb-4 text-lg font-bold text-foreground">
          {t("ai_insight_growth_title", "💰 Where does the final value come from?")}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <p className="mb-2 text-sm text-muted-foreground">
              {t("ai_insight_growth_share", "📈 Investment Growth")}
            </p>
            <p className="text-2xl font-bold text-success">
              {growthShare}%
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <p className="mb-2 text-sm text-muted-foreground">
              {t("ai_insight_deposits", "💰 Deposited Funds")}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {contributionShare}%
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {t("ai_insight_growth_summary", "Approximately {growth}% of the final value comes from investment growth, and approximately {deposits}% comes from the funds deposited.").replace("{growth}", String(growthShare)).replace("{deposits}", String(contributionShare))}
        </p>
      </div>

      {/* Monthly Contribution */}
      <div className="border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          {t("ai_insight_monthly_label", "📌 Monthly Contribution")}
        </p>
        <p className="mt-1 text-xl font-bold text-foreground">
          {formatCurrency(monthlyContribution, currency, language)}{" "}
          {t("ai_insight_per_month", "per month")}
        </p>
      </div>
    </div>
  );
}
