// ---------------------------------------------------------------------------
// InvestED ג€” Financial Profile Model
// ---------------------------------------------------------------------------

export type RiskLevel =
  | "low"
  | "medium"
  | "high";


export type KnowledgeLevel =
  | "beginner"
  | "intermediate"
  | "advanced";


export type FinancialGoal =
  | "retirement"
  | "wealth"
  | "home"
  | "children"
  | "growth";



export interface FinancialProfile {


  // Personal Information

  age:number | null;


  occupation:string;


  // Financial Situation

  currentAssets:number;


  monthlyIncome:number | null;


  monthlyInvestment:number;



  // Investment Preferences

  riskLevel:RiskLevel;


  knowledgeLevel:KnowledgeLevel;


  interests:string[];



  // Goals

  primaryGoal:FinancialGoal;


  targetAmount:number | null;


  targetAge:number | null;



  // Original user input

  rawInput:string;



  createdAt:string;

}

