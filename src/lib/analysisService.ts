import type { AnalysisResult } from "@/types";

import {
  extractProfileFlags,
  computeRiskScore,
  riskScoreDescription,
  horizonBucket,
  horizonExplanation,
  classifyInvestor,
  buildExplainability,
} from "./riskEngine";

import {
  buildAllocation,
  portfolioNarrative,
} from "./portfolioEngine";

import {
  analyzeFinancialScenario,
  computeProjection,
} from "./calculatorEngine";

import {
  isOllamaAvailable,
  explainInvestorProfile,
  explainPortfolio,
} from "./ollamaClient";


// ---------------------------------------------------------------------------
// InvestED — Analysis Service
//
// שכבת האורקסטרציה הראשית:
// User Text
//    ↓
// Risk Engine
//    ↓
// Portfolio Engine
//    ↓
// Scenario Engine
//    ↓
// Dashboard Result
//
// Rule Based תמיד זמין.
// Ollama רק משפר ניסוח ברקע.
// ---------------------------------------------------------------------------


export function buildRuleBasedAnalysis(
  profileText: string
): AnalysisResult {


  // -----------------------------
  // Risk Analysis
  // -----------------------------

  const flags =
    extractProfileFlags(profileText);


  const riskScore =
    computeRiskScore(flags);


  const riskDescription =
    riskScoreDescription(riskScore);


  const horizon =
    horizonBucket(flags);


  const hExplanation =
    horizonExplanation(horizon);


  const investor =
    classifyInvestor(
      flags,
      riskScore
    );



  // -----------------------------
  // Portfolio Construction
  // -----------------------------

  const allocation =
    buildAllocation(
      investor.type,
      flags
    );


  const explainability =
    buildExplainability(
      flags,
      riskScore,
      investor
    );


  const fallbackPortfolioText =
    portfolioNarrative(
      investor.type,
      allocation
    );



  // -----------------------------
  // Investment Scenario Engine
  // -----------------------------

  const scenario =
    analyzeFinancialScenario(
      profileText
    );


  const projection =
    computeProjection(
      scenario.initialInvestment,
      scenario.monthlyContribution,
      scenario.years,
      scenario.annualReturnPct
    );



  return {

    profileText,

    flags,

    riskScore,

    riskDescription,

    horizon,

    horizonExplanation:
      hExplanation,

    investor,

    allocation,

    explainability,


    // חדש:
    scenario,

    projection,


    aiNarration: {

      profileSummary:
        investor.reason,


      portfolioSummary:
        fallbackPortfolioText,


      source:
        "rule-based",

    },

  };

}



// ---------------------------------------------------------------------------
// Ollama Enhancement Layer
// ---------------------------------------------------------------------------


export async function tryEnhanceWithOllama(
  result: AnalysisResult
): Promise<AnalysisResult["aiNarration"] | null> {


  const ollamaUp =
    await isOllamaAvailable();


  if (!ollamaUp) {
    return null;
  }



  const allocationSummary =
    result.allocation
      .map(
        (a) =>
          `${a.name}: ${a.value}%`
      )
      .join(", ");



  const [
    profileSummary,
    portfolioSummary,

  ] =
    await Promise.all([


      explainInvestorProfile(
        result.investor.type,
        result.riskScore,
        result.investor.reason,
        result.profileText
      ),



      explainPortfolio(
        result.investor.type,
        allocationSummary,
        result.aiNarration.portfolioSummary
      ),

    ]);



  return {

    profileSummary,

    portfolioSummary,

    source:
      "ollama",

  };

}