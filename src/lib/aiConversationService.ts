import type { AnalysisResult, AssetAnalysis, MarketAsset } from "@/types";
import {
  type ConversationSession,
  type InvestorProfileContext,
  type TurnResolution,
} from "./conversationContext";
import { buildRuleBasedAnalysis, tryEnhanceWithOllama } from "./analysisService";
import { fetchMarketAssetBySymbol } from "./marketData";
import { calculateRsi, calculateVolatility } from "./market/indicators";
import { researchAsset, type AssetResearch } from "./research/assetResearchEngine";
import { createOrchestrationPlan, type OrchestrationPlan } from "./intelligence/orchestrator";
import { buildCopilotResponse, type CopilotResponse, type StrategyCopilotPayload } from "./copilotResponse";
import { calculatePurchasePower, fxSymbolFor, parsePurchasePowerRequest, type PurchasePowerResult } from "./financialEducation";
import {
  compareStrategies,
  evaluateEducationalFit,
  explainStrategy,
  getStrategy,
  type EngineLanguage,
  type StrategyMarketExample,
} from "./strategy/strategyEngine";

// The shared AssetAnalysis type lives in @/types so analysisService
// and ollamaClient no longer import it from this module (which
// itself imports analysisService). Re-exported for compatibility.
export type { AssetAnalysis } from "@/types";

