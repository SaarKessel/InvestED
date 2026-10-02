// Backtest report card: metrics of the STRATEGY's equity curve next to plain
// buy-and-hold of the same asset, plus a rule-based "why did it lose?" explainer.
//
// Sharpe, Sortino, max drawdown, Calmar, CAGR and benchmark comparison come
// from the existing src/lib/backtest/performance.ts (no second metric engine).
// Added here: win rate, profit factor, average trade, exposure, rolling
// volatility. Definitions follow the standard formulas also used by quantstats
// (Apache-2.0); formulas were written from the definitions, no code copied.
//
// Every figure is Metric-style: unavailable with a reason, never 0 or invented.
// Educational simulation, not advice.

import type { CandleDatum } from "../../types/index.js";
import { computePerformance, cleanSeries, detectPeriodsPerYear, type Metric, type PerformanceReport, type PricePoint } from "../backtest/performance.js";
import { simulate, type SimOptions, type SimResult } from "./backtest.js";
import type { RuleStrategy } from "./rules.js";

type Bi = { en: string; he: string };

export interface TradeStats {
  count: number;
  winRatePct: Metric;
  avgTradePct: Metric;
  profitFactor: Metric;
  bestTradePct: Metric;
  worstTradePct: Metric;
}

export interface RollingVol {
  windowBars: number;
  /** Annualized, percent. Evenly spaced by bar. */
  points: Array<{ date: string; volPct: number }>;
}

export interface ReportCard {
  sim: SimResult;
  strategy: Metric<PerformanceReport>;
  buyAndHold: Metric<PerformanceReport>;
  trades: TradeStats;
  rollingVol: Metric<RollingVol>;
  /** Strategy total return minus buy-and-hold, in percentage points. */
  vsBuyAndHoldPct: Metric;
  whyLost: Bi[];
  historicalOnly: true;
}

const unavailable = <T = number>(reason: string): Metric<T> => ({ status: "unavailable", reason });
const computed = <T>(value: T): Metric<T> => ({ status: "computed", value });
const r2 = (v: number) => Number(v.toFixed(2));

export function tradeStats(sim: SimResult): TradeStats {
  const t = sim.trades;
  if (t.length === 0) {
    const none = <T = number>() => unavailable<T>("No completed trades");
    return { count: 0, winRatePct: none(), avgTradePct: none(), profitFactor: none(), bestTradePct: none(), worstTradePct: none() };
  }
  const wins = t.filter((x) => x.pnl > 0);
  const grossWin = wins.reduce((s, x) => s + x.pnl, 0);
  const grossLoss = t.filter((x) => x.pnl < 0).reduce((s, x) => s - x.pnl, 0);
  return {
    count: t.length,
    winRatePct: computed(r2((wins.length / t.length) * 100)),
    avgTradePct: computed(r2(t.reduce((s, x) => s + x.returnPct, 0) / t.length)),
    profitFactor: grossLoss === 0 ? unavailable("No losing trades, ratio undefined") : computed(r2(grossWin / grossLoss)),
    bestTradePct: computed(Math.max(...t.map((x) => x.returnPct))),
    worstTradePct: computed(Math.min(...t.map((x) => x.returnPct))),
  };
}

export function rollingVolatility(equity: PricePoint[], windowBars = 30): Metric<RollingVol> {
  const { points, quality } = cleanSeries(equity);
  const ppy = detectPeriodsPerYear(quality.medianGapDays);
  if (ppy === null) return unavailable("Observation spacing is irregular");
  const rets = points.slice(1).map((p, i) => p.close / points[i].close - 1);
  if (rets.length < windowBars) return unavailable(`Need at least ${windowBars} return observations (have ${rets.length})`);
  const out: RollingVol["points"] = [];
  for (let end = windowBars; end <= rets.length; end++) {
    const w = rets.slice(end - windowBars, end);
    const m = w.reduce((a, b) => a + b, 0) / w.length;
    const sd = Math.sqrt(w.reduce((s, v) => s + (v - m) ** 2, 0) / (w.length - 1));
    out.push({ date: points[end].date, volPct: r2(sd * Math.sqrt(ppy) * 100) });
  }
  return computed({ windowBars, points: out });
}

const val = (m: Metric): number | null => (m.status === "computed" ? m.value : null);

