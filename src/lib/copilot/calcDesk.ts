/**
 * Phase 3 (H3): a calculator reachable from one sentence. Detection is
 * deterministic; every number comes from calculatorEngine, never a model.
 * The return rate is an invented teaching assumption and is shown as such.
 */
import { analyzeFinancialScenarioWithProjection } from "../calculatorEngine";

export interface CalcDeskResult {
  principal: number;
  monthly: number;
  years: number;
  returnPct: number;
  currency: string;
  finalBalance: number;
  contributed: number;
  growth: number;
  real: number;
  target: number | null;
  reachesTarget: boolean | null;
}

const HAS_NUMBER = /\d/;
const HAS_YEARS = /\b\d+\s*(?:-|\s)?\s*(?:years?|yrs?)\b|\d+\s*(?:שנה|שנים|שנות)|ל-?\s*\d+\s*שנ|(?:years?|שנים)\s*\d+/i;
const HAS_INTENT = /\b(?:invest|save|saving|deposit|put away|grow|worth)\b|(?:אשקיע|משקיע|אחסוך|חוסך|אפקיד|מפקיד|להשקיע|לחסוך|כמה יהיה לי|כמה יצטבר)/i;

export function looksLikeCalcRequest(text: string): boolean {
  const t = text.trim();
  return HAS_NUMBER.test(t) && HAS_YEARS.test(t) && HAS_INTENT.test(t);
}

export function runCalcDesk(text: string): CalcDeskResult | null {
  if (!looksLikeCalcRequest(text)) return null;
  const r = analyzeFinancialScenarioWithProjection(text, "en");
  const s = r.scenario;
  if (!(s.years > 0) || (s.initialInvestment <= 0 && s.monthlyContribution <= 0)) return null;
  const target = s.targetAmount && s.targetAmount > 0 ? s.targetAmount : null;
  return {
    principal: s.initialInvestment,
    monthly: s.monthlyContribution,
    years: s.years,
    returnPct: s.annualReturnPct,
    currency: s.currency,
    finalBalance: r.projection.finalBalance,
    contributed: r.projection.totalContributed,
    growth: r.projection.growth,
    real: r.projection.realValueAfterInflation,
    target,
    reachesTarget: target === null ? null : r.projection.finalBalance >= target,
  };
}
