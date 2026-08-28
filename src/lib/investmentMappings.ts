// ---------------------------------------------------------------------------
// InvestED — Investment Mappings
// Centralized constants for risk levels, goals, and asset labels
// ---------------------------------------------------------------------------

export const RISK_LEVELS = {
  low: "low",
  medium: "medium",
  high: "high",
} as const;

export type RiskLevelKey = keyof typeof RISK_LEVELS;

export const RISK_LABELS: Record<string, { he: string; en: string }> = {
  low: { he: "נמוכה", en: "Low" },
  medium: { he: "בינונית", en: "Medium" },
  high: { he: "גבוהה", en: "High" },
  medium_high: { he: "בינונית-גבוהה", en: "Medium-High" },
};

export const GOAL_TYPES = {
  retirement: "retirement",
  home: "home",
  child: "child",
  growth: "growth",
  wealth: "wealth",
  general: "general",
} as const;

export type GoalType = keyof typeof GOAL_TYPES;

export const GOAL_LABELS: Record<string, { he: string; en: string }> = {
  retirement: { he: "פרישה ועצמאות כלכלית", en: "Retirement & Financial Independence" },
  home: { he: "רכישת דירה", en: "Home Purchase" },
  child: { he: "חיסכון לילדים", en: "Saving for Children" },
  growth: { he: "בניית הון", en: "Wealth Building" },
  wealth: { he: "בניית עושר", en: "Wealth Accumulation" },
  general: { he: "השקעה כללית", en: "General Investing" },
};

export const HORIZON_PROFILES = {
  short: "short",
  medium: "medium",
  long: "long",
} as const;

export type HorizonProfile = keyof typeof HORIZON_PROFILES;

export const HORIZON_LABELS: Record<string, { he: string; en: string }> = {
  short: { he: "קצר טווח", en: "Short Term" },
  medium: { he: "טווח בינוני", en: "Medium Term" },
  long: { he: "טווח ארוך", en: "Long Term" },
};

export const HORIZON_THRESHOLDS = {
  short: 5,
  medium: 15,
} as const;

export function getHorizonProfile(years: number): HorizonProfile {
  const safeYears = Number.isFinite(years) ? Math.max(0, years) : 0;
  if (safeYears < HORIZON_THRESHOLDS.short) return "short";
  if (safeYears < HORIZON_THRESHOLDS.medium) return "medium";
  return "long";
}

export function getHorizonLabel(years: number, language: "he" | "en"): string {
  const profile = getHorizonProfile(years);
  return HORIZON_LABELS[profile][language];
}

export function getGoalLabel(goal: string | undefined, language: "he" | "en"): string {
  if (!goal) return GOAL_LABELS.general[language];
  return GOAL_LABELS[goal]?.[language] ?? GOAL_LABELS.general[language];
}

export function getRiskLabel(risk: string | undefined, language: "he" | "en"): string {
  if (!risk) return RISK_LABELS.medium[language];
  return RISK_LABELS[risk]?.[language] ?? RISK_LABELS.medium[language];
}
