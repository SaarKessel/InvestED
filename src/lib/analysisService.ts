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
import { buildAllocation, portfolioNarrative } from "./portfolioEngine";
import { isOllamaAvailable, explainInvestorProfile, explainPortfolio } from "./ollamaClient";

// ---------------------------------------------------------------------------
// InvestED — Analysis Service
//
// עיצוב חשוב: buildRuleBasedAnalysis() היא סינכרונית (בפועל מהירה מאוד,
// מילישניות) ומחזירה דשבורד מלא ותקין מיד. שכבת ה-AI (Ollama) היא שיפור
// שמגיע ברקע, אם וכשהוא זמין — היא לעולם לא חוסמת את הצגת הדשבורד.
// זה מונע מצב שבו המשתמש "לא רואה כלום" בזמן שהאפליקציה מחכה לתשובה
// מרשת/מודל מקומי שאולי בכלל לא זמינים בדפדפן שלו.
// ---------------------------------------------------------------------------

export function buildRuleBasedAnalysis(profileText: string): AnalysisResult {
  const flags = extractProfileFlags(profileText);
  const riskScore = computeRiskScore(flags);
  const riskDescription = riskScoreDescription(riskScore);
  const horizon = horizonBucket(flags);
  const hExplanation = horizonExplanation(horizon);
  const investor = classifyInvestor(flags, riskScore);
  const allocation = buildAllocation(investor.type, flags);
  const explainability = buildExplainability(flags, riskScore, investor);
  const fallbackPortfolioText = portfolioNarrative(investor.type, allocation);

  return {
    profileText,
    flags,
    riskScore,
    riskDescription,
    horizon,
    horizonExplanation: hExplanation,
    investor,
    allocation,
    explainability,
    aiNarration: {
      profileSummary: investor.reason,
      portfolioSummary: fallbackPortfolioText,
      source: "rule-based",
    },
  };
}

/**
 * ניסיון שיפור ברקע דרך Ollama מקומי. מחזיר null אם Ollama לא זמין או
 * שהתשובה לא הגיעה בזמן סביר — במקרה כזה פשוט נשארים עם הטקסט מבוסס
 * הכללים שכבר מוצג למשתמש.
 */
export async function tryEnhanceWithOllama(
  result: AnalysisResult
): Promise<AnalysisResult["aiNarration"] | null> {
  const ollamaUp = await isOllamaAvailable();
  if (!ollamaUp) return null;

  const allocationSummary = result.allocation.map((a) => `${a.name}: ${a.value}%`).join(", ");

  const [profileSummary, portfolioSummary] = await Promise.all([
    explainInvestorProfile(result.investor.type, result.riskScore, result.investor.reason, result.profileText),
    explainPortfolio(result.investor.type, allocationSummary, result.aiNarration.portfolioSummary),
  ]);

  return { profileSummary, portfolioSummary, source: "ollama" };
}
