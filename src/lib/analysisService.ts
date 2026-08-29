import type {
  AnalysisResult,
  AnalysisSignal,
  AiNarration,
  AllocationItem,
  ProfileFlags,
  InvestorClassification,
  Projection,
} from "@/types";


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
  calculatePortfolioMetrics,
} from "./portfolioIntelligence";

import {
  formatCurrency,
} from "@/lib/format";


import {
  analyzeFinancialScenario,
  computeProjection,
} from "./calculatorEngine";


import {
  analyzeFinancialGoal,
} from "./goalEngine";


import {
  generateAIInsight,
} from "./aiExplanationEngine";


import {
  isOllamaAvailable,
  explainInvestorProfile,
  explainPortfolio,
} from "./ollamaClient";


// =====================================================
// Normalize Horizon
// =====================================================

function normalizeHorizon(
  horizon:
    | "short"
    | "medium"
    | "long"
    | null
) {

  switch (horizon) {

    case "short":
      return "short";

    case "long":
      return "long";

    case "medium":
    default:
      return "medium";

  }

}


// =====================================================
// AI Insight Signal Types
// =====================================================

type InsightType =
  | "risk"
  | "horizon"
  | "portfolio"
  | "goal"
  | "growth"
  | "confidence";


// =====================================================
// Signal Factory
// =====================================================

function createSignal(
  title: string,
  description: string,
  type: InsightType
): AnalysisSignal {

  return {
    title,
    description,
    type,
  };

}


// =====================================================
// Rule-Based Explainability Signals
// =====================================================

function generateAIInsights(

  flags: ProfileFlags,

  investor: InvestorClassification,

  riskScore: number,

  allocation: AllocationItem[],

  language: string = "en"

): AnalysisSignal[] {

  const insights: AnalysisSignal[] = [];

  const isHebrew = language === "he";


  // -----------------------------------------------------
  // Risk Insight
  // -----------------------------------------------------

  if (riskScore >= 7) {

    insights.push(
      createSignal(
        "Risk Insight",
        isHebrew
          ? "המערכת זיהתה פרופיל עם יכולת להתמודד עם תנודתיות גבוהה והתמקדות בצמיחה ארוכת טווח."
          : "The system identified a profile that can handle high volatility with a focus on long-term growth.",
        "risk"
      )
    );

  }

  else if (riskScore <= 3) {

    insights.push(
      createSignal(
        "Risk Insight",
        isHebrew
          ? "המערכת זיהתה העדפה ליציבות ושמירה על הון עם רמת סיכון נמוכה יותר."
          : "The system identified a preference for stability and capital preservation with a lower risk level.",
        "risk"
      )
    );

  }

  else {

    insights.push(
      createSignal(
        "Risk Insight",
        isHebrew
          ? "המערכת זיהתה איזון בין רצון לצמיחה לבין ניהול סיכונים."
          : "The system identified a balance between the desire for growth and risk management.",
        "risk"
      )
    );

  }


  // -----------------------------------------------------
  // Horizon Insight
  // -----------------------------------------------------

  if (flags.horizon === "long") {

    insights.push(
      createSignal(
        "Horizon Insight",
        isHebrew
          ? "אופק השקעה ארוך מאפשר להתמקד בתהליך השקעה הדרגתי ולהתמודד טוב יותר עם תנודתיות לאורך זמן."
          : "Long investment horizon allows focusing on a gradual investment process and better coping with volatility over time.",
        "horizon"
      )
    );

  }

  else if (flags.horizon === "short") {

    insights.push(
      createSignal(
        "Horizon Insight",
        isHebrew
          ? "אופק השקעה קצר דורש דגש גבוה יותר על נזילות, תנודתיות והתאמה למועד שבו הכסף צפוי להידרש."
          : "Short investment horizon requires greater emphasis on liquidity, volatility, and alignment with the expected time the money will be needed.",
        "horizon"
      )
    );

  }

  else {

    insights.push(
      createSignal(
        "Horizon Insight",
        isHebrew
          ? "אופק השקעה בינוני מאפשר לשלב בין פוטנציאל צמיחה לבין בחינה של רמת הסיכון והיעד הפיננסי."
          : "Medium investment horizon allows combining growth potential with consideration of risk level and financial goal.",
        "horizon"
      )
    );

  }


  // -----------------------------------------------------
  // Portfolio Insight
  // -----------------------------------------------------

  const allocationText =
    allocation
      .map(
        item =>
          `${item.name} ${item.value}%`
      )
      .join(", ");


  insights.push(
    createSignal(
      "Portfolio Insight",
      isHebrew
        ? `מבנה התיק החינוכי הותאם לסגנון "${investor.type}". הקצאת הנכסים הנוכחית: ${allocationText}.`
        : `The educational portfolio structure is adapted to the "${investor.type}" profile. Current asset allocation: ${allocationText}.`,
      "portfolio"
    )
  );


  // -----------------------------------------------------
  // Goal Insight
  // -----------------------------------------------------

  if (flags.goal) {

    insights.push(
      createSignal(
        "Goal Insight",
        isHebrew
          ? "המטרה הפיננסית שזוהתה שולבה כחלק מתהליך הניתוח והתכנון."
          : "The identified financial goal was integrated as part of the analysis and planning process.",
        "goal"
      )
    );

  }


  return insights;

}


