import type {
  AnalysisResult,
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
  isOllamaAvailable,
  explainInvestorProfile,
  explainPortfolio,
} from "./ollamaClient";



// ---------------------------------------------------------------------------
// InvestED Analysis Service
// ---------------------------------------------------------------------------


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


const horizon =
  horizonBucket(
    flags.horizon ?? "medium"
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



  const explainability =
    buildExplainability(
      flags,
      investor,
      riskScore
    );



  const fallbackPortfolioText =
    portfolioNarrative(
      investor.type,
      allocation
    );



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


    explainability:{
      signals: explainability,
      summary: explainability.join(" ")
    },


    scenario,


    projection,



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




// ---------------------------------------------------------------------------
// Ollama Enhancement Layer
// ---------------------------------------------------------------------------


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