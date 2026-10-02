// Out-of-sample and walk-forward checks for a rule strategy.
//
// The strategy is simulated once over the whole real history (so indicators
// warm up normally). Its equity curve is then cut by TIME, never shuffled:
//  - in-sample: the first part, out-of-sample: the rest (default 70/30)
//  - walk-forward: the history cut into consecutive windows, each reported alone
// A strategy that only looks good in-sample is the classic sign of overfitting.
// The chronological split follows the discipline of FinRL (MIT) and the
// existing train/test code in src/lib/backtest/performance.ts, which is reused.
//
// Educational simulation, not advice.

import type { CandleDatum } from "../../types/index.js";
import { computePerformance, type Metric, type PerformanceReport, type PricePoint } from "../backtest/performance.js";
import { simulate, type SimOptions, type SimResult } from "./backtest.js";
import type { RuleStrategy } from "./rules.js";

type Bi = { en: string; he: string };

export interface WindowResult {
  startDate: string;
  endDate: string;
  returnPct: Metric;
  maxDrawdownPct: Metric;
  trades: number;
}

export interface WalkForwardReport {
  splitDate: string;
  inSample: Metric<PerformanceReport>;
  outOfSample: Metric<PerformanceReport>;
  inSampleTrades: number;
  outOfSampleTrades: number;
  windows: WindowResult[];
  warnings: Bi[];
  sim: SimResult;
}

const unavailable = <T = number>(reason: string): Metric<T> => ({ status: "unavailable", reason });
const r2 = (v: number) => Number(v.toFixed(2));

function windowResult(equity: PricePoint[], sim: SimResult, from: number, to: number): WindowResult {
  const slice = equity.slice(from, to);
  const start = slice[0];
  const end = slice[slice.length - 1];
  let peak = -Infinity;
  let worst = 0;
  for (const p of slice) {
    peak = Math.max(peak, p.close);
    worst = Math.min(worst, p.close / peak - 1);
  }
  return {
    startDate: start.date,
    endDate: end.date,
    returnPct: slice.length >= 2 ? { status: "computed", value: r2((end.close / start.close - 1) * 100) } : unavailable("Window too short"),
    maxDrawdownPct: slice.length >= 2 ? { status: "computed", value: r2(worst * 100) } : unavailable("Window too short"),
    trades: sim.trades.filter((t) => t.exitDate >= start.date && t.exitDate <= end.date).length,
  };
}

export function walkForward(
  history: ReadonlyArray<Pick<CandleDatum, "date" | "close" | "open" | "ohlcAvailable">>,
  strategy: RuleStrategy,
  options: SimOptions = {},
  config: { trainFraction?: number; windows?: number; minBars?: number } = {}
): Metric<WalkForwardReport> {
  const trainFraction = config.trainFraction ?? 0.7;
  const windowCount = config.windows ?? 4;
  const minBars = config.minBars ?? 20;
  if (!(trainFraction > 0 && trainFraction < 1)) return unavailable("trainFraction must be between 0 and 1");
  const sim = simulate(history, strategy, options);
  const eq = sim.equity;
  const cut = Math.floor(eq.length * trainFraction);
  if (cut < minBars || eq.length - cut < minBars) return unavailable(`Need at least ${minBars} points in each window`);
  const inEq = eq.slice(0, cut);
  const outEq = eq.slice(cut);
  const inSample = computePerformance(inEq);
  const outOfSample = computePerformance(outEq);
  const size = Math.floor(eq.length / windowCount);
  const windows: WindowResult[] = [];
  if (size >= minBars) {
    for (let k = 0; k < windowCount; k++) {
      windows.push(windowResult(eq, sim, k * size, k === windowCount - 1 ? eq.length : (k + 1) * size));
    }
  }
  const warnings: Bi[] = [];
  const sh = (m: Metric<PerformanceReport>) => (m.status === "computed" && m.value.sharpeRatio.status === "computed" ? m.value.sharpeRatio.value : null);
  const sIn = sh(inSample);
  const sOut = sh(outOfSample);
  if (sIn !== null && sOut !== null && sIn > 0 && sOut < sIn * 0.5) {
    warnings.push({ en: `Sharpe was ${sIn} in-sample but only ${sOut} out-of-sample. A drop this large can mean the rules were fitted to the past.`, he: `שארפ היה ${sIn} בתקופת הלמידה אבל רק ${sOut} מחוץ למדגם. ירידה כזו יכולה להעיד שהכללים הותאמו לעבר.` });
  }
  const outTrades = sim.trades.filter((t) => t.exitDate >= eq[cut].date).length;
  if (outTrades < 3) warnings.push({ en: `Only ${outTrades} trades closed out-of-sample. That is too few to trust the out-of-sample numbers.`, he: `רק ${outTrades} עסקאות נסגרו מחוץ למדגם. זה מעט מדי כדי לסמוך על המספרים.` });
  const losing = windows.filter((w) => w.returnPct.status === "computed" && w.returnPct.value < 0).length;
  if (windows.length > 0 && losing >= Math.ceil(windows.length / 2)) warnings.push({ en: `${losing} of ${windows.length} consecutive windows lost money. Results were not steady over time.`, he: `${losing} מתוך ${windows.length} חלונות רצופים הפסידו. התוצאות לא היו יציבות לאורך זמן.` });
  return {
    status: "computed",
    value: { splitDate: eq[cut].date, inSample, outOfSample, inSampleTrades: sim.trades.filter((t) => t.exitDate < eq[cut].date).length, outOfSampleTrades: outTrades, windows, warnings, sim },
  };
}
