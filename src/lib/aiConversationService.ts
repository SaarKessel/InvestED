import type { AnalysisResult, AssetAnalysis, MarketAsset } from "@/types";
import {
  type ConversationSession,
  type InvestorProfileContext,
  type TurnResolution,
} from "./conversationContext";
import { buildRuleBasedAnalysis, tryEnhanceWithOllama } from "./analysisService";
import { fetchMarketAssetBySymbol } from "./marketData";
import { calculateRsi, calculateVolatility } from "./market/indicators";
import { buildCopilotResponse, type CopilotResponse } from "./copilotResponse";

// The shared AssetAnalysis type lives in @/types so analysisService
// and ollamaClient no longer import it from this module (which
// itself imports analysisService). Re-exported for compatibility.
export type { AssetAnalysis } from "@/types";

export interface AIConversationTurn {
  resolution: TurnResolution;
  result: AnalysisResult | null;
  clarification: string | null;
  assetAnalyses: AssetAnalysis[];
  response: CopilotResponse;
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

async function loadAssets(
  resolution: TurnResolution,
  fetchAsset: AIConversationDependencies["fetchAsset"]
): Promise<AssetAnalysis[]> {
  const symbols = resolution.intent === "comparison"
    ? resolution.comparisonSet
    : resolution.currentAsset
      ? [resolution.currentAsset]
      : [];
  const loaded = await Promise.all(symbols.map(async (symbol): Promise<AssetAnalysis | null> => {
    const asset = await fetchAsset(symbol);
    if (!asset) return null;
    // Unknown provenance is never presented as live data.
    const dataSource = asset.dataSource ?? "mock";
    return {
      symbol,
      price: asset.price,
      changePercent: asset.changePercent,
      volatilityPct: calculateVolatility(asset.history),
      rsi: calculateRsi(asset.history),
      dataSource,
      isMock: asset.isMock ?? dataSource === "mock",
      timestamp: asset.timestamp ?? null,
      freshness: asset.freshness ?? (dataSource === "mock" ? "simulated" : undefined),
      currency: asset.currency ?? null,
      marketStatus: asset.marketStatus ?? "unknown",
    };
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
      response: buildCopilotResponse(message, resolution, null, []),
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
    response: buildCopilotResponse(
      message,
      resolution,
      finalResult,
      assetAnalyses,
      enhanced?.conversationSummary ?? null
    ),
  };
}
