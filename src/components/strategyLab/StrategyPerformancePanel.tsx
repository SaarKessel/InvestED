import { useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { reasonText } from "@/lib/backtest/reasonText";
import { fetchMarketAssetBySymbol } from "@/lib/marketData";
import { researchCodeLabel } from "@/lib/research/researchLabels";
import type { Metric, PerformanceReport } from "@/lib/backtest/performance";
import type { FactorSnapshot } from "@/lib/market/factors";
import { loadStrategyPerformance, type StrategyPerformance } from "@/lib/backtest/strategyPerformance";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: StrategyPerformance };

function fmt(metric: Metric, suffix = ""): { text: string; missing: boolean; reason?: string } {
  return metric.status === "computed"
    ? { text: `${metric.value}${suffix}`, missing: false }
    : { text: "", missing: true, reason: metric.reason };
}

function Row({ label, metric, suffix }: { label: string; metric: Metric; suffix?: string }) {
  const { t, language } = useLanguage();
  const f = fmt(metric, suffix);
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-1 text-xs last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-end font-semibold" dir="ltr">
        {f.missing ? (
          <span className="font-normal text-muted-foreground" dir="auto">
            {t("slab_perf_unavailable", "unavailable: {reason}").replace("{reason}", reasonText(f.reason ?? "", language))}
          </span>
        ) : (
          f.text
        )}
      </dd>
    </div>
  );
}

function Report({ title, report }: { title: string; report: Metric<PerformanceReport> }) {
  const { t, language } = useLanguage();
  if (report.status === "unavailable") {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <p className="mb-1 text-xs font-bold">{title}</p>
        <p className="text-xs text-muted-foreground">
          {t("slab_perf_unavailable", "unavailable: {reason}").replace("{reason}", reasonText(report.reason, language))}
        </p>
      </div>
    );
  }
  const r = report.value;
  const dd: Metric = r.maxDrawdown.status === "computed" ? { status: "computed", value: r.maxDrawdown.value.maxDrawdownPct } : r.maxDrawdown;
  const b = r.benchmark.status === "computed" ? r.benchmark.value : null;
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-1 text-xs font-bold">{title}</p>
      <p className="mb-1 text-[10px] text-muted-foreground" dir="ltr">{r.startDate} → {r.endDate}</p>
      <dl>
        <Row label={t("slab_perf_total_return", "Total return")} metric={{ status: "computed", value: r.totalReturnPct }} suffix="%" />
        <Row label={t("slab_perf_cagr", "Annualized return")} metric={r.cagrPct} suffix="%" />
        <Row label={t("slab_perf_vol", "Annualized volatility")} metric={r.annualizedVolatilityPct} suffix="%" />
        <Row label={t("slab_perf_sharpe", "Sharpe ratio")} metric={r.sharpeRatio} />
        <Row label={t("slab_perf_sortino", "Sortino ratio")} metric={r.sortinoRatio} />
        <Row label={t("slab_perf_mdd", "Max drawdown")} metric={dd} suffix="%" />
        <Row label={t("slab_perf_calmar", "Calmar ratio")} metric={r.calmarRatio} />
        {b ? (
          <>
            <Row label={t("slab_perf_excess", "Excess return vs. benchmark")} metric={{ status: "computed", value: b.excessReturnPct }} suffix="%" />
            <Row label={t("slab_perf_beta", "Beta")} metric={b.beta} />
            <Row label={t("slab_perf_alpha", "Alpha (annual)")} metric={b.alphaPct} suffix="%" />
            <Row label={t("slab_perf_te", "Tracking error")} metric={b.trackingErrorPct} suffix="%" />
            <Row label={t("slab_perf_ir", "Information ratio")} metric={b.informationRatio} />
          </>
        ) : (
          <Row label={t("slab_perf_excess", "Excess return vs. benchmark")} metric={r.benchmark as Metric} />
        )}
      </dl>
      {r.quality.droppedInvalidPrice + r.quality.droppedDuplicateDate > 0 && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          {t("slab_perf_dropped", "{count} invalid or duplicate price points were skipped, none were filled in.").replace(
            "{count}",
            String(r.quality.droppedInvalidPrice + r.quality.droppedDuplicateDate)
          )}
        </p>
      )}
    </div>
  );
}

function Factors({ factors }: { factors: FactorSnapshot }) {
  const { t } = useLanguage();
  const bollinger: Metric = factors.bollinger20.status === "computed"
    ? (factors.bollinger20.value.percentB === null ? { status: "unavailable", reason: "Zero band width" } : { status: "computed", value: factors.bollinger20.value.percentB })
    : factors.bollinger20;
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-1 text-xs font-bold">{t("slab_factor_title", "Classic price factors (latest)")}</p>
      <dl>
        <Row label={t("slab_factor_roc20", "20-period change")} metric={factors.rateOfChange20} />
        <Row label={t("slab_factor_mom", "12-1 month momentum")} metric={factors.momentum12m1} />
        <Row label={t("slab_factor_rev", "5-period reversal")} metric={factors.shortTermReversal5} />
        <Row label={t("slab_factor_sma", "Price vs. 20-period average")} metric={factors.priceToSma20} />
        <Row label={t("slab_factor_boll", "Bollinger %B (20)")} metric={bollinger} />
        <Row label={t("slab_factor_range", "Position in 14-period range")} metric={factors.rangePosition14} />
        <Row label={t("slab_factor_atr", "Average true range (14, % of price)")} metric={factors.atrPercent14} />
        <Row label={t("slab_factor_vol", "Volume vs. 20-period average")} metric={factors.volumeRatio20} />
      </dl>
    </div>
  );
}

