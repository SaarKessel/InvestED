// =====================================================
// InvestED - Global Types
// =====================================================


// =====================================================
// Interests
// =====================================================

export type InterestArea =
  | "technology"
  | "finance"
  | "healthcare"
  | "energy"
  | "real_estate";


// =====================================================
// Risk / Horizon
// =====================================================

export type RiskLevel =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high"
  | null;


export type InvestmentHorizon =
  | "short"
  | "medium"
  | "long"
  | null;


export type HorizonBucket =
  | "short"
  | "medium"
  | "long"
  | null;


export type KnowledgeLevel =
  | "beginner"
  | "some"
  | "experienced"
  | null;


export type FinancialGoal =
  | "wealth_growth"
  | "financial_independence"
  | "retirement"
  | "house_purchase"
  | "passive_income"
  | null;


// =====================================================
// Financial Scenario
// =====================================================
export interface FinancialScenario {

  initialInvestment: number;

  /**
   * Indicates whether the user explicitly provided
   * an initial investment amount.
   *
   * Optional for backwards compatibility with
   * legacy / backup analysis flows.
   */
  initialInvestmentSpecified?: boolean;

  monthlyContribution: number;

  currentAge: number | null;

  targetAge: number | null;

  targetAmount: number | null;

  targetMonthlyIncome: number | null;

  years: number;

  assetClassKey: string;

  annualReturnPct: number;

  goal: string;

  confidence: number;

  confidenceLevel?: "high" | "medium" | "low";

  confidenceReasons?: string[];

  detectedInterests: string[];

  riskProfile?: RiskLevel | string;

  currency: string;

}


// =====================================================
// Investor
// =====================================================

export type InvestorType =
  | "dividend"
  | "passive"
  | "conservative"
  | "growth"
  | "value"
  | "balanced";


export interface InvestorClassification {

  type: InvestorType;

  reason: string;

}


// =====================================================
// Profile
// =====================================================

export interface ProfileFlags {

  age: number | null;

  interests: InterestArea[];

  preferences: string[];

  knowledgeLevel: KnowledgeLevel;

  riskLevel: RiskLevel;

  horizon: InvestmentHorizon;

  goal: FinancialGoal;

  rawText?: string;

}


// =====================================================
// Risk
// =====================================================

export interface RiskDescription {

  band: string;

  volatility: string;

  psychology?: string;

  explanation?: string;

}


// =====================================================
// Explainable AI
// =====================================================

export interface AnalysisSignal {

  title: string;

  description: string;

  type?: string;

}


// =====================================================
// Portfolio
// =====================================================

export interface AllocationItem {

  name: string;

  value: number;

  label?: string;

  percentage?: number;

  color?: string;

}


// =====================================================
// Portfolio Intelligence Metrics
// =====================================================

export interface PortfolioMetrics {

  /**
   * Expected annual return estimate
   */
  expectedReturn: number;


  /**
   * Educational risk classification
   */
  riskLevel:
    | "low"
    | "medium"
    | "high";


  /**
   * Estimated volatility description
   */
  volatilityEstimate: string;


  /**
   * Portfolio diversification quality
   */
  diversification: string;


  /**
   * Equity allocation percentage
   */
  equityExposure: number;


  /**
   * Fixed income + cash percentage
   */
  fixedIncomeExposure: number;


  /**
   * Largest portfolio position
   */
  largestPosition: string;


  /**
   * Largest position percentage
   */
  largestPositionWeight: number;


  /**
   * Human readable explanation
   */
  explanation: string;

}


// =====================================================
// Projection
// =====================================================

export interface Projection {

  totalContributed: number;

  growth: number;

  finalBalance: number;

  /**
   * Inflation-adjusted educational projection.
   */
  realValueAfterInflation: number;

  /**
   * Year-by-year projection series used by
   * the Projection Chart UI.
   */
  series: {

    year: number;

    contributed: number;

    balance: number;

    currency: string;

  }[];

  currency: string;

}


// =====================================================
// AI Narration
// =====================================================

export interface AiNarration {

  source: string;

  profileSummary?: string;

  portfolioSummary: string;

  /**
   * Narration for a multi-turn AI conversation turn. Kept separate
   * from the profile/portfolio summaries so one conversation
   * response is never duplicated under two different meanings.
   */
  conversationSummary?: string;

}


