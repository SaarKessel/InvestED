// Facelift phase 2: in-chat calculation card. Renders the financial
// engine's validated projection - the same numbers the answer text
// carries. Always labeled as an educational estimate, never a forecast.
import { useLanguage } from "@/context/languageContext";
import type { Projection } from "@/types";

function money(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + ` ${currency}`;
}

export function ChatCalculationCard({ projection }: { projection: Projection }) {
  const { t } = useLanguage();
  const years = projection.series.length > 0 ? projection.series[projection.series.length - 1].year : 0;
  const rows: [string, string][] = [
    [t("copilot_calc_contributed"), money(projection.totalContributed, projection.currency)],
    [t("copilot_calc_growth"), money(projection.growth, projection.currency)],
    [t("copilot_calc_final"), money(projection.finalBalance, projection.currency)],
    [t("copilot_calc_real"), money(projection.realValueAfterInflation, projection.currency)],
  ];
  return (
    <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-2.5 text-xs">
      <p className="mb-2 font-semibold">{t("copilot_calc_title")}</p>
      <dl className="space-y-1">
        {years > 0 && (
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-muted-foreground">{t("copilot_calc_years")}</dt>
            <dd className="font-mono font-semibold" dir="ltr">{years}</dd>
          </div>
        )}
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="font-mono font-semibold" dir="ltr">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("copilot_calc_disclaimer")}</p>
    </div>
  );
}
