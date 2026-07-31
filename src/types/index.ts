// ---------------------------------------------------------------------------
// InvestED — Shared Domain Types
// Clean UTF-8 Version
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Investor Profile
// ---------------------------------------------------------------------------

export type InterestArea =
  | "טכנולוגיה"
  | "פיננסים"
  | "בריאות"
  | "אנרגיה"
  | "נדל\"ן";



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



export interface ProfileFlags {

  rawText:string;

  age:number | null;

  riskLevel:RiskLevel;

  horizon:InvestmentHorizon;

  knowledgeLevel:KnowledgeLevel;

  interests:InterestArea[];

  preferences:string[];

  goal:FinancialGoal;

}



// ---------------------------------------------------------------------------
// Risk Engine
// ---------------------------------------------------------------------------


export interface RiskDescription {

  band:string;

  volatility:string;

  psychology:string;

}




export type HorizonBucket =
  | "קצר"
  | "בינוני"
  | "ארוך";





export interface InvestorClassification {

  type:InvestorType;

  reason:string;

}

// ---------------------------------------------------------------------------
// Investor Types
// ---------------------------------------------------------------------------


export type InvestorType =
  | "משקיע דיבידנדים"
  | "משקיע פסיבי"
  | "משקיע שמרני"
  | "משקיע צמיחה"
  | "משקיע ערך"
  | "משקיע מאוזן";




// ---------------------------------------------------------------------------
// Portfolio Allocation
// ---------------------------------------------------------------------------


export interface AllocationItem {

  name:string;

  value:number;

  color:string;

}




// ---------------------------------------------------------------------------
// Market Data
// ---------------------------------------------------------------------------


export interface MarketHistoryPoint {

  date:string;

  price:number;

  open:number;

  high:number;

  low:number;

  close:number;

}




export interface MarketAsset {

  symbol:string;

  name:string;

  price:number;

  changePercent:number;

  history:MarketHistoryPoint[];

}




// ---------------------------------------------------------------------------
// AI Narration
// ---------------------------------------------------------------------------


export interface AiNarration {

  source:
    | "ollama"
    | "fallback"
    | "rule-based";


  profileSummary:string;


  portfolioSummary:string;

}

// ---------------------------------------------------------------------------
// Financial Scenario & Calculator
// ---------------------------------------------------------------------------


export interface FinancialScenario {

  initialInvestment:number;

  monthlyContribution:number;

  currentAge:number | null;

  targetAge:number | null;

  targetAmount:number | null;

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



// ---------------------------------------------------------------------------
// Explainable AI
// ---------------------------------------------------------------------------


export interface Explainability {

  signals:string[];

  summary:string;

}

// ---------------------------------------------------------------------------
// Analysis Result
// ---------------------------------------------------------------------------


export interface AnalysisResult {

  profileText:string;


  flags:ProfileFlags;


  riskScore:number;


  riskDescription:RiskDescription;


  horizon:HorizonBucket;


  horizonExplanation:string;


  investor:InvestorClassification;


  allocation:AllocationItem[];


  explainability:Explainability;


  projection:ProjectionResult;


  scenario?:FinancialScenario;


  aiNarration:AiNarration;

}

// ---------------------------------------------------------------------------
// Strategies
// ---------------------------------------------------------------------------


export interface Strategy {

  id:string;

  name:string;

  riskLevel:number;

  whatItIs:string;

  pros:string[];

  cons:string[];

  suitableFor:string;

  stocks:string[];

}



// ---------------------------------------------------------------------------
// Quiz System
// ---------------------------------------------------------------------------


export interface QuizQuestion {

  id:number;

  question:string;

  options:string[];

  correctAnswer:number;

  explanation:string;

}


// ---------------------------------------------------------------------------
// Education Content
// ---------------------------------------------------------------------------


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

  description?:string;

  topics:string[];

}
