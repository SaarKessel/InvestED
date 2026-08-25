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
  const growthShare =
    finalBalance > 0 ? Math.round((growth / finalBalance) * 100) : 0;

  const contributionShare =
    finalBalance > 0 ? Math.round((totalContributed / finalBalance) * 100) : 0;

  let insight = "";
  let icon = "";

  if (years >= 15) {
    insight = `אופק השקעה ארוך של ${years} שנים מאפשר לריבית דריבית להשפיע בצורה משמעותית על צמיחת ההון, אך חשוב עדיין להתאים את רמת הסיכון למטרת ההשקעה.`;
    icon = "🚀";
  } else if (years >= 5) {
    insight = `אופק השקעה בינוני של ${years} שנים מאפשר לזמן ולריבית דריבית להשפיע על צמיחת ההון, תוך התחשבות בתנודתיות וברמת הסיכון.`;
    icon = "📈";
  } else {
    insight =
      "בטווח קצר יותר, לתנודתיות השוק יכולה להיות השפעה משמעותית ולכן חשוב להתאים את רמת הסיכון לאופק ההשקעה.";
    icon = "⚠️";
  }

  const investmentMultiple =
    totalContributed > 0 ? finalBalance / totalContributed : 0;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="mb-2 text-2xl font-bold text-foreground">
        AI Simulation
      </h2>

      <h3 className="mb-2 text-xl font-bold text-foreground">
        ניתוח חכם של תרחיש ההשקעה שלך
      </h3>

      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        המערכת ניתחה את הנתונים והמחישה כיצד זמן, תשואה והפקדות משפיעים על התוצאה.
      </p>

      {/* Main Metrics */}
      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            נכס שנבחר
          </p>
          <p className="text-xl font-bold text-foreground">
            {assetLabel}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            תשואה שנתית משוערת:{" "}
            <span className="font-bold text-foreground">
              {annualReturnPct}%
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            סה״כ השקעה
          </p>
          <p className="text-2xl font-bold text-foreground">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              maximumFractionDigits: 0,
            }).format(totalContributed)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            הפקדה חודשית:{" "}
            <span className="font-bold text-foreground">
              {new Intl.NumberFormat("he-IL", {
                style: "currency",
                currency: "ILS",
                maximumFractionDigits: 0,
              }).format(monthlyContribution)}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-5">
          <p className="mb-2 text-sm text-muted-foreground">
            שווי סופי
          </p>
          <p className="text-2xl font-bold text-success">
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              maximumFractionDigits: 0,
            }).format(finalBalance)}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            מכפיל השקעה:{" "}
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
          💰 מאיפה הגיע השווי הסופי?
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <p className="mb-2 text-sm text-muted-foreground">
              📈 צמיחת ההשקעה
            </p>
            <p className="text-2xl font-bold text-success">
              {growthShare}%
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-5">
            <p className="mb-2 text-sm text-muted-foreground">
              💰 כסף שהופקד
            </p>
            <p className="text-2xl font-bold text-foreground">
              {contributionShare}%
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          כ־{growthShare}% מהשווי הסופי נוצר מצמיחת ההשקעה, וכ־{contributionShare}% הגיעו מהכסף שהופקד.
        </p>
      </div>

      {/* Monthly Contribution */}
      <div className="border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          📌 הפקדה חודשית
        </p>
        <p className="mt-1 text-xl font-bold text-foreground">
          {new Intl.NumberFormat("he-IL", {
            style: "currency",
            currency: "ILS",
            maximumFractionDigits: 0,
          }).format(monthlyContribution)}{" "}
          בחודש
        </p>
      </div>
    </div>
  );
}
