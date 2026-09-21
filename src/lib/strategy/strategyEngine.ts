// =====================================================
// InvestED - Phase 6: Strategy Engine
// =====================================================
// Business logic for the educational strategy universe:
// retrieval, search/filter, explanation, comparison,
// input/data requirements, genuine-profile educational fit,
// and provenance-aware market examples.
//
// Boundaries (never crossed):
// - Educational fit is NOT personalized investment advice.
// - No performance guarantees, no invented history, no
//   buy/sell instructions.
// - A fit assessment uses only a genuine InvestorProfileContext
//   supplied by the app; it is never fabricated.
// - Market data comes only through the injected fetcher
//   (the existing MarketDataService client path); nothing is
//   invented when data is unavailable.
// =====================================================

import type {
  InvestmentStrategy,
  LocalizedText,
  StrategyAssetType,
  StrategyDataRequirement,
  StrategyFitAssessment,
  StrategyId,
  StrategyTimeHorizon,
} from "@/types";
import type { InvestorProfileContext } from "@/lib/conversationContext";
import { STRATEGY_UNIVERSE } from "./strategyUniverse";

export type EngineLanguage = "he" | "en";

export function localize(text: LocalizedText, language: EngineLanguage): string {
  return language === "he" ? text.he : text.en;
}

// =====================================================
// Schema validation (used by tests and by the UI smoke path)
// =====================================================

const VALID_HORIZONS: StrategyTimeHorizon[] = ["short", "medium", "long"];
const VALID_ASSET_TYPES: StrategyAssetType[] = [
  "index_funds",
  "etfs",
  "stocks",
  "bonds",
  "cash_equivalents",
  "mixed",
];
const VALID_DATA_REQUIREMENTS: StrategyDataRequirement[] = [
  "none",
  "price_history",
  "fundamentals",
  "dividend_history",
  "market_breadth",
];

function isNonEmptyLocalized(value: unknown): value is LocalizedText {
  if (typeof value !== "object" || value === null) return false;
  const v = value as LocalizedText;
  return typeof v.he === "string" && v.he.trim().length > 0
    && typeof v.en === "string" && v.en.trim().length > 0;
}