export function explainLoss(sim: SimResult, stats: TradeStats, strat: Metric<PerformanceReport>, bh: Metric<PerformanceReport>): Bi[] {
  const out: Bi[] = [];
  if (strat.status !== "computed") return out;
  const s = strat.value;
  const b = bh.status === "computed" ? bh.value : null;
  const startCash = sim.assumptions.startingCash;
  if (stats.count === 0 && !sim.openPosition) {
    return [{ en: "The rules never completed a trade on this history, so the strategy stayed in cash. Try looser thresholds or a shorter period.", he: "הכללים לא השלימו אף עסקה בהיסטוריה הזו, ולכן האסטרטגיה נשארה במזומן. נסו ספים רחבים יותר או תקופה קצרה יותר." }];
  }
  if (s.totalReturnPct < 0) out.push({ en: `The strategy lost ${Math.abs(s.totalReturnPct)}% over the period.`, he: `האסטרטגיה הפסידה ${Math.abs(s.totalReturnPct)}% בתקופה.` });
  if (b && s.totalReturnPct < b.totalReturnPct) out.push({ en: `Buy-and-hold made ${b.totalReturnPct}% and the strategy made ${s.totalReturnPct}%. Being out of the market during the rises cost return (exposure was ${sim.exposurePct}% of days).`, he: `החזקה פשוטה הניבה ${b.totalReturnPct}% והאסטרטגיה ${s.totalReturnPct}%. היציאה מהשוק בזמן העליות עלתה בתשואה (החשיפה הייתה ${sim.exposurePct}% מהימים).` });
  const wr = val(stats.winRatePct);
  const avg = val(stats.avgTradePct);
  if (wr !== null && wr < 50) out.push({ en: `Only ${wr}% of trades made money. Many small losses add up when the winners are not larger.`, he: `רק ${wr}% מהעסקאות הרוויחו. הרבה הפסדים קטנים מצטברים כשהרווחים לא גדולים יותר.` });
  if (avg !== null && avg < 0) out.push({ en: `The average trade lost ${Math.abs(avg)}%.`, he: `העסקה הממוצעת הפסידה ${Math.abs(avg)}%.` });
  const costShare = sim.totalCosts / startCash;
  if (sim.totalCosts > 0 && costShare >= 0.005) out.push({ en: `Costs (commission and slippage) took ${sim.totalCosts.toFixed(2)}, ${r2(costShare * 100)}% of the starting cash. More trades means more costs.`, he: `עלויות (עמלה והחלקה) לקחו ${sim.totalCosts.toFixed(2)}, ${r2(costShare * 100)}% מההון ההתחלתי. יותר עסקאות פירושן יותר עלויות.` });
  const dd = s.maxDrawdown.status === "computed" ? s.maxDrawdown.value.maxDrawdownPct : null;
  if (dd !== null && dd <= -20) out.push({ en: `The worst fall from a peak was ${Math.abs(dd)}%. A deep drawdown needs a much larger gain to recover.`, he: `הירידה החדה ביותר מפסגה הייתה ${Math.abs(dd)}%. ירידה עמוקה דורשת רווח גדול בהרבה כדי להתאושש.` });
  if (stats.count > 0 && stats.count < 5) out.push({ en: `Only ${stats.count} completed trades. That is too few to say the rules work or fail.`, he: `רק ${stats.count} עסקאות שהושלמו. זה מעט מדי כדי לומר שהכללים עובדים או נכשלים.` });
  if (out.length === 0) out.push({ en: "No clear weakness stands out. The strategy did not lose money and kept up with buy-and-hold on this history.", he: "לא בולטת חולשה ברורה. האסטרטגיה לא הפסידה והחזיקה קצב מול החזקה פשוטה בהיסטוריה הזו." });
  return out;
}

export function buildReportCard(
  history: ReadonlyArray<Pick<CandleDatum, "date" | "close" | "open" | "ohlcAvailable">>,
  strategy: RuleStrategy,
  options: SimOptions = {}
): ReportCard {
  const sim = simulate(history, strategy, options);
  const strat = computePerformance(sim.equity, { benchmark: history });
  const bh = computePerformance(history);
  const stats = tradeStats(sim);
  const sr = strat.status === "computed" ? strat.value.totalReturnPct : null;
  const br = bh.status === "computed" ? bh.value.totalReturnPct : null;
  return {
    sim,
    strategy: strat,
    buyAndHold: bh,
    trades: stats,
    rollingVol: rollingVolatility(sim.equity),
    vsBuyAndHoldPct: sr !== null && br !== null ? computed(r2(sr - br)) : unavailable("A return could not be computed"),
    whyLost: explainLoss(sim, stats, strat, bh),
    historicalOnly: true,
  };
}
