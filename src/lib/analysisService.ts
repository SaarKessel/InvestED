import type {
  AnalysisResult,
  AnalysisSignal,
  AiNarration,
  AllocationItem,
  ProfileFlags,
  InvestorClassification,
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
    | "קצר"
    | "בינוני"
    | "ארוך"
    | null
) {

  switch (horizon) {

    case "קצר":
      return "short";

    case "ארוך":
      return "long";

    case "בינוני":
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

  allocation: AllocationItem[]

): AnalysisSignal[] {

  const insights: AnalysisSignal[] = [];


  // -----------------------------------------------------
  // Risk Insight
  // -----------------------------------------------------

  if (riskScore >= 7) {

    insights.push(
      createSignal(
        "Risk Insight",
        "המערכת זיהתה פרופיל עם יכולת להתמודד עם תנודתיות גבוהה והתמקדות בצמיחה ארוכת טווח.",
        "risk"
      )
    );

  }

  else if (riskScore <= 3) {

    insights.push(
      createSignal(
        "Risk Insight",
        "המערכת זיהתה העדפה ליציבות ושמירה על הון עם רמת סיכון נמוכה יותר.",
        "risk"
      )
    );

  }

  else {

    insights.push(
      createSignal(
        "Risk Insight",
        "המערכת זיהתה איזון בין רצון לצמיחה לבין ניהול סיכונים.",
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
        "אופק השקעה ארוך מאפשר להתמקד בתהליך השקעה הדרגתי ולהתמודד טוב יותר עם תנודתיות לאורך זמן.",
        "horizon"
      )
    );

  }

  else if (flags.horizon === "short") {

    insights.push(
      createSignal(
        "Horizon Insight",
        "אופק השקעה קצר דורש דגש גבוה יותר על נזילות, תנודתיות והתאמה למועד שבו הכסף צפוי להידרש.",
        "horizon"
      )
    );

  }

  else {

    insights.push(
      createSignal(
        "Horizon Insight",
        "אופק השקעה בינוני מאפשר לשלב בין פוטנציאל צמיחה לבין בחינה של רמת הסיכון והיעד הפיננסי.",
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
      `מבנה התיק החינוכי הותאם לסגנון ${investor.type}. הקצאת הנכסים הנוכחית: ${allocationText}.`,
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
        "המטרה הפיננסית שזוהתה שולבה כחלק מתהליך הניתוח והתכנון.",
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

  allocation: AllocationItem[]

): AiNarration {

  const ageText =
    flags.age
      ? `גיל המשתמש ${flags.age}`
      : "גיל המשתמש לא הוזן";


  const allocationText =
    allocation
      .map(
        item =>
          `${item.name} (${item.value}%)`
      )
      .join(", ");


  return {

    source:
      "InvestED Explainable AI Engine v4",

    profileSummary:
      `${ageText}.
      סגנון השקעה שזוהה: ${investor.type}.
      ציון סיכון: ${riskScore}/10.
      המערכת התאימה את הניתוח לפי אופק ההשקעה, פרופיל הסיכון והעדפות המשתמש.`,

    portfolioSummary:
      `התיק החינוכי נבנה לפי עקרונות של פיזור,
      התאמת רמת סיכון ואופק השקעה.
      הקצאת הנכסים:
      ${allocationText}.
      המערכת מיועדת ללמידה פיננסית בלבד ואינה מהווה ייעוץ השקעות.`

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
      `${insight.riskEmoji} רמת הסיכון החינוכית של התרחיש: ${insight.riskLevel}.`,
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
      `רמת הביטחון של מנוע הניתוח בתרחיש: ${insight.confidence}%.`,
      "confidence"
    )
  );


  return signals;

}


// =====================================================
// Rule Based Analysis
// =====================================================

export function buildRuleBasedAnalysis(
  profileText: string
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

      scenario.annualReturnPct

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
      riskScore
    );


  // =====================================================
  // Rule-Based Explainability
  // =====================================================

  const enhancedSignals =
    generateAIInsights(
      flags,
      investor,
      riskScore,
      allocation
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
      ? analyzeFinancialGoal(

          scenario.initialInvestment,

          targetAmount,

          scenario.years,

          scenario.annualReturnPct,

          scenario.monthlyContribution

        )
      : undefined;


  // =====================================================
  // Narration
  // =====================================================

  const baseAiNarration =
    generateAiNarration(

      flags,

      investor,

      riskScore,

      allocation

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

    }

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
