// ---------------------------------------------------------------------------
// InvestED - Historical performance metrics (Strategy Lab)
//
// Pure, deterministic, textbook formulas on REAL historical prices only.
//
//  - Sharpe, Sortino, max drawdown, Calmar, volatility, CAGR
//  - Benchmark comparison on date-aligned returns: excess return,
//    tracking error, information ratio, beta, Jensen's alpha
//  - Chronological train/test split (never shuffled)
//
// Data rules (Saar's never-invent-data rule):
//  - Nothing is back-filled, forward-filled or zero-filled. Points with a
//    missing/non-positive price, and duplicate dates, are DROPPED and
//    counted in `quality`.
//  - A metric that cannot be computed honestly is returned as
//    { status: "unavailable", reason } - never as 0 or null-as-zero.
//  - Any assumption (risk-free rate) is returned in the result.
//
// Train/test discipline is a concept from FinRL (MIT, AI4Finance
// Foundation); the benchmark metric set is standard CAPM/performance
// theory. Metric selection was informed by Vibe-Trading (MIT). No code
// copied from either project.
//
// Educational history analysis, not a forecast or advice.
// ---------------------------------------------------------------------------

import type { CandleDatum } from "../../types/index.js";

export type Metric<T = number> =
  | { status: "computed"; value: T }
  | { status: "unavailable"; reason: string };

const computed = <T>(value: T): Metric<T> => ({ status: "computed", value });
const unavailable = <T = number>(reason: string): Metric<T> => ({ status: "unavailable", reason });

export interface PricePoint {
  date: string;
  close: number;
}

export interface DataQuality {
  inputPoints: number;
  usedPoints: number;
  droppedInvalidPrice: number;
  droppedDuplicateDate: number;
  /** Median gap between observations, in days. */
  medianGapDays: number | null;
}

export interface CleanSeries {
  points: PricePoint[];
  quality: DataQuality;
}

const DAY_MS = 86_400_000;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Sort by date and drop (never fill) invalid and duplicate observations. */
export function cleanSeries(history: ReadonlyArray<Pick<CandleDatum, "date" | "close">>): CleanSeries {
  let droppedInvalidPrice = 0;
  let droppedDuplicateDate = 0;
  const seen = new Set<string>();
  const points: PricePoint[] = [];
  const sorted = [...history].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  for (const item of sorted) {
    const timestamp = Date.parse(item.date);
    if (!Number.isFinite(item.close) || item.close <= 0 || !Number.isFinite(timestamp)) {
      droppedInvalidPrice += 1;
      continue;
    }
    if (seen.has(item.date)) {
      droppedDuplicateDate += 1;
      continue;
    }
    seen.add(item.date);
    points.push({ date: item.date, close: item.close });
  }
  const gaps = points.slice(1).map((p, i) => (Date.parse(p.date) - Date.parse(points[i].date)) / DAY_MS);
  return {
    points,
    quality: {
      inputPoints: history.length,
      usedPoints: points.length,
      droppedInvalidPrice,
      droppedDuplicateDate,
      medianGapDays: median(gaps),
    },
  };
}

/** Periods per year from the observation spacing; null when irregular/unknown. */
export function detectPeriodsPerYear(medianGapDays: number | null): number | null {
  if (medianGapDays === null) return null;
  if (medianGapDays <= 4) return 252; // daily (weekends skip up to 3 days)
  if (medianGapDays <= 9) return 52; // weekly
  if (medianGapDays <= 35) return 12; // monthly
  return null;
}

function simpleReturns(points: PricePoint[]): number[] {
  return points.slice(1).map((p, i) => p.close / points[i].close - 1);
}

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

function sampleStd(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1));
}

export interface DrawdownInfo {
  maxDrawdownPct: number;
  peakDate: string;
  troughDate: string;
  /** True when price made it back to the prior peak before the series ended. */
  recovered: boolean;
}

export function maxDrawdown(points: PricePoint[]): Metric<DrawdownInfo> {
  if (points.length < 2) return unavailable("Need at least 2 price points");
  let peak = points[0];
  let worst = 0;
  let worstPeak = points[0];
  let worstTrough = points[0];
  for (const point of points) {
    if (point.close > peak.close) peak = point;
    const dd = point.close / peak.close - 1;
    if (dd < worst) {
      worst = dd;
      worstPeak = peak;
      worstTrough = point;
    }
  }
  const afterTrough = points.slice(points.indexOf(worstTrough) + 1);
  const recovered = worst < 0 && afterTrough.some((p) => p.close >= worstPeak.close);
  return computed({
    maxDrawdownPct: round(worst * 100),
    peakDate: worstPeak.date,
    troughDate: worstTrough.date,
    recovered,
  });
}

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

