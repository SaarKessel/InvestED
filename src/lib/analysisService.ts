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

  switch(horizon){

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
// AI Insight Engine v3
// =====================================================


type InsightType =
  | "risk"
  | "horizon"
  | "portfolio"
  | "goal";



function createSignal(
  title:string,
  description:string,
  type:InsightType
):AnalysisSignal {

  return {

    title,

    description,

    type

  };

}





function generateAIInsights(

  flags:ProfileFlags,

  investor:InvestorClassification,

  riskScore:number,

  allocation:AllocationItem[]

):AnalysisSignal[] {


  const insights:AnalysisSignal[] = [];



  // Risk Insight

  if(riskScore >= 7){

    insights.push(

      createSignal(

        "Risk Insight",

        "המערכת זיהתה פרופיל עם יכולת להתמודד עם תנודתיות גבוהה והתמקדות בצמיחה ארוכת טווח.",

        "risk"

      )

    );

  }


  else if(riskScore <=3){

    insights.push(

      createSignal(

        "Risk Insight",

        "המערכת זיהתה העדפה ליציבות ושמירה על הון עם רמת סיכון נמוכה.",

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




  // Horizon Insight

  if(flags.horizon === "long"){

    insights.push(

      createSignal(

        "Horizon Insight",

        "אופק השקעה ארוך מאפשר להתמקד בתהליך השקעה הדרגתי ולהתמודד טוב יותר עם תנודתיות.",

        "horizon"

      )

    );

  }



  if(flags.horizon === "short"){

    insights.push(

      createSignal(

        "Horizon Insight",

        "אופק השקעה קצר דורש דגש גבוה יותר על נזילות וניהול תנודתיות.",

        "horizon"

      )

    );

  }





  // Portfolio Insight

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

      `מבנה התיק הותאם לסגנון ${investor.type}. הקצאת הנכסים הנוכחית: ${allocationText}.`,

      "portfolio"

    )

  );




  // Goal Insight

  if(flags.goal){

    insights.push(

      createSignal(

        "Goal Insight",

        "המערכת שילבה את מטרת המשתמש כחלק מתהליך בניית התמונה הפיננסית.",

        "goal"

      )

    );

  }



  return insights;


}






// =====================================================
// AI Narration Engine v3
// =====================================================


function generateAiNarration(

  flags:ProfileFlags,

  investor:InvestorClassification,

  riskScore:number,

  allocation:AllocationItem[]

):AiNarration {



  const ageText =

    flags.age

      ? `גיל המשתמש ${flags.age}`

      :

      "גיל המשתמש לא הוזן";





  const allocationText =

    allocation

      .map(
        item =>
        `${item.name} (${item.value}%)`
      )

      .join(", ");





  return {


    source:
      "InvestED Explainable AI Engine v3",



    profileSummary:

      `${ageText}.
      סגנון השקעה שזוהה: ${investor.type}.
      ציון סיכון: ${riskScore}/10.
      המערכת התאימה את הניתוח לפי אופק ההשקעה והעדפות המשתמש.`,




    portfolioSummary:

      `התיק החינוכי נבנה לפי עקרונות של פיזור,
      התאמת רמת סיכון ואופק השקעה.
      הקצאת הנכסים:
      ${allocationText}.
      המערכת מיועדת ללמידה פיננסית בלבד ואינה מהווה ייעוץ השקעות.`


  };


}

// =====================================================
// Rule Based Analysis
// =====================================================


export function buildRuleBasedAnalysis(
  profileText:string
):AnalysisResult {


  const flags =
    extractProfileFlags(profileText);



  const riskScore =
    computeRiskScore(flags);



  const riskDescription =
    riskScoreDescription(
      riskScore
    );



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



  const investor =
    classifyInvestor(
      riskScore
    );



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
  // Explainable AI Signals
  // =====================================================


  const legacySignals =
    buildExplainability(
      flags,
      investor,
      riskScore
    );



  const enhancedSignals =
    generateAIInsights(
      flags,
      investor,
      riskScore,
      allocation
    );



  const explainabilitySignals:AnalysisSignal[] = [

    ...enhancedSignals,

    ...legacySignals.map(
      (signal:string)=>(

        {

          title:
            signal.includes(":")
              ? signal.split(":")[0].trim()
              :
              "AI Signal",


          description:
            signal.includes(":")
              ?
              signal.split(":").slice(1).join(":").trim()
              :
              signal,


          type:"rule"

        }

      )
    )

  ];







  // =====================================================
  // Financial Scenario
  // =====================================================


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






  // =====================================================
  // Goal Planner
  // =====================================================
  //
  // goalEngine is the single source of truth for:
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


  const aiNarration =

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



    explainability:{


      signals:
        explainabilitySignals,


      summary:

        explainabilitySignals

          .map(
            signal =>
              `${signal.title}: ${signal.description}`
          )

          .join(" ")

    },




    aiNarration:{


      ...aiNarration,


      portfolioSummary:

        aiNarration.portfolioSummary ||

        fallbackPortfolioText


    }


  };


}







// =====================================================
// Ollama Enhancement
// =====================================================


export async function tryEnhanceWithOllama(

  result:AnalysisResult

):Promise<AnalysisResult["aiNarration"] | null>{



  const ollamaUp =

    await isOllamaAvailable();




  if(!ollamaUp){

    return null;

  }





  const allocationSummary =

    result.allocation

      .map(
        item =>
          `${item.name}: ${item.value}%`
      )

      .join(", ");







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

      result.aiNarration.portfolioSummary

    )


  ]);







  return {


    profileSummary,


    portfolioSummary,


    source:

      "ollama"


  };


}