function RiskBlock({ risk, portfolio }: Pick<StrategyPerformance, "risk" | "portfolio">) {
  const { t, language } = useLanguage();
  const un = (reason: string) => t("slab_perf_unavailable", "unavailable: {reason}").replace("{reason}", reasonText(reason, language));
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3" data-testid="slab-risk">
      <p className="mb-1 text-xs font-bold">{t("slab_risk_title", "Value at Risk (one period, 95%)")}</p>
      {risk.status === "computed" ? (
        <dl>
          <Row label={t("slab_risk_hist", "Historical VaR")} metric={{ status: "computed", value: Number(risk.value.historicalVarPct.toFixed(2)) }} suffix="%" />
          <Row label={t("slab_risk_es", "Expected shortfall")} metric={{ status: "computed", value: Number(risk.value.expectedShortfallPct.toFixed(2)) }} suffix="%" />
          <Row label={t("slab_risk_param", "Parametric VaR (normal)")} metric={risk.value.parametricVarPct.status === "computed" ? { status: "computed", value: Number(risk.value.parametricVarPct.value.toFixed(2)) } : risk.value.parametricVarPct} suffix="%" />
        </dl>
      ) : <p className="text-xs text-muted-foreground">{un(risk.reason)}</p>}
      <p className="mt-1 text-[10px] text-muted-foreground">{t("slab_risk_note", "Past one-period loss levels from real returns. Not a forecast and not a loss limit.")}</p>
      <p className="mb-1 mt-3 text-xs font-bold">{t("slab_port_title", "Minimum-variance weights (in-sample)")}</p>
      {portfolio.status === "computed" ? (
        <>
          <dl>
            {portfolio.value.symbols.map((s, i) => <Row key={s} label={s} metric={{ status: "computed", value: Number((portfolio.value.weights[i] * 100).toFixed(1)) }} suffix="%" />)}
            <Row label={t("slab_port_vol", "Volatility, minimum variance vs. equal weight")} metric={{ status: "computed", value: `${portfolio.value.minVolPct.toFixed(2)}% / ${portfolio.value.equalWeightVolPct.toFixed(2)}%` as unknown as number }} />
          </dl>
          <p className="mt-1 text-[10px] text-muted-foreground">{t("slab_port_note", "Weights fitted to past data on {dates} common dates ({dropped} dates missing in some asset were dropped, none filled). Illustration of the method, not an allocation to hold.").replace("{dates}", String(portfolio.value.dates)).replace("{dropped}", String(portfolio.value.dropped))}</p>
        </>
      ) : <p className="text-xs text-muted-foreground">{un(portfolio.reason)}</p>}
    </div>
  );
}

export function StrategyPerformancePanel({ strategyId }: { strategyId: string }) {
  const { t, language } = useLanguage();
  const [state, setState] = useState<State>({ status: "idle" });

  async function load() {
    setState({ status: "loading" });
    try {
      const result = await loadStrategyPerformance(strategyId, async (symbol, range) => {
        const asset = await fetchMarketAssetBySymbol(symbol, range, undefined, { allowSimulated: false });
        return asset ? { history: asset.history, dataSource: asset.dataSource, isMock: asset.isMock } : null;
      });
      setState(result.status === "computed" ? { status: "ready", data: result.value } : { status: "error" });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <section aria-live="polite">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
        <TrendingUp className="h-4 w-4" /> {t("slab_perf_title", "Historical performance")}
      </h3>
      {state.status === "idle" && (
        <button
          type="button"
          onClick={load}
          className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          {t("slab_perf_load", "Load historical performance")}
        </button>
      )}
      {state.status === "loading" && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("slab_perf_loading", "Loading real price history...")}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-danger">{t("slab_perf_error", "Real price history is unavailable right now.")}</p>
      )}
      {state.status === "ready" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground" dir="auto">
            {t("slab_perf_asset", "Example asset: {symbol} vs. benchmark {benchmark}")
              .replace("{symbol}", state.data.symbol)
              .replace("{benchmark}", state.data.benchmarkSymbol)}
          </p>
          <Report title={t("slab_perf_total_return", "Total return")} report={state.data.performance} />
          {state.data.trainTest.status === "computed" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Report title={t("slab_perf_in_sample", "In-sample")} report={state.data.trainTest.value.inSample} />
              <Report title={t("slab_perf_out_sample", "Out-of-sample")} report={state.data.trainTest.value.outOfSample} />
            </div>
          )}
          <Factors factors={state.data.factors} />
          <RiskBlock risk={state.data.risk} portfolio={state.data.portfolio} />
          <p className="text-[11px] text-muted-foreground">{t("slab_perf_rf", "Sharpe assumes a 0% risk-free rate.")}</p>
          <p className="text-[11px] text-muted-foreground">
            {t("slab_perf_notice", "Past performance only. Based on real prices from {source}.").replace(
              "{source}",
              researchCodeLabel("source", state.data.dataSource as "alpha_vantage" | "yahoo_finance" | "mock", language)
            )}
          </p>
        </div>
      )}
    </section>
  );
}
