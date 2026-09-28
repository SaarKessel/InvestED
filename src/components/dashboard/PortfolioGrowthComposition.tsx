import type { Projection } from "@/types";
import { useLanguage } from "@/context/languageContext";
import { formatCurrency } from "@/lib/format";

/** Scenario-only illustration. No market quote, portfolio performance or forecast is used here. */
export function PortfolioGrowthComposition({ projection, currency }: { projection: Projection; currency: string }) {
  const { t, language } = useLanguage();
  const { finalBalance, totalContributed, growth } = projection;
  const canSplit = Number.isFinite(finalBalance) && finalBalance > 0 &&
    Number.isFinite(totalContributed) && totalContributed >= 0 &&
    Number.isFinite(growth) && growth >= 0 &&
    Math.abs(totalContributed + growth - finalBalance) <= 1;

  return <section className="projection-surface rounded-2xl border border-primary/20 p-4 sm:p-5">
    <h3 className="text-sm font-bold">{t("portfolio_growth_contribution_title")}</h3>
    <p className="mt-1 text-xs leading-5 text-muted-foreground">{language === "he" ? "המחשה המבוססת על הנחות התרחיש, לא תשואה בפועל או מובטחת" : "Illustration based on scenario assumptions, not actual or guaranteed returns"}</p>
    {canSplit ? <>
      <div className="mt-4 flex h-5 w-full overflow-hidden rounded-full border border-border bg-muted" dir="ltr" role="img" aria-label={`${t("portfolio_metric_total_contributions")}: ${formatCurrency(totalContributed, currency, language)}; ${t("portfolio_metric_investment_profit")}: ${formatCurrency(growth, currency, language)}`}>
        <span className="h-full bg-secondary" style={{ width: `${Math.min(100, totalContributed / finalBalance * 100)}%` }} />
        <span className="h-full flex-1 bg-primary" />
      </div>
      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm bg-secondary" />{t("portfolio_metric_total_contributions")}: <b dir="ltr" className="break-all">{formatCurrency(totalContributed, currency, language)}</b></div>
        <div className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-sm bg-primary" />{t("portfolio_metric_investment_profit")}: <b dir="ltr" className="break-all">{formatCurrency(growth, currency, language)}</b></div>
      </div>
    </> : <p className="mt-3 text-sm text-muted-foreground">{language === "he" ? "התרחיש אינו מציג צמיחה חיובית, לכן אין חלוקה חיובית מטעה. בדקו את סכומי התרחיש וההנחות." : "This scenario does not show positive growth, so a positive split would mislead. Review the scenario amounts and assumptions."}</p>}
  </section>;
}