// =====================================================
// Analysis Result
// =====================================================

export interface AnalysisResult {

  profileText: string;

  conversation?: {
    intent: "financial_projection" | "asset_analysis" | "investor_profile_fit" | "comparison" | "educational_question" | "strategy_question" | "general";
    language: "he" | "en" | "mixed";
    currentAsset: string | null;
    comparisonSet: string[];
    inheritedFromContext: string[];
    assetAnalyses: AssetAnalysis[];
    dataSources: MarketDataSource[];
    dataFreshness: MarketDataFreshness[];
    profileContextUsed: boolean;
    calculationUsed: boolean;
  };

  flags: ProfileFlags;

  scenario: FinancialScenario | null;

  horizon: InvestmentHorizon;

  horizonExplanation?: string;

  investor: InvestorClassification;

  riskScore: number;

  riskDescription?: RiskDescription;

  allocation: AllocationItem[];

  /**
   * Portfolio Intelligence Layer
   * Optional because older analysis flows
   * may not calculate metrics yet.
   */
  portfolioMetrics?: PortfolioMetrics;

  projection: Projection;

  goalPlan?: {

    targetAmount: number;

    currentAmount: number;

    years: number;

    requiredMonthlyContribution: number;

    monthlyContribution: number;

    expectedFinalValue: number;

    progressPercentage: number;

    achievable: boolean;

    /**
     * Remaining amount required to reach
     * the financial goal under the current scenario.
     *
     * Calculated by goalEngine.
     */
    gap: number;

    currency: string;

  };


  explainability: {

    summary?: string;

    signals: AnalysisSignal[];

  };


  aiNarration: AiNarration;

  currency: string;

}


// =====================================================
// Market
// =====================================================

export interface CandleDatum {

  date: string;

  open: number;

  high: number;

  low: number;

  close: number;

  price: number;

  volume?: number | null;

}

/** Alias used by the market-data layer for the same price point. */
export type MarketPricePoint = CandleDatum;


/**
 * Machine-readable origin of market data. "alpha_vantage" and
 * "yahoo_finance" mean the values came from a real market-data
 * provider (via the /api/market-quote provider router); "mock" means
 * they are simulated fallback values and must never be presented as
 * real market data.
 */
export type MarketDataSource =
  | "alpha_vantage"
  | "yahoo_finance"
  | "mock";

export type MarketAssetType =
  | "stock"
  | "etf"
  | "fund"
  | "index"
  | "unknown";

export type MarketStatus =
  | "open"
  | "closed"
  | "pre_market"
  | "after_hours"
  | "unknown";

/**
 * Truthful freshness classification, always derived from real
 * timestamps (never fabricated):
 * - "current": provider timestamp within the last few minutes
 * - "recent": provider timestamp older, but within the last days
 *   (e.g. market closed, weekend)
 * - "stale": real data too old to call recent
 * - "simulated": mock data
 * - "unavailable": no data at all
 */
export type MarketDataFreshness =
  | "current"
  | "recent"
  | "stale"
  | "simulated"
  | "unavailable";

export interface MarketAsset {

  symbol: string;

  name: string;

  assetType?: MarketAssetType;

  price: number;

  previousClose?: number | null;

  change?: number | null;

  changePercent: number;

  currency?: string | null;

  volume?: number | null;

  marketStatus?: MarketStatus;

  history: CandleDatum[];

  /** Origin of this asset's data; absent only in legacy fixtures. */
  dataSource?: MarketDataSource;

  /**
   * The provider's own timestamp for this data (ISO string), when
   * the provider supplies one. Null when unknown.
   */
  timestamp?: string | null;

  /** Freshness derived from real timestamps only. */
  freshness?: MarketDataFreshness;

  /**
   * True only for simulated fallback data. Absent/false means real
   * provider data. Unknown provenance is treated as mock downstream.
   */
  isMock?: boolean;

}

/**
 * Per-asset technical summary shared by the AI conversation
 * orchestrator, the analysis service and the Ollama client.
 * Lives here (shared types) so those modules never import
 * each other for it.
 */
export interface AssetAnalysis {

  symbol: string;

  price: number;

  changePercent: number;

  volatilityPct: number;

  rsi: number | null;