// =====================================================
// AI Narration Engine
// =====================================================

function generateAiNarration(

  flags: ProfileFlags,

  investor: InvestorClassification,

  riskScore: number,

  allocation: AllocationItem[],

  projection: Projection | undefined,

  language: string = "en"

): AiNarration {

  const isHebrew = language === "he";

  const ageText =
    flags.age
      ? (isHebrew ? `גיל המשתמש ${flags.age}` : `User age: ${flags.age}`)
      : (isHebrew ? "גיל המשתמש לא הוזן" : "User age was not provided");


  const allocationText =
    allocation
      .map(
        item =>
          `${item.name} (${item.value}%)`
      )
      .join(", ");

  const growthText =
    projection && projection.finalBalance > 0
      ? (isHebrew
          ? `מתוך השווי סופי של ${formatCurrency(projection.finalBalance, projection.currency, "he")}, ` +
            `כ-${Math.round((projection.growth / projection.finalBalance) * 100)}% נובע מצמיחת השקעה.`
          : `Of the final value of ${formatCurrency(projection.finalBalance, projection.currency, "en")}, ` +
            `approximately ${Math.round((projection.growth / projection.finalBalance) * 100)}% comes from investment growth.`)
      : (isHebrew
          ? "לא זוהה תרחיש השקעה להמחשה."
          : "No investment scenario identified for illustration.");

  return {

    source:
      "InvestED Explainable AI Engine v5",

    profileSummary:
      isHebrew
        ? `${ageText}.
      סגנון השקעה שזוהה: ${investor.type}.
      ציון סיכון: ${riskScore}/10.
      המערכת התאימה את הניתוח לפי אופק ההשקעה, פרופיל הסיכון והעדפות המשתמש.`
        : `${ageText}.
      Identified investment style: ${investor.type}.
      Risk score: ${riskScore}/10.
      The system adapted the analysis according to investment horizon, risk profile, and user preferences.`,

    portfolioSummary:
      isHebrew
        ? `התיק החינוכי נבנה לפי עקרונות של פיזור,
      התאמת רמת סיכון ואופק השקעה.
      הקצאת הנכסים:
      ${allocationText}.
      ${growthText}
      המערכת מיועדת ללמידה פיננסית בלבד ואינה מהווה ייעוץ השקעות.`
        : `The educational portfolio was built based on diversification principles,
      risk level adjustment, and investment horizon.
      Asset allocation:
      ${allocationText}.
      ${growthText}
      The system is intended for financial learning only and does not constitute an investment recommendation.`

  };

}


// =====================================================
// Convert AI Insight to Analysis Signal
// =====================================================

