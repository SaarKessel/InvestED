import { useLanguage } from "@/context/languageContext";

interface InvestmentInsightCardProps {
  finalBalance: number;
  totalContributed: number;
  growth: number;
  years: number;
  assetLabel: string;
  annualReturnPct: number;
  monthlyContribution: number;
  goal?: string;
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
}: InvestmentInsightCardProps) {
  const { language, t } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

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

  const fmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-2 text-2xl font-bold text-foreground">
        {t("ai_insight_title", "AI Simulation")}
      </h2>

      <h3 className="mb-2 text-xl font-bold text-foreground">
        {t("ai_insight_subtitle", "ניתוח חכם של תרחיש ההשקעה שלך")}
      </h3>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {t("ai_insight_desc", "המערכת ניתחה את הנתונים והמחישה כיצד זמן, תשואה והפקדות משפיעים על התוצאה.")}
      </p>

      {/* Main Metrics */}
      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("ai_insight_asset", "נכס שנבחר")}
          </p>
          <p className="text-xl font-bold text-foreground">
            {assetLabel}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ai_insight_annual_return", "תשואה שנתית משוערת:")}{" "}
            <span className="font-bold text-foreground">
              {annualReturnPct}%
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("ai_insight_total_invested", "סה״כ השקעה")}
          </p>
          <p className="text-2xl font-bold text-foreground">
            {fmt.format(totalContributed)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ai_insight_monthly_contribution", "הפקדה חודשית:")}{" "}
            <span className="font-bold text-foreground">
              {fmt.format(monthlyContribution)}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            {t("ai_insight_final_value", "שווי סופי")}
          </p>
          <p className="text-2xl font-bold text-success">
            {fmt.format(finalBalance)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("ai_insight_multiplier", "מכפיל השקעה:")}{" "}
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
          {t("ai_insight_growth_title", "💰 מאיפה הגיע השווי הסופי?")}
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <p className="mb-2 text-sm text-muted-foreground">
              {t("ai_insight_growth_share", "📈 צמיחת ההשקעה")}
            </p>
            <p className="text-2xl font-bold text-success">
              {growthShare}%
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <p className="mb-2 text-sm text-muted-foreground">
              {t("ai_insight_deposits", "💰 כסף שהופקד")}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {contributionShare}%
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          {t("ai_insight_growth_summary", "כ־{growth}% מהשווי הסופי נוצר מצמיחת ההשקעה, וכ־{deposits}% הגיעו מהכסף שהופקד.").replace("{growth}", String(growthShare)).replace("{deposits}", String(contributionShare))}
        </p>
      </div>

      {/* Monthly Contribution */}
      <div className="border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          {t("ai_insight_monthly_label", "📌 הפקדה חודשית")}
        </p>
        <p className="mt-1 text-xl font-bold text-foreground">
          {fmt.format(monthlyContribution)}{" "}
          {t("ai_insight_per_month", "בחודש")}
        </p>
      </div>
    </div>
  );
}
