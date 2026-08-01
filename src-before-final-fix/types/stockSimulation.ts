export type StockSimulationMode = "historical" | "projection";

export type ContributionCadence = "one_time" | "monthly_cash" | "monthly_shares";

export interface StockPricePoint {
  date: string;
  price: number;
}

export interface StockContributionPlan {
  cadence: ContributionCadence;
  initialInvestment?: number;
  monthlyContribution?: number;
  monthlyShares?: number;
}

export interface ParsedStockScenario {
  rawText: string;
  symbol: string | null;
  assetLabel: string | null;
  mode: StockSimulationMode;
  contribution: StockContributionPlan;
  years: number | null;
  startDate: string | null;
  ambiguities: string[];
}

export interface HistoricalStockSimulationInput {
  symbol: string;
  prices: StockPricePoint[];
  contribution: StockContributionPlan;
  startDate?: string;
  endDate?: string;
  purchaseFeePercent?: number;
}

export interface HistoricalPortfolioPoint {
  date: string;
  price: number;
  shares: number;
  contributed: number;
  value: number;
  drawdownPercent: number;
}

export interface HistoricalStockSimulationResult {
  symbol: string;
  invested: number;
  shares: number;
  finalValue: number;
  profit: number;
  returnPercent: number;
  annualizedReturnPercent: number | null;
  maxDrawdownPercent: number;
  purchases: number;
  series: HistoricalPortfolioPoint[];
}

export interface StockProjectionInput {
  symbol: string;
  years: number;
  annualReturnPercent: number;
  initialInvestment?: number;
  monthlyContribution?: number;
  inflationPercent?: number;
}

export interface StockProjectionPoint {
  month: number;
  contributed: number;
  value: number;
}

export interface StockProjectionResult {
  symbol: string;
  contributed: number;
  projectedValue: number;
  growth: number;
  realValueAfterInflation: number;
  series: StockProjectionPoint[];
}