export interface StrategyValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateStrategyUniverse(
  universe: InvestmentStrategy[] = STRATEGY_UNIVERSE
): StrategyValidationResult {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const strategy of universe) {
    if (!strategy.id || typeof strategy.id !== "string") {
      errors.push("strategy missing id");
      continue;
    }
    if (ids.has(strategy.id)) errors.push(`duplicate strategy id: ${strategy.id}`);
    ids.add(strategy.id);

    for (const field of [
      "name",
      "description",
      "philosophy",
      "suitableFor",
      "historicalContext",
      "educationalNotes",
    ] as const) {
      if (!isNonEmptyLocalized(strategy[field])) {
        errors.push(`${strategy.id}: ${field} must be non-empty in both languages`);
      }
    }
    if (!isNonEmptyLocalized(strategy.riskProfile?.label)) {
      errors.push(`${strategy.id}: riskProfile.label must be bilingual`);
    }
    if (
      typeof strategy.riskProfile?.level !== "number" ||
      strategy.riskProfile.level < 1 ||
      strategy.riskProfile.level > 10
    ) {
      errors.push(`${strategy.id}: riskProfile.level must be 1-10`);
    }
    if (!Array.isArray(strategy.timeHorizon) || strategy.timeHorizon.length === 0) {
      errors.push(`${strategy.id}: timeHorizon must be a non-empty array`);
    } else {
      for (const horizon of strategy.timeHorizon) {
        if (!VALID_HORIZONS.includes(horizon)) {
          errors.push(`${strategy.id}: invalid timeHorizon "${horizon}"`);
        }
      }
    }
    for (const assetType of strategy.assetTypes ?? []) {
      if (!VALID_ASSET_TYPES.includes(assetType)) {
        errors.push(`${strategy.id}: invalid assetType "${assetType}"`);
      }
    }
    if (!Array.isArray(strategy.assetTypes) || strategy.assetTypes.length === 0) {
      errors.push(`${strategy.id}: assetTypes must be non-empty`);
    }
    if (!Array.isArray(strategy.rules) || strategy.rules.length === 0) {
      errors.push(`${strategy.id}: rules must be non-empty`);
    } else {
      for (const rule of strategy.rules) {
        if (!isNonEmptyLocalized(rule)) errors.push(`${strategy.id}: every rule must be bilingual`);
      }
    }
    if (!Array.isArray(strategy.metrics) || strategy.metrics.length === 0) {
      errors.push(`${strategy.id}: metrics must be non-empty`);
    } else {
      for (const metric of strategy.metrics) {
        if (!metric.key || !isNonEmptyLocalized(metric.name) || !isNonEmptyLocalized(metric.description)) {
          errors.push(`${strategy.id}: every metric needs key + bilingual name/description`);
        }
      }
    }
    for (const listField of ["strengths", "limitations"] as const) {
      if (!Array.isArray(strategy[listField]) || strategy[listField].length === 0) {
        errors.push(`${strategy.id}: ${listField} must be non-empty`);
      } else {
        for (const item of strategy[listField]) {
          if (!isNonEmptyLocalized(item)) errors.push(`${strategy.id}: every ${listField} item must be bilingual`);
        }
      }
    }
    for (const requirement of strategy.dataRequirements ?? []) {
      if (!VALID_DATA_REQUIREMENTS.includes(requirement)) {
        errors.push(`${strategy.id}: invalid dataRequirement "${requirement}"`);
      }
    }
    if (!strategy.keywordsList || !Array.isArray(strategy.keywordsList.he) || !Array.isArray(strategy.keywordsList.en)) {
      errors.push(`${strategy.id}: keywordsList must contain he/en arrays`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// =====================================================
// Retrieval
// =====================================================

export function listStrategies(
  universe: InvestmentStrategy[] = STRATEGY_UNIVERSE
): InvestmentStrategy[] {
  return [...universe];
}

export function getStrategy(
  id: StrategyId | string,
  universe: InvestmentStrategy[] = STRATEGY_UNIVERSE
): InvestmentStrategy | null {
  return universe.find((strategy) => strategy.id === id) ?? null;
}

// =====================================================
// Detection (used by the conversation layer)
// =====================================================

/**
 * Detect strategies explicitly mentioned in free text, in
 * either language. Name fragments and declared keywords are
 * matched case-insensitively; earliest mention first.
 */
export function detectStrategyMentions(
  text: string,
  universe: InvestmentStrategy[] = STRATEGY_UNIVERSE
): StrategyId[] {
  const lower = text.toLowerCase();
  const found: Array<{ id: StrategyId; index: number }> = [];

  for (const strategy of universe) {
    const terms = [
      strategy.name.en,
      strategy.name.he,
      ...strategy.keywordsList.en,
      ...strategy.keywordsList.he,
    ];
    let earliest = -1;
    for (const term of terms) {
      const idx = lower.indexOf(term.toLowerCase());
      if (idx !== -1 && (earliest === -1 || idx < earliest)) earliest = idx;
    }
    if (earliest !== -1) found.push({ id: strategy.id, index: earliest });
  }

  found.sort((a, b) => a.index - b.index);
  return found.map((entry) => entry.id);
}

// =====================================================
// Search & filter
// =====================================================

/**
 * Search strategies by free text. Every query token must
 * match somewhere in the bilingual searchable text of the
 * strategy (name, description, philosophy, keywords).
 */
export function searchStrategies(
  query: string,
  universe: InvestmentStrategy[] = STRATEGY_UNIVERSE
): InvestmentStrategy[] {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  if (tokens.length === 0) return listStrategies(universe);

  return universe.filter((strategy) => {
    const haystack = [
      strategy.name.en,
      strategy.name.he,
      strategy.description.en,
      strategy.description.he,
      strategy.philosophy.en,
      strategy.philosophy.he,
      ...strategy.keywordsList.en,
      ...strategy.keywordsList.he,
    ].join(" ").toLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

export interface StrategyFilterCriteria {
  maxRiskLevel?: number;
  minRiskLevel?: number;
  timeHorizon?: StrategyTimeHorizon;
  assetType?: StrategyAssetType;
}

export function filterStrategies(
  criteria: StrategyFilterCriteria,
  universe: InvestmentStrategy[] = STRATEGY_UNIVERSE
): InvestmentStrategy[] {
  return universe.filter((strategy) => {
    if (criteria.maxRiskLevel !== undefined && strategy.riskProfile.level > criteria.maxRiskLevel) return false;
    if (criteria.minRiskLevel !== undefined && strategy.riskProfile.level < criteria.minRiskLevel) return false;
    if (criteria.timeHorizon && !strategy.timeHorizon.includes(criteria.timeHorizon)) return false;
    if (criteria.assetType && !strategy.assetTypes.includes(criteria.assetType)) return false;
    return true;
  });
}

// =====================================================
// Explanation
// =====================================================

export interface StrategyExplanation {
  strategy: InvestmentStrategy;
  language: EngineLanguage;
  name: string;
  description: string;
  philosophy: string;
  suitableFor: string;
  riskLevel: number;
  riskLabel: string;
  timeHorizon: StrategyTimeHorizon[];
  assetTypes: StrategyAssetType[];
  rules: string[];
  metrics: Array<{ key: string; name: string; description: string }>;
  historicalContext: string;
  strengths: string[];
  limitations: string[];
  educationalNotes: string;
  /** Educational boundary, always present. */
  disclaimer: string;
}

const EDUCATIONAL_DISCLAIMER: LocalizedText = {
  he: "התוכן לצורכי למידה בלבד. זוהי אינה המלצה, ייעוץ השקעות אישי או הוראת קנייה/מכירה, ושום תיאור היסטורי אינו מבטיח תוצאות עתידיות.",
  en: "This content is for education only. It is not a recommendation, personalized investment advice, or a buy/sell instruction, and no historical description guarantees future results.",
};

export function educationalDisclaimer(language: EngineLanguage): string {
  return localize(EDUCATIONAL_DISCLAIMER, language);
}

export function explainStrategy(
  id: StrategyId | string,
  language: EngineLanguage
): StrategyExplanation | null {
  const strategy = getStrategy(id);
  if (!strategy) return null;
  return {
    strategy,
    language,
    name: localize(strategy.name, language),
    description: localize(strategy.description, language),
    philosophy: localize(strategy.philosophy, language),
    suitableFor: localize(strategy.suitableFor, language),
    riskLevel: strategy.riskProfile.level,
    riskLabel: localize(strategy.riskProfile.label, language),
    timeHorizon: [...strategy.timeHorizon],
    assetTypes: [...strategy.assetTypes],
    rules: strategy.rules.map((rule) => localize(rule, language)),
    metrics: strategy.metrics.map((metric) => ({
      key: metric.key,
      name: localize(metric.name, language),
      description: localize(metric.description, language),
    })),
    historicalContext: localize(strategy.historicalContext, language),
    strengths: strategy.strengths.map((item) => localize(item, language)),
    limitations: strategy.limitations.map((item) => localize(item, language)),
    educationalNotes: localize(strategy.educationalNotes, language),
    disclaimer: educationalDisclaimer(language),
  };
}

// =====================================================
// Comparison
// =====================================================

export interface StrategyComparisonResult {
  language: EngineLanguage;
  strategies: StrategyExplanation[];
  rows: Array<{
    dimension: string;
    label: string;
    values: string[];
  }>;
  summary: string;
  disclaimer: string;
}

const HORIZON_LABELS: Record<StrategyTimeHorizon, LocalizedText> = {
  short: { he: "קצר", en: "Short" },
  medium: { he: "בינוני", en: "Medium" },
  long: { he: "ארוך", en: "Long" },
};

const ASSET_TYPE_LABELS: Record<StrategyAssetType, LocalizedText> = {
  index_funds: { he: "קרנות מדד", en: "Index funds" },
  etfs: { he: "קרנות סל", en: "ETFs" },
  stocks: { he: "מניות", en: "Stocks" },
  bonds: { he: "אג\"ח", en: "Bonds" },
  cash_equivalents: { he: "מזומן ושווי מזומן", en: "Cash & equivalents" },
  mixed: { he: "מעורב", en: "Mixed" },
};

export function horizonLabel(horizon: StrategyTimeHorizon, language: EngineLanguage): string {
  return localize(HORIZON_LABELS[horizon], language);
}

export function assetTypeLabel(assetType: StrategyAssetType, language: EngineLanguage): string {
  return localize(ASSET_TYPE_LABELS[assetType], language);
}

export function compareStrategies(
  ids: Array<StrategyId | string>,
  language: EngineLanguage
): StrategyComparisonResult | null {
  const explanations = ids.map((id) => explainStrategy(id, language));
  if (explanations.some((explanation) => explanation === null)) return null;
  const list = explanations as StrategyExplanation[];
  if (list.length < 2) return null;

  const rows = [
    {
      dimension: "risk",
      label: language === "he" ? "רמת סיכון" : "Risk level",
      values: list.map((item) => `${item.riskLevel}/10 (${item.riskLabel})`),
    },
    {
      dimension: "timeHorizon",
      label: language === "he" ? "אופק זמן" : "Time horizon",
      values: list.map((item) => item.timeHorizon.map((h) => horizonLabel(h, language)).join(", ")),
    },
    {
      dimension: "assetTypes",
      label: language === "he" ? "סוגי נכסים" : "Asset types",
      values: list.map((item) => item.assetTypes.map((a) => assetTypeLabel(a, language)).join(", ")),
    },
    {
      dimension: "strengths",
      label: language === "he" ? "חוזקות" : "Strengths",
      values: list.map((item) => item.strengths.join("; ")),
    },
    {
      dimension: "limitations",
      label: language === "he" ? "מגבלות" : "Limitations",
      values: list.map((item) => item.limitations.join("; ")),
    },
  ];

  const riskiest = [...list].sort((a, b) => b.riskLevel - a.riskLevel)[0];
  const calmest = [...list].sort((a, b) => a.riskLevel - b.riskLevel)[0];
  const summary = language === "he"
    ? `${list.map((item) => item.name).join(" מול ")}: ${riskiest.name} נושא את רמת הסיכון הגבוהה ביותר (${riskiest.riskLevel}/10) ו-${calmest.name} את הנמוכה ביותר (${calmest.riskLevel}/10). כולן מתאימות בעיקר לאופק ${list.every((item) => item.timeHorizon.includes("long")) ? "ארוך" : "מגוון"}.`
    : `${list.map((item) => item.name).join(" vs ")}: ${riskiest.name} carries the highest indicated risk (${riskiest.riskLevel}/10) and ${calmest.name} the lowest (${calmest.riskLevel}/10). All are mainly suited to a ${list.every((item) => item.timeHorizon.includes("long")) ? "long" : "mixed"} horizon.`;

  return {
    language,
    strategies: list,
    rows,
    summary,
    disclaimer: educationalDisclaimer(language),
  };
}

// =====================================================
// Input & data requirements
// =====================================================

export interface StrategyRequirements {
  strategyId: StrategyId;
  /** What the user supplies (educational, not account data). */
  userInputs: LocalizedText[];
  /** What market/fundamental data the strategy relies on. */
  dataRequirements: StrategyDataRequirement[];
  dataRequirementNotes: LocalizedText[];
}

const DATA_REQUIREMENT_NOTES: Record<StrategyDataRequirement, LocalizedText> = {
  none: { he: "לא נדרשים נתוני שוק", en: "No market data required" },
  price_history: { he: "היסטוריית מחירים דרך שירות נתוני השוק הקיים", en: "Price history via the existing market-data service" },
  fundamentals: { he: "נתוני יסוד (רווחים, מכפילים) - לא מסופקים כרגע בשירות הנתונים", en: "Fundamentals (earnings, ratios) - not currently supplied by the data service" },
  dividend_history: { he: "היסטוריית דיבידנדים - לא מסופקת כרגע בשירות הנתונים", en: "Dividend history - not currently supplied by the data service" },
  market_breadth: { he: "נתוני רוחב שוק - לא מסופקים כרגע בשירות הנתונים", en: "Market-breadth data - not currently supplied by the data service" },
};

const COMMON_USER_INPUTS: LocalizedText[] = [
  { he: "אופק השקעה משוער", en: "Estimated investment horizon" },
  { he: "סיבולת סיכון אישית", en: "Personal risk tolerance" },
  { he: "סכום או קצב הפקדה משוער", en: "An estimated amount or deposit pace" },
];

export function getStrategyRequirements(id: StrategyId | string): StrategyRequirements | null {
  const strategy = getStrategy(id);
  if (!strategy) return null;
  return {
    strategyId: strategy.id,
    userInputs: COMMON_USER_INPUTS,
    dataRequirements: [...strategy.dataRequirements],
    dataRequirementNotes: strategy.dataRequirements.map((requirement) => DATA_REQUIREMENT_NOTES[requirement]),
  };
}

// =====================================================
// Educational compatibility with a genuine investor profile
// =====================================================
// Uses ONLY the profile the app supplied (classification /
// riskScore). A missing or partial profile is a clarification,
// never an invention. The result states loudly that it is an
// educational fit, not personalized advice.

const FIT_BOUNDARY_NOTE: LocalizedText = {
  he: "הערכת התאמה לימודית בלבד על בסיס הפרופיל שנמסר - אינה ייעוץ השקעות מותאם אישית ואינה הוראה לפעול.",
  en: "Educational fit estimate only, based on the supplied profile - it is not personalized investment advice and not an instruction to act.",
};

function fitReason(text: LocalizedText, language: EngineLanguage): string {
  return localize(text, language);
}

export function evaluateEducationalFit(
  id: StrategyId | string,
  profile: InvestorProfileContext | null,
  language: EngineLanguage
): StrategyFitAssessment {
  const strategy = getStrategy(id);
  const disclaimer = `${educationalDisclaimer(language)} ${fitReason(FIT_BOUNDARY_NOTE, language)}`;

  if (!strategy) {
    return { status: "needs_profile", strategyId: id as StrategyId, fit: null, reasons: [], disclaimer };
  }

  if (!profile || typeof profile.riskScore !== "number") {
    return {
      status: "needs_profile",
      strategyId: strategy.id,
      fit: null,
      reasons: [
        language === "he"
          ? "חסר פרופיל משקיע אמיתי; לא ניתן להעריך התאמה בלי לומר דבר וחצי על המשקיע."
          : "A genuine investor profile is missing; no fit can be estimated without it.",
      ],
      disclaimer,
    };
  }

  const reasons: string[] = [];
  const gap = Math.abs(profile.riskScore - strategy.riskProfile.level);

  reasons.push(
    language === "he"
      ? `ציון הסיכון בפרופיל: ${profile.riskScore}/10 מול רמת הסיכון המאפיינת את האסטרטגיה: ${strategy.riskProfile.level}/10.`
      : `Profile risk score: ${profile.riskScore}/10 versus the strategy's typical risk level: ${strategy.riskProfile.level}/10.`
  );

  const classification = profile.classification?.toLowerCase() ?? "";
  if (classification) {
    const related: Record<string, StrategyId[]> = {
      passive: ["long-term-index", "buy-and-hold", "diversification", "risk-based-allocation"],
      balanced: ["risk-based-allocation", "diversification", "long-term-index", "dividend"],
      conservative: ["diversification", "risk-based-allocation", "dividend", "dollar-cost-averaging"],
      growth: ["growth", "momentum", "long-term-index"],
      dividend: ["dividend", "buy-and-hold"],
      value: ["value", "buy-and-hold"],
    };
    for (const [key, relatedIds] of Object.entries(related)) {
      if (classification.includes(key)) {
        if (relatedIds.includes(strategy.id)) {
          reasons.push(
            language === "he"
              ? `סיווג הפרופיל ("${profile.classification}") תואם באופן כללי את הגישה הזו.`
              : `The profile classification ("${profile.classification}") is broadly consistent with this approach.`
          );
        } else {
          reasons.push(
            language === "he"
              ? `סיווג הפרופיל ("${profile.classification}") אינו התאמה טבעית לגישה זו.`
              : `The profile classification ("${profile.classification}") is not a natural match for this approach.`
          );
        }
        break;
      }
    }
  }

  let fit: StrategyFitAssessment["fit"];
  if (gap <= 1) fit = "high";
  else if (gap <= 3) fit = "moderate";
  else fit = "low";

  reasons.push(
    language === "he"
      ? fit === "high"
        ? "רמות הסיכון קרובות - התאמה חינוכית גבוהה."
        : fit === "moderate"
          ? "רמות הסיכון במרחק בינוני - התאמה חינוכית חלקית."
          : "רמות הסיכון רחוקות - התאמה חינוכית נמוכה."
      : fit === "high"
        ? "Risk levels are close - high educational fit."
        : fit === "moderate"
          ? "Risk levels are moderately apart - partial educational fit."
          : "Risk levels are far apart - low educational fit."
  );

  return { status: "assessed", strategyId: strategy.id, fit, reasons, disclaimer };
}

// =====================================================
// Market examples with provenance (existing data layer only)
// =====================================================

export interface StrategyMarketExample {
  symbol: string;
  available: boolean;
  price: number | null;
  changePercent: number | null;
  dataSource: string | null;
  freshness: string | null;
  timestamp: string | null;
  isMock: boolean;
}

export type StrategyMarketFetcher = (symbol: string) => Promise<{
  price: number;
  changePercent: number;
  dataSource?: string;
  freshness?: string;
  timestamp?: string | null;
  isMock?: boolean;
} | null>;

/**
 * Load example assets for a strategy through the injected
 * market fetcher (the existing MarketDataService client
 * path). Unavailable or failed symbols are reported as
 * unavailable - values are never invented.
 */
export async function loadStrategyMarketExamples(
  id: StrategyId | string,
  fetchAsset: StrategyMarketFetcher,
  options: { limit?: number } = {}
): Promise<StrategyMarketExample[]> {
  const strategy = getStrategy(id);
  if (!strategy) return [];
  const symbols = strategy.exampleAssets.slice(0, options.limit ?? 3);

  return Promise.all(
    symbols.map(async (symbol): Promise<StrategyMarketExample> => {
      try {
        const asset = await fetchAsset(symbol);
        if (!asset) {
          return { symbol, available: false, price: null, changePercent: null, dataSource: null, freshness: null, timestamp: null, isMock: false };
        }
        return {
          symbol,
          available: true,
          price: asset.price,
          changePercent: asset.changePercent,
          dataSource: asset.dataSource ?? "mock",
          freshness: asset.freshness ?? (asset.isMock ? "simulated" : "unavailable"),
          timestamp: asset.timestamp ?? null,
          isMock: asset.isMock ?? (asset.dataSource ?? "mock") === "mock",
        };
      } catch {
        return { symbol, available: false, price: null, changePercent: null, dataSource: null, freshness: null, timestamp: null, isMock: false };
      }
    })
  );
}
