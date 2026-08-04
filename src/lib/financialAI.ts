// =====================================================
// InvestED - Financial AI Integration Layer
// =====================================================
// Connects:
// Calculator Engine
// Risk Engine
// Explainable AI Layer
// =====================================================


import {
  analyzeFinancialScenario,
  type FinancialScenario
} from "@/lib/calculatorEngine";


import {
  extractProfileFlags,
  computeRiskScore,
  classifyInvestor,
  recommendStrategies,
  generateLearningPath,
  buildExplainability
} from "@/lib/riskEngine";


import type {
  ProfileFlags,
  InvestorClassification
} from "@/types";



// =====================================================
// AI Analysis Result
// =====================================================


export interface FinancialAIResult {


  scenario:
    FinancialScenario;



  profile:
    ProfileFlags;



  risk:{

    score:number;

    investor:
      InvestorClassification;

  };



  strategies:
    string[];



  learningPath:
    string[];



  explainability:
    string[];

}



// =====================================================
// Main AI Analyzer
// =====================================================


export function analyzeInvestor(
  text:string
):FinancialAIResult {



  // -----------------------------------
  // Financial Scenario Analysis
  // -----------------------------------

  const scenario =
    analyzeFinancialScenario(
      text
    );



  // -----------------------------------
  // User Profile Detection
  // -----------------------------------

  const profile =
    extractProfileFlags(
      text
    );



  // -----------------------------------
  // Risk Calculation
  // -----------------------------------

  const riskScore =
    computeRiskScore(
      profile
    );



  const investor =
    classifyInvestor(
      riskScore
    );



  // -----------------------------------
  // Strategy Recommendations
  // -----------------------------------

  const strategies =
    recommendStrategies(
      riskScore,
      profile
    );



  // -----------------------------------
  // Learning Path
  // -----------------------------------

  const learningPath =
    generateLearningPath(
      profile
    );



  // -----------------------------------
  // Explainable AI
  // -----------------------------------

  const explainability =
    buildExplainability(
      profile,
      investor,
      riskScore
    );



  return {


    scenario,


    profile,


    risk:{

      score:
        riskScore,

      investor

    },


    strategies,


    learningPath,


    explainability


  };

}



// =====================================================
// Debug Helper
// =====================================================


export function debugFinancialAI(
  text:string
){

  return {

    input:
      text,


    result:
      analyzeInvestor(
        text
      )

  };

}



// =====================================================
// Demo Presets
// =====================================================


export const AI_TEST_CASES = [


  "אני בן 27, יש לי 100 אלף שקל להשקיע ל-20 שנה במדד S&P 500, אני מתחיל ומוכן לסיכון גבוה",



  "אני בן 40, מפקיד 3000 שקל בחודש למדד עולמי לטווח ארוך",



  "אני בן 60, רוצה לשמור על הכסף עם סיכון נמוך"



];