function buildEngineSignals(

  insight: ReturnType<typeof generateAIInsight>

): AnalysisSignal[] {

  const signals: AnalysisSignal[] = [];


  signals.push(
    createSignal(
      "AI Risk Analysis",
      `${insight.riskEmoji} The educational risk level of the scenario: ${insight.riskLevel}.`,
      "risk"
    )
  );


  signals.push(
    createSignal(
      "AI Horizon Analysis",
      insight.horizonInsight,
      "horizon"
    )
  );


  signals.push(
    createSignal(
      "AI Growth Analysis",
      insight.growthInsight,
      "growth"
    )
  );


  signals.push(
    createSignal(
      "AI Diversification Analysis",
      insight.diversificationInsight,
      "portfolio"
    )
  );


  signals.push(
    createSignal(
      "AI Educational Guidance",
      insight.recommendation,
      "goal"
    )
  );


  signals.push(
    createSignal(
      "AI Confidence",
      `Analysis engine confidence in the scenario: ${insight.confidence}%.`,
      "confidence"
    )
  );


  return signals;

}


// =====================================================
// Rule Based Analysis
// =====================================================

export function buildRuleBasedAnalysis(
  profileText: string,
  language: string = "en"
): AnalysisResult {

  // =====================================================
  // Profile Extraction
  // =====================================================

  const flags =
    extractProfileFlags(
      profileText
    );


  // =====================================================
  // Risk
  // =====================================================

  const riskScore =
    computeRiskScore(
      flags
    );


  const riskDescription =
    riskScoreDescription(
      riskScore
    );


  // =====================================================
  // Horizon
  // =====================================================

  const bucket =
    horizonBucket(
      flags.horizon ?? "medium"
    );


  const horizon =
    normalizeHorizon(
      bucket
    );


  const hExplanation =
    horizonExplanation(
      flags.horizon ?? "medium"
    );


  // =====================================================
  // Investor Classification
  // =====================================================

  const investor =
    classifyInvestor(
      riskScore
    );


  // =====================================================
  // Portfolio Allocation
  // =====================================================

  const allocation =
    buildAllocation(
      investor.type,
      flags
    );


  // =====================================================
  // Portfolio Intelligence
  // =====================================================

  const portfolioMetrics =
    calculatePortfolioMetrics(
      allocation
    );


  // =====================================================
  // Financial Scenario
  // =====================================================

  const scenario =
    analyzeFinancialScenario(
      profileText
    );


  // =====================================================
  // Projection
  // =====================================================

  const projection =
    computeProjection(

      scenario.initialInvestment,

      scenario.monthlyContribution,

      scenario.years,

      scenario.annualReturnPct,

      undefined,

      scenario.currency

    );


  // =====================================================
  // Explainable AI Engine v4
  // =====================================================

  const aiInsight =
    generateAIInsight(
      scenario,
      projection
    );


  // =====================================================
  // Legacy Explainability
  // =====================================================

  const legacySignals =
    buildExplainability(
      flags,
      investor,
      riskScore,
      language
    );


  // =====================================================
  // Rule-Based Explainability
  // =====================================================

  const enhancedSignals =
    generateAIInsights(
      flags,
      investor,
      riskScore,
      allocation,
      language
    );


  // =====================================================
  // AI Engine Signals
  // =====================================================

  const engineSignals =
    buildEngineSignals(
      aiInsight
    );


  // =====================================================
  // Combined Explainability Layer
  // =====================================================

  const explainabilitySignals:
    AnalysisSignal[] = [

      ...engineSignals,

      ...enhancedSignals,

      ...legacySignals.map(
        (
          signal: string
        ) => ({

          title:
            signal.includes(":")
              ? signal
                  .split(":")[0]
                  .trim()
              : "AI Signal",

          description:
            signal.includes(":")
              ? signal
                  .split(":")
                  .slice(1)
                  .join(":")
                  .trim()
              : signal,

          type: "rule"

        })
      )

    ];


  // =====================================================
  // Goal Planner
  // =====================================================
  //
  // goalEngine remains the single source of truth for:
  //
  // - required monthly contribution
  // - expected final value
  // - progress
  // - achievable status
  // - gap to goal
  //
  // analysisService only connects the scenario
  // to the goal calculation engine.
  // =====================================================

  const targetAmount =
    scenario.targetAmount ?? 0;


  const goalPlan =
    targetAmount > 0
      ? {
          ...analyzeFinancialGoal(
            scenario.initialInvestment,
            targetAmount,
            scenario.years,
            scenario.annualReturnPct,
            scenario.monthlyContribution
          ),
          currency: scenario.currency,
        }
      : undefined;


  // =====================================================
  // Narration
  // =====================================================

  const baseAiNarration =
    generateAiNarration(

      flags,

      investor,

      riskScore,

      allocation,

      projection,

      language

    );


  const fallbackPortfolioText =
    portfolioNarrative(

      investor.type,

      allocation

    );


  // =====================================================
  // AI Engine Portfolio Explanation
  // =====================================================

  const enhancedPortfolioSummary =
    aiInsight.diversificationInsight;


  const combinedPortfolioSummary =
    [
      baseAiNarration.portfolioSummary,
      enhancedPortfolioSummary,
    ]
      .filter(Boolean)
      .join("\n\n");


  // =====================================================
  // Explainability Summary
  // =====================================================

  const explainabilitySummary =
    explainabilitySignals
      .map(
        signal =>
          `${signal.title}: ${signal.description}`
      )
      .join(" ");


  // =====================================================
  // Final Analysis Result
  // =====================================================

  return {

    profileText,

    flags,

    scenario,

    horizon,

    horizonExplanation:
      hExplanation,

    investor,

    riskScore,

    riskDescription,

    allocation,

    portfolioMetrics,

    projection,

    goalPlan,

    explainability: {

      signals:
        explainabilitySignals,

      summary:
        explainabilitySummary

    },

    aiNarration: {

      ...baseAiNarration,

      profileSummary:
        baseAiNarration.profileSummary,

      portfolioSummary:
        combinedPortfolioSummary ||
        fallbackPortfolioText

    },

    currency: scenario?.currency ?? "ILS"

  };

}


