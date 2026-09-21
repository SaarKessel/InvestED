import type { AnalysisResult, AssetAnalysis, MarketAsset } from "@/types";
import {
  type ConversationSession,
  type InvestorProfileContext,
  type TurnResolution,
} from "./conversationContext";
import { buildRuleBasedAnalysis, tryEnhanceWithOllama } from "./analysisService";
import { fetchMarketAssetBySymbol } from "./marketData";

// The shared AssetAnalysis type lives in @/types so analysisService
// and ollamaClient no longer import it from this module (which
// itself imports analysisService). Re-exported for compatibility.
export type { AssetAnalysis } from "@/types";

export interface AIConversationTurn {
  resolution: TurnResolution;
  result: AnalysisResult | null;
  clarification: string | null;
  assetAnalyses: AssetAnalysis[];
}

export interface AIConversationDependencies {
  fetchAsset(symbol: string): Promise<MarketAsset | null>;
  enhance(
    result: AnalysisResult,
    resolution: TurnResolution,
    assets: AssetAnalysis[]
  ): Promise<AnalysisResult["aiNarration"] | null>;
}

const defaultDependencies: AIConversationDependencies = {
  fetchAsset: (symbol) => fetchMarketAssetBySymbol(symbol),
  enhance: tryEnhanceWithOllama,
};

function calculateVolatility(asset: MarketAsset): number {
  const returns = asset.history.slice(1).map((point, index) => {
    const previous = asset.history[index].close || asset.history[index].price;
    const current = point.close || point.price;
    return previous > 0 ? (current - previous) / previous : 0;
  });
  if (returns.length === 0) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.round(Math.sqrt(variance) * 10000) / 100;
}

function calculateRsi(asset: MarketAsset): number | null {
  const changes = asset.history.slice(1).map((point, index) => {
    const previous = asset.history[index].close || asset.history[index].price;
    const current = point.close || point.price;
    return current - previous;
  }).slice(-14);
  if (changes.length === 0) return null;
  const gains = changes.reduce((sum, value) => sum + Math.max(value, 0), 0) / changes.length;
  const losses = changes.reduce((sum, value) => sum + Math.max(-value, 0), 0) / changes.length;
  if (losses === 0) return gains === 0 ? 50 : 100;
  return Math.round((100 - 100 / (1 + gains / losses)) * 100) / 100;
}

async function loadAssets(
  resolution: TurnResolution,
  fetchAsset: AIConversationDependencies["fetchAsset"]
): Promise<AssetAnalysis[]> {
  const symbols = resolution.intent === "comparison"
    ? resolution.comparisonSet
    : resolution.currentAsset
      ? [resolution.currentAsset]
      : [];
  const loaded = await Promise.all(symbols.map(async (symbol) => {
    const asset = await fetchAsset(symbol);
    return asset ? {
      symbol,
      price: asset.price,
      changePercent: asset.changePercent,
      volatilityPct: calculateVolatility(asset),
      rsi: calculateRsi(asset),
      // Unknown provenance is never presented as live data.
      dataSource: asset.dataSource ?? "mock",
    } : null;
  }));
  return loaded.filter((asset): asset is AssetAnalysis => asset !== null);
}

export function investorProfileFromResult(result: AnalysisResult): InvestorProfileContext {
  return {
    classification: result.investor.type,
    riskScore: result.riskScore,
    summary: result.investor.reason,
  };
}

export async function processAIMessage(
  session: ConversationSession,
  message: string,
  applicationLanguage: string,
  dependencies: AIConversationDependencies = defaultDependencies
): Promise<AIConversationTurn> {
  const resolution = session.processTurn(message);
  if (resolution.status === "needs_clarification") {
    return {
      resolution,
      result: null,
      clarification: resolution.clarification?.question ?? null,
      assetAnalyses: [],
    };
  }

  const assetAnalyses = await loadAssets(resolution, dependencies.fetchAsset);
  const result = buildRuleBasedAnalysis(
    message,
    resolution.language === "mixed" ? applicationLanguage : resolution.language,
    resolution,
    assetAnalyses
  );
  const enhanced = await dependencies.enhance(result, resolution, assetAnalyses);
  const finalResult = enhanced ? { ...result, aiNarration: enhanced } : result;
  // An investor profile enters the session only from a genuine
  // source: an explicit profile analysis turn (flagged by the
  // conversation layer), or a profile supplied by the app when the
  // session was created. Financial, asset and general analyses never
  // fabricate one from their incidental rule-based classification.
  if (resolution.establishesInvestorProfile) {
    session.setInvestorProfile(investorProfileFromResult(finalResult));
  }

  return {
    resolution,
    result: finalResult,
    clarification: null,
    assetAnalyses,
  };
}
