// ---------------------------------------------------------------------------
// InvestED — Shared domain types
// ---------------------------------------------------------------------------

export type InterestArea =
  | "טכנולוגיה"
  | "פיננסים"
  | "בריאות"
  | "אנרגיה"
  | "נדל\"ן";

export type InvestorType =
  | "משקיע פסיבי"
  | "משקיע צמיחה"
  | "משקיע דיבידנדים"
  | "משקיע מאוזן"
  | "משקיע שמרני"
  | "משקיע ערך";

export type HorizonBucket = "קצר" | "בינוני" | "ארוך";

export interface ProfileFlags {
  rawText: string;
  age: number | null;
  riskLevel: "very_low" | "low" | "moderate" | "high" | "very_high" | null;
  horizon: "short" | "medium" | "long" | null;
  knowledgeLevel: "beginner" | "some" | "experienced" | null;
  interests: InterestArea[];
  preferences: string[];
}

export interface RiskDescription {
  band: string;
  volatility: string;
  psychology: string;
}

export interface InvestorClassification {
  type: InvestorType;
  reason: string;
}

export interface AllocationItem {
  name: string;
  value: number;
  color: string;
}

export interface Strategy {
  id: string;
  name: string;
  whatItIs: string;
  pros: string[];
  cons: string[];
  riskLevel: number; // 1-10
  suitableFor: string;
  stocks: string[]; // דוגמאות מוכרות בלבד — לא המלצת השקעה
}

export interface FinanceConcept {
  term: string;
  definition: string;
}

export interface Mistake {
  title: string;
  detail: string;
}

export interface RoadmapStage {
  stage: string;
  title: string;
  topics: string[];
}

export interface AnalysisResult {
  profileText: string;
  flags: ProfileFlags;
  riskScore: number;
  riskDescription: RiskDescription;
  horizon: HorizonBucket;
  horizonExplanation: string;
  investor: InvestorClassification;
  allocation: AllocationItem[];
  explainability: {
    signals: string[];
    summary: string;
  };
  aiNarration: {
    profileSummary: string;
    portfolioSummary: string;
    source: "ollama" | "rule-based";
  };
}

export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  history: { date: string; price: number; open?: number; high?: number; low?: number; close?: number }[];
}