// =====================================================
// Ollama Enhancement
// =====================================================

export async function tryEnhanceWithOllama(

  result: AnalysisResult

): Promise<
  AnalysisResult["aiNarration"] | null
> {

  const ollamaUp =
    await isOllamaAvailable();


  if (!ollamaUp) {

    return null;

  }


  // =====================================================
  // Allocation Context
  // =====================================================

  const allocationSummary =
    result.allocation
      .map(
        item =>
          `${item.name}: ${item.value}%`
      )
      .join(", ");


  // =====================================================
  // Portfolio Intelligence Context
  // =====================================================

  const portfolioMetrics =
    result.portfolioMetrics;


  const portfolioContext =
    portfolioMetrics

      ? `Expected return: ${portfolioMetrics.expectedReturn}%.
Risk: ${portfolioMetrics.riskLevel}.
Volatility: ${portfolioMetrics.volatilityEstimate}.
Diversification: ${portfolioMetrics.diversification}.
Equity exposure: ${portfolioMetrics.equityExposure}%.
Largest position: ${portfolioMetrics.largestPosition} (${portfolioMetrics.largestPositionWeight}%).`

      : result.aiNarration.portfolioSummary;


  // =====================================================
  // Parallel AI Requests
  // =====================================================

  const [

    profileSummary,

    portfolioSummary

  ] = await Promise.all([

    explainInvestorProfile(

      result.investor.type,

      result.riskScore,

      result.investor.reason,

      result.profileText

    ),

    explainPortfolio(

      result.investor.type,

      allocationSummary,

      portfolioContext

    )

  ]);


  // =====================================================
  // Result
  // =====================================================

  return {

    profileSummary,

    portfolioSummary,

    source:
      "ollama"

  };

}