export interface AIConversationTurn {
  resolution: TurnResolution;
  result: AnalysisResult | null;
  clarification: string | null;
  assetAnalyses: AssetAnalysis[];
  assetResearch: AssetResearch[];
  orchestrationPlan: OrchestrationPlan;
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

const STRATEGY_MARKET_EXAMPLE_REQUEST =
  /\b(example|examples|market|price|prices|today|now)\b|דוגמ|שוק|מחיר|היום/i;

async function loadAssetsForSymbols(
  symbols: string[],
  fetchAsset: AIConversationDependencies["fetchAsset"]
): Promise<AssetAnalysis[]> {
  const loaded = await Promise.all(symbols.map(async (symbol): Promise<AssetAnalysis | null> => {
    const asset = await fetchAsset(symbol);
    if (!asset) return null;
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

/**
 * Build the Strategy Engine payload for a strategy turn:
 * explain / compare / profile-fit, plus provenance-carrying
 * market examples through the existing market-data path when
 * the turn asks for them. Educational only — never advice.
 */
async function buildStrategyPayload(
  message: string,
  resolution: TurnResolution,
  fetchAsset: AIConversationDependencies["fetchAsset"]
): Promise<{ payload: StrategyCopilotPayload; assets: AssetAnalysis[] }> {
  const language: EngineLanguage = resolution.language === "en" ? "en" : "he";
  const ids = resolution.strategyIds;
  const primaryId = ids[0];

  const comparison = ids.length >= 2 ? compareStrategies(ids, language) : null;
  const explanation = comparison ? null : primaryId ? explainStrategy(primaryId, language) : null;
  const fit = resolution.strategyFitRequested && primaryId
    ? evaluateEducationalFit(primaryId, resolution.investorProfileContext, language)
    : null;

  // Market examples only when the turn actually asks for them
  // and the strategy declares a price-history data requirement.
  let assets: AssetAnalysis[] = [];
  if (primaryId && STRATEGY_MARKET_EXAMPLE_REQUEST.test(message)) {
    const strategy = getStrategy(primaryId);
    if (strategy && strategy.dataRequirements.includes("price_history") && strategy.exampleAssets.length > 0) {
      assets = await loadAssetsForSymbols(strategy.exampleAssets.slice(0, 3), fetchAsset);
    }
  }

  const marketExamples: StrategyMarketExample[] = assets.map((asset) => ({
    symbol: asset.symbol,
    available: true,
    price: asset.price,
    changePercent: asset.changePercent,
    dataSource: asset.dataSource,
    freshness: asset.freshness ?? (asset.isMock ? "simulated" : "unavailable"),
    timestamp: asset.timestamp ?? null,
    isMock: asset.isMock ?? false,
  }));

  // Symbols the user asked about but the market layer could not
  // serve are surfaced as unavailable — never invented.
  if (primaryId && STRATEGY_MARKET_EXAMPLE_REQUEST.test(message)) {
    const strategy = getStrategy(primaryId);
    const wanted = strategy?.exampleAssets.slice(0, 3) ?? [];
    for (const symbol of wanted) {
      if (strategy?.dataRequirements.includes("price_history") && !assets.some((asset) => asset.symbol === symbol)) {
        marketExamples.push({
          symbol,
          available: false,
          price: null,
          changePercent: null,
          dataSource: null,
          freshness: null,
          timestamp: null,
          isMock: false,
        });
      }
    }
  }

  return {
    payload: {
      kind: comparison ? "compare" : "explain",
      explanation,
      comparison,
      fit,
      marketExamples,
    },
    assets,
  };
}

async function loadResearch(
  resolution: TurnResolution,
  fetchAsset: AIConversationDependencies["fetchAsset"]
): Promise<AssetResearch[]> {
  const symbols = resolution.intent === "comparison"
    ? resolution.comparisonSet
    : resolution.currentAsset ? [resolution.currentAsset] : [];
  const results = await Promise.all(symbols.map((symbol) =>
    researchAsset(symbol, { fetchAsset }, resolution.investorProfileContext)
  ));
  return results.filter((item): item is AssetResearch => item !== null);
}

function analysesFromResearch(research: AssetResearch[]): AssetAnalysis[] {
  return research.map((item) => ({
    symbol: item.symbol, price: item.quote.price, changePercent: item.quote.changePercent,
    volatilityPct: item.indicators.volatilityPct.value ?? 0, rsi: item.indicators.rsi14.value,
    dataSource: item.provenance.source, isMock: item.provenance.isMock,
    timestamp: item.provenance.timestamp, freshness: item.provenance.freshness,
    currency: item.quote.currency, marketStatus: item.quote.marketStatus as AssetAnalysis["marketStatus"],
  }));
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
      assetResearch: [],
      orchestrationPlan: createOrchestrationPlan(resolution),
      response: buildCopilotResponse(message, resolution, null, []),
    };
  }

  // Phase 6: strategy turns are answered by the Strategy Engine
  // (explain / compare / genuine-profile fit); market examples,
  // when requested, come through the same injected market path.
  const strategyTurn =
    resolution.intent === "strategy_question" && resolution.strategyIds.length > 0
      ? await buildStrategyPayload(message, resolution, dependencies.fetchAsset)
      : null;

  const assetResearch = strategyTurn
    ? []
    : await loadResearch(resolution, dependencies.fetchAsset);
  const assetAnalyses = strategyTurn
    ? strategyTurn.assets
    : analysesFromResearch(assetResearch);
  const purchaseRequest = parsePurchasePowerRequest(message);
  let purchasePower: PurchasePowerResult | null = null;
  if (purchaseRequest) {
    const asset = assetAnalyses.find((item) => item.symbol === purchaseRequest.symbol);
    const targetCurrency = asset?.currency ?? null;
    const pair = targetCurrency ? fxSymbolFor(purchaseRequest.sourceCurrency, targetCurrency) : null;
    const fxAssets = pair?.symbol ? await loadAssetsForSymbols([pair.symbol], dependencies.fetchAsset) : [];
    purchasePower = calculatePurchasePower(purchaseRequest, asset, fxAssets[0]);
  }

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
    assetResearch,
    orchestrationPlan: createOrchestrationPlan(resolution),
    response: buildCopilotResponse(
      message,
      resolution,
      finalResult,
      assetAnalyses,
      enhanced?.conversationSummary ?? null,
      strategyTurn?.payload ?? null,
      purchasePower
    ),
  };
}
