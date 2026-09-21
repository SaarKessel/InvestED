import type { InvestorProfileContext } from "../conversationContext";
import type { MarketAsset, MarketDataFreshness, MarketDataSource, StrategyId } from "../../types";
import { resolveAssetSymbol } from "../market/symbolResolution";
import { calculateEma, calculateMacd, calculateRsi, calculateSma, calculateVolatility, type MacdResult } from "../market/indicators";

export type Availability = "available" | "insufficient_history" | "unavailable";
export interface ResearchValue<T> { status: Availability; value: T | null; reason?: string }
export interface AssetResearch {
  symbol: string; name: string; assetType: string;
  quote: { price: number; previousClose: number | null; change: number | null; changePercent: number; volume: number | null; currency: string | null; marketStatus: string };
  provenance: { source: MarketDataSource; timestamp: string | null; freshness: MarketDataFreshness; isMock: boolean };
  history: MarketAsset["history"];
  indicators: { volatilityPct: ResearchValue<number>; rsi14: ResearchValue<number>; sma20: ResearchValue<number>; sma50: ResearchValue<number>; ema20: ResearchValue<number>; macd: ResearchValue<MacdResult> };
  fundamentals: ResearchValue<Record<string, number | string>>;
  news: ResearchValue<Array<{ title: string; url: string; publishedAt: string }>>;
  profileRelevance: string[]; strategyRelevance: StrategyId[]; educationalSummary: string[];
}
export interface AssetResearchDependencies { fetchAsset(symbol: string): Promise<MarketAsset | null> }
const metric = <T>(value: T | null, reason: string): ResearchValue<T> => value === null ? { status: "insufficient_history", value: null, reason } : { status: "available", value };

export async function researchAsset(input: string, dependencies: AssetResearchDependencies, profile?: InvestorProfileContext | null): Promise<AssetResearch | null> {
  const resolution = resolveAssetSymbol(input); if (!resolution) return null;
  const asset = await dependencies.fetchAsset(resolution.symbol); if (!asset) return null;
  const source = asset.dataSource ?? "mock"; const isMock = asset.isMock ?? source === "mock";
  const freshness = asset.freshness ?? (isMock ? "simulated" : "unavailable");
  const history = asset.history ?? [];
  const volatility = calculateVolatility(history), rsi = calculateRsi(history), sma20 = calculateSma(history, 20), sma50 = calculateSma(history, 50), ema20 = calculateEma(history, 20), macd = calculateMacd(history);
  const strategies: StrategyId[] = [];
  if (history.length >= 20) strategies.push("momentum", "trend-following");
  if (asset.assetType === "etf" || asset.assetType === "fund") strategies.push("long-term-index", "diversification");
  const profileRelevance = profile ? [`Profile context available: ${profile.classification ?? "classified investor"}.`, "Fit is educational and does not imply a recommendation."] : [];
  return {
    symbol: asset.symbol, name: asset.name, assetType: asset.assetType ?? "unknown",
    quote: { price: asset.price, previousClose: asset.previousClose ?? null, change: asset.change ?? null, changePercent: asset.changePercent, volume: asset.volume ?? null, currency: asset.currency ?? null, marketStatus: asset.marketStatus ?? "unknown" },
    provenance: { source, timestamp: asset.timestamp ?? null, freshness, isMock }, history,
    indicators: {
      volatilityPct: history.length < 2 ? { status: "insufficient_history", value: null, reason: "At least 2 history points are required." } : metric(volatility, "At least 2 history points are required."),
      rsi14: metric(rsi, "At least 15 history points are required."),
      sma20: metric(sma20, "At least 20 history points are required."),
      sma50: metric(sma50, "At least 50 history points are required."),
      ema20: metric(ema20, "At least 20 history points are required."),
      macd: metric(macd, "At least 34 history points are required."),
    },
    fundamentals: { status: "unavailable", value: null, reason: "No reliable fundamentals provider is configured." },
    news: { status: "unavailable", value: null, reason: "No reliable news provider is configured." },
    profileRelevance, strategyRelevance: [...new Set(strategies)],
    educationalSummary: [`${asset.symbol} has ${history.length} grounded history observations.`, isMock ? "Values are simulated and are not live market data." : `Source ${source}; freshness ${freshness}.`],
  };
}

export interface AssetResearchComparison { assets: AssetResearch[]; unavailable: string[] }
export async function compareAssetResearch(inputs: string[], dependencies: AssetResearchDependencies, profile?: InvestorProfileContext | null): Promise<AssetResearchComparison> {
  const unique = [...new Set(inputs)]; const results = await Promise.all(unique.map((input) => researchAsset(input, dependencies, profile)));
  return { assets: results.filter((item): item is AssetResearch => item !== null), unavailable: unique.filter((_, index) => results[index] === null) };
}
