// =====================================================
// InvestED - Global Types
// =====================================================


// =====================================================
// Interests
// =====================================================

export type InterestArea =
  | "טכנולוגיה"
  | "פיננסים"
  | "בריאות"
  | "אנרגיה"
  | "נדל\"ן";




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
  | "קצר"
  | "בינוני"
  | "ארוך"
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

  initialInvestment:number;

  monthlyContribution:number;

  currentAge:number | null;

  targetAge:number | null;

  targetAmount:number | null;

  targetMonthlyIncome:number | null;

  years:number;

  assetClassKey:string;

  annualReturnPct:number;

  goal:string;

  confidence:number;

  detectedInterests:string[];

  riskProfile?:RiskLevel | string;

}




// =====================================================
// Investor
// =====================================================

export type InvestorType =
  | "משקיע דיבידנדים"
  | "משקיע פסיבי"
  | "משקיע שמרני"
  | "משקיע צמיחה"
  | "משקיע ערך"
  | "משקיע מאוזן";



export interface InvestorClassification {

  type:InvestorType;

  reason:string;

}





// =====================================================
// Profile
// =====================================================

export interface ProfileFlags {

  age:number | null;

  interests:InterestArea[];

  preferences:string[];

  knowledgeLevel:KnowledgeLevel;

  riskLevel:RiskLevel;

  horizon:InvestmentHorizon;

  goal:FinancialGoal;

  rawText?:string;

}





// =====================================================
// Risk
// =====================================================

export interface RiskDescription {

  band:string;

  volatility:string;

  psychology?:string;

  explanation?:string;

}





// =====================================================
// Explainable AI
// =====================================================

export interface AnalysisSignal {

  title:string;

  description:string;

  type?:string;

}





// =====================================================
// Portfolio
// =====================================================

export interface AllocationItem {

  name:string;

  value:number;

  label?:string;

  percentage?:number;

  color?:string;

}





// =====================================================
// Portfolio Intelligence Metrics
// =====================================================

export interface PortfolioMetrics {

  /**
   * Expected annual return estimate
   */
  expectedReturn:number;


  /**
   * Educational risk classification
   */
  riskLevel:
    | "נמוך"
    | "בינוני"
    | "גבוה";


  /**
   * Estimated volatility description
   */
  volatilityEstimate:string;


  /**
   * Portfolio diversification quality
   */
  diversification:string;


  /**
   * Equity allocation percentage
   */
  equityExposure:number;


  /**
   * Fixed income + cash percentage
   */
  fixedIncomeExposure:number;


  /**
   * Largest portfolio position
   */
  largestPosition:string;


  /**
   * Largest position percentage
   */
  largestPositionWeight:number;


  /**
   * Human readable explanation
   */
  explanation:string;

}






// =====================================================
// Projection
// =====================================================

export interface Projection {

  totalContributed:number;

  growth:number;

  finalBalance:number;

}





// =====================================================
// AI Narration
// =====================================================

export interface AiNarration {

  source:string;

  profileSummary?:string;

  portfolioSummary:string;

}





// =====================================================
// Analysis Result
// =====================================================

export interface AnalysisResult {


  profileText:string;


  flags:ProfileFlags;


  scenario:FinancialScenario | null;


  horizon:InvestmentHorizon;


  horizonExplanation?:string;


  investor:InvestorClassification;


  riskScore:number;


  riskDescription?:RiskDescription;


  allocation:AllocationItem[];


  /**
   * Portfolio Intelligence Layer
   * Optional because older analysis flows
   * may not calculate metrics yet.
   */
  portfolioMetrics?:PortfolioMetrics;


  projection:Projection;



  goalPlan?: {

    targetAmount:number;

    currentAmount:number;

    years:number;

    requiredMonthlyContribution:number;

    expectedFinalValue:number;

    progressPercentage:number;

    achievable:boolean;

  };




  explainability:{

    summary?:string;

    signals:AnalysisSignal[];

  };




  aiNarration:AiNarration;


}






// =====================================================
// Market
// =====================================================

export interface CandleDatum {

  date:string;

  open:number;

  high:number;

  low:number;

  close:number;

  price:number;

}



export interface MarketAsset {

  symbol:string;

  name:string;

  price:number;

  changePercent:number;

  history:CandleDatum[];

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


  name:string;


  riskLevel:number;


  whatItIs:string;


  suitableFor:string;


  pros:string[];


  cons:string[];


  stocks:string[];

}






// =====================================================
// Education
// =====================================================

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