  /** Always known for real orchestration assets. */
  dataSource: MarketDataSource;

  /** True only for simulated fallback data; unknown provenance is mock. */
  isMock?: boolean;

  /** Provider timestamp for the underlying data (ISO), when known. */
  timestamp?: string | null;

  /** Truthful freshness classification, when known. */
  freshness?: MarketDataFreshness;

  currency?: string | null;

  marketStatus?: MarketStatus;

}


// =====================================================
// Strategies
// =====================================================

export interface Strategy {

  id:
    | "passive"
    | "dividend"
    | "growth"
    | "value";

  name:
    | string
    | {
        he: string;
        en: string;
      };

  riskLevel: number;

  whatItIs:
    | string
    | {
        he: string;
        en: string;
      };

  suitableFor:
    | string
    | {
        he: string;
        en: string;
      };

  pros:
    | string[]
    | {
        he: string[];
        en: string[];
      };

  cons:
    | string[]
    | {
        he: string[];
        en: string[];
      };

  stocks: string[];

}


// =====================================================
// Strategy Engine (Phase 6)
// =====================================================

export interface LocalizedText {
  he: string;
  en: string;
}

export type StrategyId =
  | "long-term-index"
  | "buy-and-hold"
  | "dollar-cost-averaging"
  | "value"
  | "growth"
  | "dividend"
  | "momentum"
  | "trend-following"
  | "risk-based-allocation"
  | "diversification";

export type StrategyTimeHorizon = "short" | "medium" | "long";

export type StrategyAssetType =
  | "index_funds"
  | "etfs"
  | "stocks"
  | "bonds"
  | "cash_equivalents"
  | "mixed";

export type StrategyDataRequirement =
  | "none"
  | "price_history"
  | "fundamentals"
  | "dividend_history"
  | "market_breadth";

export interface StrategyMetric {
  key: string;
  name: LocalizedText;
  description: LocalizedText;
}

/**
 * Structured investment-strategy model used by the Strategy
 * Engine. All user-facing content is bilingual; business logic
 * lives in src/lib/strategy/strategyEngine.ts, never in UI.
 */
export interface InvestmentStrategy {
  id: StrategyId;
  name: LocalizedText;
  description: LocalizedText;
  philosophy: LocalizedText;
  suitableFor: LocalizedText;
  riskProfile: {
    /** Educational 1-10 risk indication, not a promise of outcomes. */
    level: number;
    label: LocalizedText;
  };
  /** Horizons the strategy is commonly taught for, primary first. */
  timeHorizon: StrategyTimeHorizon[];
  assetTypes: StrategyAssetType[];
  rules: LocalizedText[];
  metrics: StrategyMetric[];
  /** Durable, well-documented history only; no invented figures. */
  historicalContext: LocalizedText;
  strengths: LocalizedText[];
  limitations: LocalizedText[];
  educationalNotes: LocalizedText;
  dataRequirements: StrategyDataRequirement[];
  /** Example tickers for market-context examples (learning only). */
  exampleAssets: string[];
  /** Extra search/detection terms beyond the name. */
  keywordsList: {
    he: string[];
    en: string[];
  };
}

export type StrategyFitLevel = "high" | "moderate" | "low";

export interface StrategyFitAssessment {
  status: "needs_profile" | "assessed";
  strategyId: StrategyId;
  fit: StrategyFitLevel | null;
  reasons: string[];
  /** Always present: this is education, never personalized advice. */
  disclaimer: string;
}

export interface StrategyComparisonRow {
  dimension: string;
  label: LocalizedText;
  values: string[];
}

// =====================================================
// Education
// =====================================================

export interface FinanceConcept {

  term:
    | string
    | {
        he: string;
        en: string;
      };

  definition:
    | string
    | {
        he: string;
        en: string;
      };

}


export interface Mistake {

  title:
    | string
    | {
        he: string;
        en: string;
      };

  detail:
    | string
    | {
        he: string;
        en: string;
      };

}


export interface RoadmapStage {

  stage:
    | string
    | {
        he: string;
        en: string;
      };

  title:
    | string
    | {
        he: string;
        en: string;
      };

  description?:
    | string
    | {
        he: string;
        en: string;
      };

  topics:
    | string[]
    | {
        he: string[];
        en: string[];
      };

}
