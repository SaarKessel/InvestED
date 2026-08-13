import type {
  AnalysisResult,
  AnalysisSignal,
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
  analyzeFinancialScenario,
  computeProjection,
} from "./calculatorEngine";


import {
  detectTargetAmount,
  analyzeFinancialGoal,
  buildRetirementPlan,
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

  switch (horizon) {

    case "קצר":
      return "short";

    case "בינוני":
      return "medium";

    case "ארוך":
      return "long";

    default:
      return "medium";

  }

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
  // Explainable AI
  // =====================================================


  const rawSignals =
    buildExplainability(
      flags,
      investor,
      riskScore
    );



  const explainability:AnalysisSignal[] =
    rawSignals.map(
      (signal:string)=>({

        title:
          signal.includes(":")
            ? signal.split(":")[0].trim()
            : "AI Signal",


        description:
          signal.includes(":")
            ? signal.split(":").slice(1).join(":").trim()
            : signal,


        type:"rule"

      })
    );



  const fallbackPortfolioText =
    portfolioNarrative(
      investor.type,
      allocation
    );



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


  const targetAmount =
    detectTargetAmount(
      profileText
    );



  const goalPlan =

    targetAmount > 0

    ?

    analyzeFinancialGoal(

      scenario.initialInvestment,

      targetAmount,

      scenario.years,

      scenario.annualReturnPct,

      scenario.monthlyContribution

    )

    :

    undefined;

  const retirementPlan =

    goalPlan &&
    scenario.goal === "retirement"

    ?

    buildRetirementPlan({
      currentAge: scenario.currentAge ?? 0,
      expectedRetirementAge: scenario.targetAge ?? scenario.currentAge ?? 0,
      currentAssets: scenario.initialInvestment,
      monthlyInvestment: scenario.monthlyContribution,
      annualReturnPct: scenario.annualReturnPct,
      inflationPct: 3,
      targetMonthlyIncome: Math.max(12000, Math.round(targetAmount / 12 / 0.04)),
    })

    :

    undefined;

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


    explainability:{


      signals:
        explainability,


      summary:
        explainability
          .map(
            (signal:AnalysisSignal)=>
              `${signal.title}: ${signal.description}`
          )
          .join(" ")


    },



    scenario,



    projection,



    goalPlan,

    retirementPlan,



    aiNarration:{


      profileSummary:
        investor.reason,


      portfolioSummary:
        fallbackPortfolioText,


      source:
        "rule-based"


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
        (a)=>
          `${a.name}: ${a.value}%`
      )

      .join(", ");






  const [
    profileSummary,
    portfolioSummary

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

    )



  ]);






  return {


    profileSummary,


    portfolioSummary,


    source:
      "ollama"



  };


}