export interface BenchmarkComparison {
  benchmarkSymbolLabel?: string;
  overlapPoints: number;
  assetReturnPct: number;
  benchmarkReturnPct: number;
  excessReturnPct: number;
  trackingErrorPct: Metric;
  informationRatio: Metric;
  beta: Metric;
  /** Jensen's alpha, annualized, in percent. */
  alphaPct: Metric;
}

export interface PerformanceOptions {
  benchmark?: ReadonlyArray<Pick<CandleDatum, "date" | "close">>;
  /** Annual risk-free rate in percent. Defaults to 0 and is reported as an assumption. */
  riskFreeAnnualPct?: number;
  /** Minimum return observations for ratio metrics. */
  minReturns?: number;
}

export interface PerformanceReport {
  startDate: string;
  endDate: string;
  periodsPerYear: Metric;
  totalReturnPct: number;
  cagrPct: Metric;
  annualizedVolatilityPct: Metric;
  sharpeRatio: Metric;
  sortinoRatio: Metric;
  maxDrawdown: Metric<DrawdownInfo>;
  calmarRatio: Metric;
  benchmark: Metric<BenchmarkComparison>;
  assumptions: { riskFreeAnnualPct: number; riskFreeSource: "assumed_zero" | "provided" };
  quality: DataQuality;
  /** Always true: figures describe the past and are not a forecast. */
  historicalOnly: true;
}

export function computePerformance(
  history: ReadonlyArray<Pick<CandleDatum, "date" | "close">>,
  options: PerformanceOptions = {}
): Metric<PerformanceReport> {
  const minReturns = options.minReturns ?? 20;
  const { points, quality } = cleanSeries(history);
  if (points.length < 2) return unavailable("Not enough valid historical prices");

  const first = points[0];
  const last = points[points.length - 1];
  const years = (Date.parse(last.date) - Date.parse(first.date)) / (365.25 * DAY_MS);
  const totalReturn = last.close / first.close - 1;
  const returns = simpleReturns(points);
  const ppy = detectPeriodsPerYear(quality.medianGapDays);
  const rfAnnual = (options.riskFreeAnnualPct ?? 0) / 100;

  const enough = returns.length >= minReturns;
  const periodsMetric: Metric = ppy === null ? unavailable("Observation spacing is irregular") : computed(ppy);
  const needRatio = (): string | null =>
    ppy === null ? "Observation spacing is irregular" : !enough ? `Need at least ${minReturns} return observations (have ${returns.length})` : null;

  const cagr: Metric =
    years >= 1 ? computed(round((Math.pow(1 + totalReturn, 1 / years) - 1) * 100)) : unavailable("History shorter than one year; annualizing would mislead");

  let vol: Metric;
  let sharpe: Metric;
  let sortino: Metric;
  const blocker = needRatio();
  if (blocker || ppy === null) {
    vol = unavailable(blocker ?? "unavailable");
    sharpe = unavailable(blocker ?? "unavailable");
    sortino = unavailable(blocker ?? "unavailable");
  } else {
    const std = sampleStd(returns);
    vol = computed(round(std * Math.sqrt(ppy) * 100));
    const rfPeriod = Math.pow(1 + rfAnnual, 1 / ppy) - 1;
    const excess = returns.map((r) => r - rfPeriod);
    sharpe = std > 0 ? computed(round((mean(excess) / std) * Math.sqrt(ppy))) : unavailable("Zero volatility");
    const downside = Math.sqrt(excess.reduce((s, v) => s + Math.min(v, 0) ** 2, 0) / excess.length);
    sortino = downside > 0 ? computed(round((mean(excess) / downside) * Math.sqrt(ppy))) : unavailable("No negative periods");
  }

  const dd = maxDrawdown(points);
  const calmar: Metric =
    dd.status === "computed" && cagr.status === "computed" && dd.value.maxDrawdownPct < 0
      ? computed(round(cagr.value / Math.abs(dd.value.maxDrawdownPct)))
      : unavailable("Needs a computed CAGR and a non-zero drawdown");

  let benchmark: Metric<BenchmarkComparison> = unavailable("No benchmark supplied");
  if (options.benchmark) {
    benchmark = compareToBenchmark(points, options.benchmark, { ppy, rfAnnual, minReturns });
  }

  return computed({
    startDate: first.date,
    endDate: last.date,
    periodsPerYear: periodsMetric,
    totalReturnPct: round(totalReturn * 100),
    cagrPct: cagr,
    annualizedVolatilityPct: vol,
    sharpeRatio: sharpe,
    sortinoRatio: sortino,
    maxDrawdown: dd,
    calmarRatio: calmar,
    benchmark,
    assumptions: {
      riskFreeAnnualPct: options.riskFreeAnnualPct ?? 0,
      riskFreeSource: options.riskFreeAnnualPct === undefined ? "assumed_zero" : "provided",
    },
    quality,
    historicalOnly: true,
  });
}

