// Loads REAL history for a strategy's first example asset through the
// injected fetcher (the existing MarketDataService client path) and
// computes historical performance metrics. Simulated (mock) history and
// missing history are reported as unavailable; nothing is substituted.

import type { CandleDatum } from "../../types/index.js";
import { computeFactors, type FactorSnapshot } from "../market/factors.js";
import { computeVar, periodReturns, type VarReport } from "../analytics/risk.js";
import { minVarianceReport, type MinVarianceReport } from "../analytics/portfolio.js";
import { getStrategy } from "../strategy/strategyEngine.js";
import {
  cleanSeries,
  computePerformance,
  detectPeriodsPerYear,
  computeTrainTestPerformance,
  type Metric,
  type PerformanceReport,
  type TrainTestReport,
} from "./performance.js";

export interface HistoryAsset {
  history: CandleDatum[];
  dataSource?: string | null;
  isMock?: boolean;
}

export type HistoryFetcher = (symbol: string, range: "10y") => Promise<HistoryAsset | null>;

export interface StrategyPerformance {
  symbol: string;
  benchmarkSymbol: string;
  dataSource: string;
  performance: Metric<PerformanceReport>;
  trainTest: Metric<TrainTestReport>;
  factors: FactorSnapshot;
  /** One-period historical VaR / expected shortfall at 95%. */
  risk: Metric<VarReport>;
  /** In-sample minimum-variance weights across the strategy example assets (real history only). */
  portfolio: Metric<MinVarianceReport>;
}

export function benchmarkFor(symbol: string): string {
  return symbol.toUpperCase() === "SPY" ? "VOO" : "SPY";
}

async function realHistory(fetchAsset: HistoryFetcher, symbol: string): Promise<HistoryAsset | null> {
  try {
    const asset = await fetchAsset(symbol, "10y");
    if (!asset || asset.isMock || asset.dataSource === "mock" || asset.history.length < 2) return null;
    return asset;
  } catch {
    return null;
  }
}

export async function loadStrategyPerformance(
  strategyId: string,
  fetchAsset: HistoryFetcher
): Promise<Metric<StrategyPerformance>> {
  const strategy = getStrategy(strategyId);
  const symbol = strategy?.exampleAssets[0];
  if (!strategy || !symbol) return { status: "unavailable", reason: "This strategy has no example asset" };

  const benchmarkSymbol = benchmarkFor(symbol);
  const [asset, benchmark] = await Promise.all([
    realHistory(fetchAsset, symbol),
    realHistory(fetchAsset, benchmarkSymbol),
  ]);
  if (!asset) return { status: "unavailable", reason: `Real price history for ${symbol} is unavailable` };

  const clean = cleanSeries(asset.history);
  const risk = computeVar(periodReturns(clean.points.map((x) => x.close)), 95);
  const portfolio = await loadPortfolio(strategy.exampleAssets.slice(0, 4), asset, symbol, fetchAsset);

  const options = benchmark ? { benchmark: benchmark.history } : {};
  return {
    status: "computed",
    value: {
      symbol,
      benchmarkSymbol,
      dataSource: asset.dataSource ?? "unknown",
      performance: computePerformance(asset.history, options),
      trainTest: computeTrainTestPerformance(asset.history, { ...options, trainFraction: 0.7 }),
      factors: computeFactors(asset.history),
      risk,
      portfolio,
    },
  };
}

async function loadPortfolio(symbols: string[], first: HistoryAsset, firstSymbol: string, fetchAsset: HistoryFetcher): Promise<Metric<MinVarianceReport>> {
  if (symbols.length < 2) return { status: "unavailable", reason: "This strategy has fewer than two example assets" };
  const loaded = await Promise.all(symbols.map(async (s) => [s, s === firstSymbol ? first : await realHistory(fetchAsset, s)] as const));
  const series: Record<string, { date: string; close: number }[]> = {};
  const missing: string[] = [];
  for (const [s, a] of loaded) {
    if (a) series[s] = cleanSeries(a.history).points; else missing.push(s);
  }
  if (Object.keys(series).length < 2) return { status: "unavailable", reason: `Real price history is unavailable for ${missing.join(", ")}` };
  const ppy = detectPeriodsPerYear(cleanSeries(first.history).quality.medianGapDays);
  if (ppy === null) return { status: "unavailable", reason: "Observation frequency could not be determined" };
  return minVarianceReport(series, ppy);
}
