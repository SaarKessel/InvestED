// ---------------------------------------------------------------------------
// InvestED — Shared domain types
// ---------------------------------------------------------------------------

export type InterestArea =
  | "טכנולוגיה"
  | "פיננסים"
  | "בריאות"
  | "אנרגיה"
  | "נדל\"ן";

export type HorizonBucket =
  | "קצר"
  | "בינוני"
  | "ארוך";


export type InvestorType =
  | "משקיע דיבידנדים"
  | "משקיע ערך"
  | "משקיע פסיבי"
  | "משקיע שמרני"
  | "משקיע צמיחה"
  | "משקיע מאוזן";


export interface ProfileFlags {
  rawText: string;
  age: number | null;
  riskLevel:
    | "very_low"
    | "low"
    | "moderate"
    | "high"
    | "very_high"
    | null;

  horizon:
    | "short"
    | "medium"
    | "long"
    | null;

  knowledgeLevel:
    | "beginner"
    | "some"
    | "experienced"
    | null;

  interests: InterestArea[];

  preferences: string[];

  goal:
    | "wealth_growth"
    | "financial_independence"
    | "retirement"
    | "house_purchase"
    | "passive_income"
    | null;
}


export interface RiskDescription {
  band:string;
  volatility:string;
  psychology:string;
}


export interface InvestorClassification {
  type: InvestorType;
  reason:string;
}


export interface AllocationItem {
  name:string;
  value:number;
  color:string;
}


export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;

  history: {
    date: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
}

export interface AiNarration {
  source:
    | "ollama"
    | "fallback"
    | "rule-based"
    | "rule_based";

  profileSummary:string;
  portfolioSummary:string;
}


export interface FinancialScenario {
  initialInvestment:number;
  monthlyContribution:number;
  currentAge:number|null;
  targetAge:number|null;
  targetAmount:number|null;
  years:number;
  assetClassKey:string;
  annualReturnPct:number;
  goal:string;
}


export interface ProjectionPoint {
  year:number;
  contributed:number;
  balance:number;
}


export interface ProjectionResult {
  finalBalance:number;
  totalContributed:number;
  growth:number;
  realValueAfterInflation:number;
  series:ProjectionPoint[];
}

export interface FinanceConcept {
  term:string;
  definition:string;
}


export interface Mistake {
  title:string;
  detail:string;
}


export interface RoadmapStage {
  stage:string;
  title:string;
  topics:string[];
}


export interface Strategy {

  id: string;

  name: string;

  whatItIs: string;

  pros: string[];

  cons: string[];

  riskLevel: number;

  suitableFor: string;

  stocks: string[];
}


export interface AnalysisResult {

  profileText:string;

  flags:ProfileFlags;

  riskScore:number;

  riskDescription:RiskDescription;

  horizon:HorizonBucket;

  horizonExplanation:string;

  investor:InvestorClassification;

  allocation:AllocationItem[];

  explainability:{
    signals:string[];
    summary:string;
  };

  projection:ProjectionResult;

  
scenario?:FinancialScenario;

aiNarration:AiNarration;


}