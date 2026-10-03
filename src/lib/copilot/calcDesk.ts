/**
 * Phase 3 (H3): a calculator reachable from one sentence. Detection is
 * deterministic; every number comes from calculatorEngine, never a model.
 * The return rate is an invented teaching assumption and is shown as such.
 */
import { analyzeFinancialScenarioWithProjection, computeProjection, DEFAULT_INFLATION_PCT } from "../calculatorEngine";

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
const HAS_INTENT = /\b(?:invest|save|saving|deposit|put away|grow|worth)\b|\badd(?:ing)?\s+\$?\d[\d,.]*k?\s*(?:\w+\s+){0,2}(?:per|a|each|every)\s+month\b|\b\d[\d,.]*k?\s*(?:per|a|each|every)\s+month\b|(?:מוסיף|מוסיפה|אוסיף)\s+\d[\d,.]*\s*(?:\S+\s+)?(?:ב|כל\s+)חודש|(?:אשקיע|משקיע|אחסוך|חוסך|אפקיד|מפקיד|להשקיע|לחסוך|כמה יהיה לי|כמה יצטבר)/i;

export function looksLikeCalcRequest(text: string): boolean {
  const t = text.trim();
  return HAS_NUMBER.test(t) && HAS_YEARS.test(t) && HAS_INTENT.test(t);
}

/** The engine can read "invest 10000 and save 500 a month" as a monthly 500 and no starting amount. When it found no starting amount, look for exactly one other plain amount in the sentence (not the monthly amount, not years, not a percent) and use it. Zero or several candidates: leave it alone. */
export function findStartingAmount(text: string, monthly: number, years: number, target: number | null = null): number | null {
  const amounts: number[] = [];
  for (const m of text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k\b)?(?!\d)/gi)) {
    const rest = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 12);
    if (/^\s*(?:%|per[\s-]?cent|pct\b|years?|yrs?|שנ|אחוז)/i.test(rest)) continue;
    if (/^\s*(?:(?:per|a|each|every|\/)\s*(?:month|week|day|שבוע|חודש)|weekly\b|monthly\b)/i.test(rest)) continue;
    if (/ל-?$/.test(text.slice(Math.max(0, (m.index ?? 0) - 2), m.index ?? 0)) && /^\s*שנ/.test(rest)) continue;
    if (/(?:&\s*P|S\s*&|nasdaq|dow|ftse|dax|index|מדד)\s*$/i.test(text.slice(Math.max(0, (m.index ?? 0) - 12), m.index ?? 0))) continue;
    const v = Number(m[1].replace(/,/g, "")) * (m[2] ? 1000 : 1);
    if (Number.isFinite(v) && v > 0) amounts.push(v);
  }
  const other = amounts.filter((v) => v !== monthly && v !== years && v !== target);
  return other.length === 1 ? other[0] : null;
}

export function runCalcDesk(text: string): CalcDeskResult | null {
  if (!looksLikeCalcRequest(text)) return null;
  const r = analyzeFinancialScenarioWithProjection(text, "en");
  const s = r.scenario;
  if (!(s.years > 0) || (s.initialInvestment <= 0 && s.monthlyContribution <= 0)) return null;
  let proj = r.projection;
  let principal = s.initialInvestment;
  if (principal <= 0) {
    const start = findStartingAmount(text, s.monthlyContribution, s.years, s.targetAmount);
    if (start !== null) { principal = start; proj = computeProjection(start, s.monthlyContribution, s.years, s.annualReturnPct, DEFAULT_INFLATION_PCT, s.currency); }
  }
  const target = s.targetAmount && s.targetAmount > 0 ? s.targetAmount : null;
  return {
    principal,
    monthly: s.monthlyContribution,
    years: s.years,
    returnPct: s.annualReturnPct,
    currency: s.currency,
    finalBalance: proj.finalBalance,
    contributed: proj.totalContributed,
    growth: proj.growth,
    real: proj.realValueAfterInflation,
    target,
    reachesTarget: target === null ? null : proj.finalBalance >= target,
  };
}
