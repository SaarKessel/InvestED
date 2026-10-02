import { useLanguage } from "@/context/languageContext";
import { reasonText } from "@/lib/backtest/reasonText";
import type { Metric } from "@/lib/backtest/performance";
import type { ReportCard } from "@/lib/algo/reportCard";

function Row({ label, metric, suffix = "" }: { label: string; metric: Metric; suffix?: string }) {
  const { t, language } = useLanguage();
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-1 text-xs last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end font-semibold" dir="ltr">
        {metric.status === "computed" ? `${metric.value}${suffix}` : (
          <span className="font-normal text-muted-foreground" dir="auto">
            {t("slab_perf_unavailable", "unavailable: {reason}").replace("{reason}", reasonText(metric.reason, language))}
          </span>
        )}
      </dd>
    </div>
  );
}

export function ReportCardView({ card }: { card: ReportCard }) {
  const { t, language } = useLanguage();
  const lang = language === "he" ? "he" : "en";
  const s = card.strategy;
  const b = card.buyAndHold;
  const sv = s.status === "computed" ? s.value : null;
  const bv = b.status === "computed" ? b.value : null;
  const dd = (m: typeof s): Metric => (m.status === "computed" && m.value.maxDrawdown.status === "computed" ? { status: "computed", value: m.value.maxDrawdown.value.maxDrawdownPct } : { status: "unavailable", reason: m.status === "unavailable" ? m.reason : "Drawdown unavailable" });
  const vol = card.rollingVol.status === "computed" ? card.rollingVol.value.points : null;
  const volVals = vol?.map((p) => p.volPct) ?? [];
  const col = (title: string, rep: typeof s, v: typeof sv) => (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-1 text-xs font-bold">{title}</p>
      {rep.status === "unavailable" || !v ? (
        <p className="text-xs text-muted-foreground">{t("slab_perf_unavailable", "unavailable: {reason}").replace("{reason}", reasonText(rep.status === "unavailable" ? rep.reason : "", language))}</p>
      ) : (
        <dl>
          <Row label={t("slab_perf_total_return", "Total return")} metric={{ status: "computed", value: v.totalReturnPct }} suffix="%" />
          <Row label={t("slab_perf_cagr", "Annualized return")} metric={v.cagrPct} suffix="%" />
          <Row label={t("slab_perf_vol", "Annualized volatility")} metric={v.annualizedVolatilityPct} suffix="%" />
          <Row label={t("slab_perf_sharpe", "Sharpe ratio")} metric={v.sharpeRatio} />
          <Row label={t("slab_perf_sortino", "Sortino ratio")} metric={v.sortinoRatio} />
          <Row label={t("slab_perf_mdd", "Max drawdown")} metric={dd(rep)} suffix="%" />
          <Row label={t("slab_perf_calmar", "Calmar ratio")} metric={v.calmarRatio} />
        </dl>
      )}
    </div>
  );
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-primary">{t("card_title", "Backtest report card")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {col(t("card_strategy", "Your strategy"), s, sv)}
        {col(t("card_bh", "Buy and hold"), b, bv)}
      </div>
      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <dl>
          <Row label={t("card_vs_bh", "Strategy minus buy-and-hold (points)")} metric={card.vsBuyAndHoldPct} suffix="%" />
          <Row label={t("card_trades", "Completed trades")} metric={{ status: "computed", value: card.trades.count }} />
          <Row label={t("card_win", "Win rate")} metric={card.trades.winRatePct} suffix="%" />
          <Row label={t("card_avg", "Average trade")} metric={card.trades.avgTradePct} suffix="%" />
          <Row label={t("card_pf", "Profit factor")} metric={card.trades.profitFactor} />
          <Row label={t("card_exposure", "Days in the market")} metric={{ status: "computed", value: card.sim.exposurePct }} suffix="%" />
          <Row label={t("card_costs", "Costs paid")} metric={{ status: "computed", value: card.sim.totalCosts }} />
          {vol && volVals.length > 0 ? (
            <Row label={t("card_rvol", "Rolling 30-day volatility (min to max)")} metric={{ status: "computed", value: `${Math.min(...volVals)} to ${Math.max(...volVals)}%` as unknown as number }} />
          ) : (
            <Row label={t("card_rvol", "Rolling 30-day volatility (min to max)")} metric={card.rollingVol as Metric} />
          )}
        </dl>
        <p className="mt-2 text-[11px] text-muted-foreground" dir="auto">
          {card.sim.fillBasis === "next_open"
            ? t("card_fill_open", "Orders are filled at the next day's open, after the signal day closes.")
            : t("card_fill_close", "This data has no reliable open prices, so orders are filled at the next day's close.")}
        </p>
      </div>
      <div className="rounded-xl border border-warning/30 bg-warning/5 p-3">
        <p className="mb-1 text-xs font-bold">{t("card_why", "Why did my strategy lose?")}</p>
        <ul className="list-disc ps-5 text-xs leading-6 text-muted-foreground">
          {card.whyLost.map((x, i) => <li key={i}>{x[lang]}</li>)}
        </ul>
      </div>
    </div>
  );
}