function compareToBenchmark(
  asset: PricePoint[],
  rawBenchmark: ReadonlyArray<Pick<CandleDatum, "date" | "close">>,
  ctx: { ppy: number | null; rfAnnual: number; minReturns: number }
): Metric<BenchmarkComparison> {
  const bench = cleanSeries(rawBenchmark).points;
  const benchByDate = new Map(bench.map((p) => [p.date, p.close]));
  // Exact-date intersection only: no interpolation, no carrying values across gaps.
  const aligned = asset.filter((p) => benchByDate.has(p.date)).map((p) => ({ date: p.date, asset: p.close, bench: benchByDate.get(p.date)! }));
  if (aligned.length < 2) return unavailable("Benchmark has no overlapping dates with the asset");
  if (aligned.length < asset.length * 0.8) {
    return unavailable(`Benchmark overlaps only ${aligned.length} of ${asset.length} asset dates (below 80%)`);
  }
  const assetPts = aligned.map((a) => ({ date: a.date, close: a.asset }));
  const benchPts = aligned.map((a) => ({ date: a.date, close: a.bench }));
  const ar = assetPts[assetPts.length - 1].close / assetPts[0].close - 1;
  const br = benchPts[benchPts.length - 1].close / benchPts[0].close - 1;
  const aRet = simpleReturns(assetPts);
  const bRet = simpleReturns(benchPts);
  const base = { overlapPoints: aligned.length, assetReturnPct: round(ar * 100), benchmarkReturnPct: round(br * 100), excessReturnPct: round((ar - br) * 100) };

  const { ppy, rfAnnual, minReturns } = ctx;
  if (ppy === null || aRet.length < minReturns) {
    const reason = ppy === null ? "Observation spacing is irregular" : `Need at least ${minReturns} aligned return observations (have ${aRet.length})`;
    return computed({ ...base, trackingErrorPct: unavailable(reason), informationRatio: unavailable(reason), beta: unavailable(reason), alphaPct: unavailable(reason) });
  }
  const active = aRet.map((r, i) => r - bRet[i]);
  const te = sampleStd(active);
  const ma = mean(aRet);
  const mb = mean(bRet);
  const cov = aRet.reduce((s, r, i) => s + (r - ma) * (bRet[i] - mb), 0) / (aRet.length - 1);
  const varB = bRet.reduce((s, r) => s + (r - mb) ** 2, 0) / (bRet.length - 1);
  const rfPeriod = Math.pow(1 + rfAnnual, 1 / ppy) - 1;
  const beta = varB > 0 ? cov / varB : null;
  return computed({
    ...base,
    trackingErrorPct: te > 0 ? computed(round(te * Math.sqrt(ppy) * 100)) : unavailable("Asset and benchmark returns are identical"),
    informationRatio: te > 0 ? computed(round((mean(active) / te) * Math.sqrt(ppy))) : unavailable("Zero tracking error"),
    beta: beta === null ? unavailable("Benchmark has zero variance") : computed(round(beta, 3)),
    alphaPct:
      beta === null
        ? unavailable("Needs beta")
        : computed(round(((ma - rfPeriod) - beta * (mb - rfPeriod)) * ppy * 100)),
  });
}

// ---------------------------------------------------------------------------
// Train / test split (chronological)
// ---------------------------------------------------------------------------

export interface TrainTestSplit {
  splitDate: string;
  train: PricePoint[];
  test: PricePoint[];
}

/**
 * Split by time: the first `trainFraction` of observations are the
 * in-sample window, the rest the out-of-sample window. Never shuffled.
 */
export function splitTrainTest(
  history: ReadonlyArray<Pick<CandleDatum, "date" | "close">>,
  trainFraction = 0.7,
  minPointsPerWindow = 10
): Metric<TrainTestSplit> {
  if (!(trainFraction > 0 && trainFraction < 1)) return unavailable("trainFraction must be between 0 and 1");
  const { points } = cleanSeries(history);
  const cut = Math.floor(points.length * trainFraction);
  if (cut < minPointsPerWindow || points.length - cut < minPointsPerWindow) {
    return unavailable(`Need at least ${minPointsPerWindow} points in each window`);
  }
  return computed({ splitDate: points[cut].date, train: points.slice(0, cut), test: points.slice(cut) });
}

export interface TrainTestReport {
  splitDate: string;
  inSample: Metric<PerformanceReport>;
  outOfSample: Metric<PerformanceReport>;
}

export function computeTrainTestPerformance(
  history: ReadonlyArray<Pick<CandleDatum, "date" | "close">>,
  options: PerformanceOptions & { trainFraction?: number } = {}
): Metric<TrainTestReport> {
  const split = splitTrainTest(history, options.trainFraction);
  if (split.status === "unavailable") return split;
  return computed({
    splitDate: split.value.splitDate,
    inSample: computePerformance(split.value.train, options),
    outOfSample: computePerformance(split.value.test, options),
  });
}
