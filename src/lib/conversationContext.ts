// =====================================================
// InvestED — Phase 3C: Conversation Context Layer
// =====================================================
// Multi-turn understanding for InvestED's AI.
//
// This module adds a per-session, in-memory conversation
// context on top of the existing engines:
//
// - calculatorEngine  (financial scenario parsing)
// - stockDetection    (asset entity detection)
// - riskEngine        (investor profile — supplied by the app)
//
// It does NOT replace any existing engine, does NOT persist
// anything (no localStorage, no database), and does NOT hold
// any module-level state: each session created by
// createConversationSession() owns its own isolated context.
//
// Context precedence (per product spec):
//   1. Explicit information in the current user message
//   2. Entities explicitly mentioned in the current turn
//   3. Relevant conversation context
//   4. Investor Profile (supplied by the app, never invented)
//   5. Safe defaults (existing engine defaults)
//
// Financial safety: currency, contribution, period, return
// rate and asset are never silently altered. A value changes
// only when the current turn states it explicitly; otherwise
// it is carried forward from context (and reported in
// inheritedFromContext) or left to the engine defaults.
// =====================================================

import { analyzeFinancialScenario } from "./calculatorEngine";
import { detectStrategyMentions } from "./strategy/strategyEngine";
import type { StrategyId } from "@/types";
import { extractProfileFlags } from "./riskEngine";
import { SP500_STOCKS } from "./sp500Stocks";

// =====================================================
// Public Types
// =====================================================

export type ConversationLanguage = "he" | "en" | "mixed";

export type ConversationIntent =
  | "financial_projection"
  | "asset_analysis"
  | "investor_profile_fit"
  | "comparison"
  | "educational_question"
  | "strategy_question"
  | "general";

export interface FinancialParameters {
  initialInvestment: number | null;
  monthlyContribution: number | null;
  years: number | null;
  annualReturnPct: number | null;
  currency: string | null;
}

export interface InvestorProfileContext {
  classification?: string;
  riskScore?: number;
  summary?: string;
}

export interface ConversationContext {
  currentIntent: ConversationIntent | null;
  currentLanguage: ConversationLanguage | null;
  currentAsset: string | null;
  comparisonSet: string[];
  /** Phase 6: active strategy focus and strategy comparison set. */
  currentStrategy: StrategyId | null;
  strategyComparisonSet: StrategyId[];
  financialParameters: FinancialParameters;
  investorProfileContext: InvestorProfileContext | null;
  lastRelevantTurn: number | null;
  turnCount: number;
}

export interface ClarificationRequest {
  question: string;
  missing: string[];
}

export type MergedScenario = ReturnType<typeof analyzeFinancialScenario>;

export interface TurnResolution {
  status: "resolved" | "needs_clarification";
  intent: ConversationIntent;
  language: ConversationLanguage;
  /** Resolved current asset for this turn (null when none / comparison). */
  currentAsset: string | null;
  comparisonSet: string[];
  /** Phase 6: strategies resolved for this turn (empty for non-strategy turns). */
  strategyIds: StrategyId[];
  /** True when the turn asks how a strategy fits the investor's profile. */
  strategyFitRequested: boolean;
  /** Merged financial parameters after precedence rules. */
  financialParameters: FinancialParameters;
  /**
   * Full merged financial scenario (existing engine output with
   * context-resolved values applied). Present only for
   * financial_projection turns.
   */
  scenario: MergedScenario | null;
  /** Echo of the investor profile actually used — never invented. */
  investorProfileContext: InvestorProfileContext | null;
  /**
   * True only when this turn is an explicit investor-profile
   * analysis: the user asked about their profile AND supplied real
   * self-description content. Only such turns may establish a
   * session profile downstream; financial/asset/general turns may
   * never fabricate one.
   */
  establishesInvestorProfile: boolean;
  /** Fields explicitly set by the current turn. */
  overrides: string[];
  /** Fields carried forward from conversation context. */
  inheritedFromContext: string[];
  clarification: ClarificationRequest | null;
}

export interface ProcessTurnOptions {
  /**
   * Currency selected by the UI. It is only a fallback when the current
   * turn and relevant conversation context do not provide a currency.
   */
  fallbackCurrency?: string;
}

export interface ConversationSession {
  processTurn(text: string, options?: ProcessTurnOptions): TurnResolution;
  getContext(): ConversationContext;
  setInvestorProfile(profile: InvestorProfileContext | null): void;
  reset(): void;
}

// =====================================================
// Language Detection (Hebrew / English / mixed)
// =====================================================
// Ticker-like tokens (AMD, NVDA) are not English words, so
// they are ignored when deciding whether a turn is mixed.

const TICKER_TOKEN_PATTERN = /\b[A-Z]{2,5}\b/g;

export function detectConversationLanguage(text: string): ConversationLanguage {
  const withoutTickers = text.replace(TICKER_TOKEN_PATTERN, " ");
  const hasHebrew = /[א-ת]/.test(withoutTickers);
  const hasEnglish = /[A-Za-z]/.test(withoutTickers);

  if (hasHebrew && hasEnglish) return "mixed";
  if (hasHebrew) return "he";
  return "en";
}

// =====================================================
// Entity Extraction (assets)
// =====================================================
// Words that look like tickers but are not assets.

const NON_ASSET_TOKENS = new Set([
  "RSI", "MACD", "EPS", "ETF", "AI",
  "ILS", "USD", "EUR", "GBP", "JPY",
  "AND", "OR", "THE", "FOR", "NOT", "ALL", "NEW", "NOW",
  "HOW", "WHY", "WHO", "WHAT", "VS",
]);

export function extractAssets(text: string): string[] {
  const found: Array<{ symbol: string; index: number }> = [];
  const lower = text.toLowerCase();

  // Keyword detection via the existing S&P 500 database.
  for (const stock of SP500_STOCKS) {
    let earliest = -1;
    for (const keyword of stock.keywords) {
      const idx = lower.indexOf(keyword.toLowerCase());
      if (idx !== -1 && (earliest === -1 || idx < earliest)) {
        earliest = idx;
      }
    }
    if (earliest !== -1) {
      found.push({ symbol: stock.symbol, index: earliest });
    }
  }

  // Uppercase ticker fallback (covers assets outside the
  // keyword database, e.g. AMD).
  const tickerMatches = text.matchAll(new RegExp(TICKER_TOKEN_PATTERN.source, "g"));
  for (const match of tickerMatches) {
    const token = match[0];
    if (NON_ASSET_TOKENS.has(token)) continue;
    const index = match.index ?? 0;
    const existing = found.find((entry) => entry.symbol === token);
    if (existing) {
      if (index < existing.index) existing.index = index;
    } else {
      found.push({ symbol: token, index });
    }
  }

  found.sort((a, b) => a.index - b.index);

  const unique: string[] = [];
  for (const entry of found) {
    if (!unique.includes(entry.symbol)) unique.push(entry.symbol);
  }
  return unique;
}

// =====================================================
// Follow-up Markers (language-agnostic intent signals)
// =====================================================

const FOLLOW_UP_PATTERNS: RegExp[] = [
  /ומה\s+אם/i,
  /מה\s+אם/i,
  /ומה\s+לגבי/i,
  /מה\s+לגבי/i,
  /ומה\s+עם/i,
  /מה\s+עם/i,
  /ובנוגע/i,
  /מה\s+דעתך/i,
  /\bwhat\s+if\b/i,
  /\bwhat\s+about\b/i,
  /\bhow\s+about\b/i,
  /\band\s+if\b/i,
  /\bactually\b/i,
  /\binstead\b/i,
  /בעצם/i,
];

const COMPARATIVE_PATTERNS: RegExp[] = [
  /איזה\s+יותר/i,
  /מה\s+יותר/i,
  /איזה\s+מהם/i,
  /\bwhich\s+is\s+more\b/i,
  /\bwhich\s+one\b/i,
  /\bwhich\s+(?:has|performed|performs|did)\b/i,
  /\bwhich\s+.*\b(?:better|worse)\b/i,
  /\bmore\s+(volatile|risky|expensive|stable|profitable)\b/i,
];

const STANDALONE_SCENARIO_VERBS =
  /משקיע|חוסך|מפקיד|מפריש|חיסכון|\binvest(?:ing|ment)?\b|\bsav(?:e|ing)\b|\bdeposit\b|\bcontribute\b|\bcalculat/i;

function hasFollowUpMarker(text: string): boolean {
  return FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(text));
}

function hasComparativeMarker(text: string): boolean {
  return COMPARATIVE_PATTERNS.some((pattern) => pattern.test(text));
}

// =====================================================
// Explicit Financial Parameter Detection
// =====================================================
// A parameter is "explicit" only when the current turn
// actually states it. These detectors mirror the existing
// engine's patterns and add follow-up change phrasing
// ("מגדיל ל-3,000", "increase to 3,000") that the
// single-turn engine intentionally does not parse.

interface ExplicitFinancial {
  monthlyContribution: number | null;
  years: number | null;
  annualReturnPct: number | null;
  initialInvestment: number | null;
  currency: string | null;
}

function parseNumeric(raw: string): number | null {
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : null;
}

const MONTHLY_PATTERNS: RegExp[] = [
  // Hebrew change verbs: מגדיל/מקטין/מעלה/מוריד/משנה ... ל-3,000
  /(?:מגדיל|מקטין|מעלה|מוריד|משנה|משנים|מעדכן)\s*(?:את\s+(?:ההפקדה|ההפקדה החודשית|הסכום|ההשקעה)\s*)?(?:ל-?\s*)?(\d[\d,]*(?:\.\d+)?)(?![\d,])(?!\s*(?:שנה|שנים|years?))/,
  // English change verbs: increase/change ... to 3,000
  /(?:increase|decrease|raise|lower|reduce|change|update)\s+(?:it\s+)?(?:the\s+)?(?:monthly\s+)?(?:contribution|deposit|investment|amount)?\s*(?:to|by|at)?\s*\$?\s*(\d[\d,]*(?:\.\d+)?)(?![\d,])(?!\s*(?:שנה|שנים|years?))/i,
  // Amount with explicit monthly cadence (mirrors calculatorEngine)
  /(\d[\d,]*(?:\.\d+)?)\s*(?:שקל|ש״ח|ש"ח|ils|₪|\$)?\s*(?:בחודש|לחודש|כל חודש|per month|a month|each month|every month|monthly)/i,
  // Hebrew contribution verbs (mirrors calculatorEngine)
  /(?:מפקיד|מוסיף|מפריש|חוסך)\s+(?:של\s+)?(\d[\d,]*(?:\.\d+)?)/,
  // English contribution verbs with cadence
  /(?:contribute|deposit|add|invest)\s+(\d[\d,]*(?:\.\d+)?)\s*(?:שקל|ils|₪|\$)?\s*(?:per month|a month|each month|every month|monthly)/i,
];

const YEARS_PATTERN = /(\d{1,2})\s*(?:שנים|שנה|years?)/i;

const RETURN_PCT_PATTERN = /(-?\d{1,2}(?:\.\d+)?)\s*%/;

function detectExplicitCurrency(text: string): string | null {
  if (/\bils\b|₪|שקל|ש״ח|ש"ח/i.test(text)) return "ILS";
  if (/\busd\b|\$|דולר|\bdollars?\b/i.test(text)) return "USD";
  if (/\beur\b|€|יורו|\beuros?\b/i.test(text)) return "EUR";
  if (/\bgbp\b|£|פאונד|\bpounds?\b/i.test(text)) return "GBP";
  if (/\bjpy\b|¥|\byen\b/i.test(text)) return "JPY";
  return null;
}

function detectExplicitFinancial(text: string): ExplicitFinancial {
  let monthlyContribution: number | null = null;
  for (const pattern of MONTHLY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const value = parseNumeric(match[1]);
      if (value !== null) {
        monthlyContribution = value;
        break;
      }
    }
  }

  let years: number | null = null;
  const yearsMatch = text.match(YEARS_PATTERN);
  if (yearsMatch) {
    const value = Number(yearsMatch[1]);
    if (Number.isFinite(value) && value >= 1 && value <= 60) {
      years = value;
    }
  }

  let annualReturnPct: number | null = null;
  const returnMatch = text.match(RETURN_PCT_PATTERN);
  if (returnMatch) {
    const value = Number(returnMatch[1]);
    if (Number.isFinite(value) && value >= -100 && value <= 100) {
      annualReturnPct = value;
    }
  }

  // Initial investment: reuse the existing engine's own
  // "explicitly specified" flag instead of re-implementing it.
  const engineScenario = analyzeFinancialScenario(text);
  const initialInvestment =
    engineScenario.initialInvestmentSpecified === true
      ? engineScenario.initialInvestment
      : null;

  return {
    monthlyContribution,
    years,
    annualReturnPct,
    initialInvestment,
    currency: detectExplicitCurrency(text),
  };
}

// =====================================================
// Explicit Investor-Profile Content
// =====================================================
// A turn carries genuine profile content only when the existing
// risk engine finds at least two independent self-description
// signals (risk preference, horizon, age, knowledge, goal,
// preferences or interests). A lone keyword is never enough to
// establish a profile.

function hasExplicitProfileContent(text: string): boolean {
  const flags = extractProfileFlags(text);
  let signals = 0;
  if (flags.riskLevel) signals += 1;
  if (flags.horizon) signals += 1;
  if (flags.age) signals += 1;
  if (flags.knowledgeLevel) signals += 1;
  if (flags.goal) signals += 1;
  if (flags.preferences.length > 0) signals += 1;
  if (flags.interests.length > 0) signals += 1;
  return signals >= 2;
}

// =====================================================
// Intent Detection
// =====================================================

const COMPARISON_KEYWORDS =
  /\bcompare\b|\bcomparison\b|\bversus\b|\bvs\b\.?|להשוות|השוואה|מול\s/i;

const PROFILE_KEYWORDS =
  /investor\s+profile|my\s+profile|fit\s+my|suits?\s+me|פרופיל|מתאים\s+לי|מתאים\s+בשבילי|הפרופיל\s+שלי/i;

const ANALYSIS_KEYWORDS =
  /\brsi\b|\bmacd\b|\banaly[sz]e\b|\banalysis\b|volatil|\bprice\b|ניתוח|תנודתיות|מחיר|לנתח|צופה|תחזית/i;

// Singular market questions need one asset. When the active context contains
// multiple compared assets, a missing subject is ambiguous rather than an
// educational/general question. Comparative/plural questions are handled by
// COMPARATIVE_PATTERNS and continue to use the full comparison set.
const SINGULAR_MARKET_DATA_KEYWORDS =
  /\bprice\b|\brsi\b|\bmacd\b|volatil|performance|performed|\breturn\b|\bchange\b|מחיר|תנודתיות|ביצועים|תשואה|שינוי/i;

const AMBIGUOUS_ASSET_REFERENCE =
  /\b(?:it|this asset|this stock|this one|the asset|the stock|the one)\b|(?:הנכס|המניה|אותו|אותה|הוא|היא)/i;

const STRATEGY_KEYWORDS = /strategy|allocation|portfolio strategy|אסטרטג|הקצא/i;

const EDUCATIONAL_KEYWORDS = /what\s+is|what\s+does|difference\s+between|why\s+does|explain|how\s+does|מה\s+זה|מה\s+ההבדל|תסביר|למה/i;

const FINANCIAL_KEYWORDS =
  /משקיע|השקעה|חוסך|חיסכון|מפקיד|הפקדה|פנסיה|פרישה|תשואה|\binvest|\bsav(e|ing)|deposit|contribution|projection|retir|\breturn\b|חישוב|calculate/i;

function detectExplicitIntent(
  text: string,
  assets: string[],
  explicit: ExplicitFinancial,
  strategies: StrategyId[] = []
): ConversationIntent | null {
  const hasExplicitFinancial =
    explicit.monthlyContribution !== null ||
    explicit.years !== null ||
    explicit.annualReturnPct !== null ||
    explicit.initialInvestment !== null;

  // Phase 6: explicit strategy entities route to the Strategy Engine.
  // A turn that also carries explicit financial parameters stays a
  // financial projection ("invest 100k in the S&P 500 index for 20
  // years" describes a calculation, not a strategy question).
  if (strategies.length > 0 && !hasExplicitFinancial) {
    if (PROFILE_KEYWORDS.test(text)) return "strategy_question";
    if (strategies.length >= 2 && (COMPARISON_KEYWORDS.test(text) || hasComparativeMarker(text))) {
      return "strategy_question";
    }
    if (STRATEGY_KEYWORDS.test(text) || EDUCATIONAL_KEYWORDS.test(text) || assets.length === 0) {
      return "strategy_question";
    }
  }

  if (COMPARISON_KEYWORDS.test(text)) return "comparison";
  if (hasComparativeMarker(text)) return "comparison";
  if (assets.length >= 2) return "comparison";
  if (PROFILE_KEYWORDS.test(text)) return "investor_profile_fit";
  if (ANALYSIS_KEYWORDS.test(text) && assets.length > 0) return "asset_analysis";

  if (FINANCIAL_KEYWORDS.test(text) || hasExplicitFinancial) {
    return "financial_projection";
  }
  if (STRATEGY_KEYWORDS.test(text)) return "strategy_question";
  if (EDUCATIONAL_KEYWORDS.test(text)) return "educational_question";

  // A bare asset mention ("What about AMD?") is an entity
  // signal, not a new intent: the turn inherits the
  // conversation's intent when one exists.
  return null;
}

// =====================================================
// Clarification Messages (never invent missing context)
// =====================================================

const CLARIFICATION_TEXT: Record<
  string,
  { he: string; en: string }
> = {
  prior_context: {
    he: "כדי לענות על שאלת ההמשך חסר הקשר קודם. מה תרצה לבדוק? למשל: חישוב השקעה, ניתוח נכס או השוואה בין נכסים.",
    en: "I don't have earlier context for this follow-up. What would you like to look at? For example: an investment calculation, an asset analysis, or a comparison.",
  },
  comparison_assets: {
    he: "אילו נכסים תרצה להשוות? ציין לפחות שני נכסים, למשל NVDA ו-AMD.",
    en: "Which assets would you like to compare? Name at least two, for example NVDA and AMD.",
  },
  investor_profile: {
    he: "עדיין אין לי את פרופיל המשקיע שלך. השלם קודם את ניתוח הפרופיל כדי שאוכל לבדוק התאמה.",
    en: "I don't have your investor profile yet. Complete the profile analysis first so I can check the fit.",
  },
  strategy_selection: {
    he: "איזו אסטרטגיה מעניינת אותך? למשל: השקעת מדדים, מיצוע עלויות, ערך, צמיחה, דיבידנד, מומנטום או פיזור.",
    en: "Which strategy are you interested in? For example: index investing, dollar-cost averaging, value, growth, dividend, momentum, or diversification.",
  },
};

function buildClarification(
  missing: string[],
  language: ConversationLanguage
): ClarificationRequest {
  const key = missing[0] ?? "prior_context";
  const text = CLARIFICATION_TEXT[key] ?? CLARIFICATION_TEXT.prior_context;
  return {
    question: language === "en" ? text.en : text.he,
    missing,
  };
}

// =====================================================
// Session Factory
// =====================================================

interface SessionState {
  currentIntent: ConversationIntent | null;
  currentLanguage: ConversationLanguage | null;
  currentAsset: string | null;
  comparisonSet: string[];
  currentStrategy: StrategyId | null;
  strategyComparisonSet: StrategyId[];
  financialParameters: FinancialParameters;
  investorProfileContext: InvestorProfileContext | null;
  lastRelevantTurn: number | null;
  turnCount: number;
}

const EMPTY_FINANCIAL: FinancialParameters = {
  initialInvestment: null,
  monthlyContribution: null,
  years: null,
  annualReturnPct: null,
  currency: null,
};

function freshState(
  investorProfile: InvestorProfileContext | null
): SessionState {
  return {
    currentIntent: null,
    currentLanguage: null,
    currentAsset: null,
    comparisonSet: [],
    currentStrategy: null,
    strategyComparisonSet: [],
    financialParameters: { ...EMPTY_FINANCIAL },
    investorProfileContext: investorProfile,
    lastRelevantTurn: null,
    turnCount: 0,
  };
}

export function createConversationSession(options?: {
  investorProfile?: InvestorProfileContext | null;
}): ConversationSession {
  // All state lives inside this closure: sessions are fully
  // isolated from each other and nothing is persisted.
  let state: SessionState = freshState(options?.investorProfile ?? null);

  function snapshot(): ConversationContext {
    return {
      currentIntent: state.currentIntent,
      currentLanguage: state.currentLanguage,
      currentAsset: state.currentAsset,
      comparisonSet: [...state.comparisonSet],
      currentStrategy: state.currentStrategy,
      strategyComparisonSet: [...state.strategyComparisonSet],
      financialParameters: { ...state.financialParameters },
      investorProfileContext: state.investorProfileContext
        ? { ...state.investorProfileContext }
        : null,
      lastRelevantTurn: state.lastRelevantTurn,
      turnCount: state.turnCount,
    };
  }

  function processTurn(text: string, options: ProcessTurnOptions = {}): TurnResolution {
    const turnIndex = state.turnCount;
    const language = detectConversationLanguage(text);
    const assets = extractAssets(text);
    const explicit = detectExplicitFinancial(text);
    const strategyMentions = detectStrategyMentions(text);
    const explicitIntent = detectExplicitIntent(text, assets, explicit, strategyMentions);

    const hasContext = state.lastRelevantTurn !== null;
    const followUpMarker = hasFollowUpMarker(text);
    const comparativeMarker = hasComparativeMarker(text);

    const hasAnyExplicitFinancial =
      explicit.monthlyContribution !== null ||
      explicit.years !== null ||
      explicit.annualReturnPct !== null ||
      explicit.initialInvestment !== null ||
      explicit.currency !== null;

    const isFollowUp =
      followUpMarker ||
      comparativeMarker ||
      (hasContext &&
        hasAnyExplicitFinancial &&
        !STANDALONE_SCENARIO_VERBS.test(text));

    // Genuine profile content supplied in this turn. Only an
    // explicit profile-intent turn carrying it may establish a
    // profile.
    const turnHasProfileContent = hasExplicitProfileContent(text);
    const establishesInvestorProfile =
      explicitIntent === "investor_profile_fit" && turnHasProfileContent;

    // -------------------------------------------------
    // Precedence 1-2: current-turn information and entities
    // -------------------------------------------------
    const ambiguousComparisonAsset =
      assets.length === 0 &&
      state.comparisonSet.length > 1 &&
      !comparativeMarker &&
      (SINGULAR_MARKET_DATA_KEYWORDS.test(text) || AMBIGUOUS_ASSET_REFERENCE.test(text));

    let intent: ConversationIntent | null = ambiguousComparisonAsset
      ? "asset_analysis"
      : explicitIntent;

    // -------------------------------------------------
    // Precedence 3: relevant conversation context
    // -------------------------------------------------
    if (intent === null && isFollowUp && hasContext) {
      intent = state.currentIntent;
    }
    if (intent === null && assets.length > 0) {
      intent = "asset_analysis";
    }
    if (intent === null) {
      intent = "general";
    }

    const resolvedComparisonSet =
      assets.length >= 2
        ? assets
        : ambiguousComparisonAsset
          ? [...state.comparisonSet]
          : intent === "comparison" && isFollowUp && hasContext
            ? [...state.comparisonSet]
            : [];

    const explicitAsset =
      intent === "comparison"
        ? null
        : assets.length > 0
          ? assets[assets.length - 1]
          : null;

    const currentAsset =
      explicitAsset ??
      (isFollowUp && intent !== "comparison" ? state.currentAsset : null);

    const overrides: string[] = [];
    const inheritedFromContext: string[] = [];

    // -------------------------------------------------
    // Phase 6: resolve strategy entities for this turn.
    // Explicit mentions win; a strategy follow-up inherits
    // the session's strategy focus / comparison set.
    // -------------------------------------------------
    const strategyFitRequested =
      intent === "strategy_question" &&
      (PROFILE_KEYWORDS.test(text) || (isFollowUp && state.currentIntent === "strategy_question" && state.currentStrategy !== null && PROFILE_KEYWORDS.test(text)));

    const resolvedStrategyIds: StrategyId[] =
      intent !== "strategy_question"
        ? []
        : strategyMentions.length > 0
          ? strategyMentions
          : isFollowUp && state.currentStrategy
            ? state.strategyComparisonSet.length >= 2
              ? [...state.strategyComparisonSet]
              : [state.currentStrategy]
            : [];

    // -------------------------------------------------
    // Missing context → clarification (never guess)
    // -------------------------------------------------
    let clarification: ClarificationRequest | null = null;

    if (ambiguousComparisonAsset) {
      const candidates = state.comparisonSet.join(" and ");
      clarification = {
        question: language === "en"
          ? `Which asset do you mean: ${candidates}?`
          : `לאיזה נכס התכוונת: ${state.comparisonSet.join(" או ")}?`,
        missing: ["asset"],
      };
    } else if (isFollowUp && !hasContext) {
      clarification = buildClarification(["prior_context"], language);
    } else if (intent === "comparison" && resolvedComparisonSet.length < 2) {
      clarification = buildClarification(["comparison_assets"], language);
    } else if (
      intent === "investor_profile_fit" &&
      !state.investorProfileContext &&
      !turnHasProfileContent
    ) {
      // A fit question without any genuine profile (neither in
      // context nor described in this turn) must never invent one.
      clarification = buildClarification(["investor_profile"], language);
    } else if (intent === "strategy_question" && resolvedStrategyIds.length === 0) {
      clarification = buildClarification(["strategy_selection"], language);
    } else if (
      intent === "strategy_question" &&
      strategyFitRequested &&
      !state.investorProfileContext &&
      !turnHasProfileContent
    ) {
      // A strategy-fit question needs the same genuine profile;
      // without one the engine clarifies instead of inventing it.
      clarification = buildClarification(["investor_profile"], language);
    }

    state.turnCount += 1;

    if (clarification) {
      return {
        status: "needs_clarification",
        intent: intent ?? "general",
        language,
        currentAsset: explicitAsset,
        comparisonSet: resolvedComparisonSet,
        strategyIds: resolvedStrategyIds,
        strategyFitRequested,
        financialParameters: { ...state.financialParameters },
        scenario: null,
        investorProfileContext: state.investorProfileContext
          ? { ...state.investorProfileContext }
          : null,
        establishesInvestorProfile,
        overrides,
        inheritedFromContext,
        clarification,
      };
    }

    // -------------------------------------------------
    // Financial parameter resolution with precedence:
    // explicit current-turn value > conversation context >
    // engine safe defaults. Nothing is silently altered:
    // every carried value is reported in inheritedFromContext.
    // -------------------------------------------------
    let scenario: MergedScenario | null = null;
    // Standalone scenarios start clean. Only a real follow-up may carry prior
    // financial values, so onboarding/profile defaults cannot leak into a new
    // explicit calculation.
    const mergedFinancial: FinancialParameters = isFollowUp
      ? { ...state.financialParameters }
      : { ...EMPTY_FINANCIAL };

    if (intent === "financial_projection") {
      scenario = analyzeFinancialScenario(text);

      if (explicit.monthlyContribution !== null) {
        scenario.monthlyContribution = explicit.monthlyContribution;
        overrides.push("monthlyContribution");
        mergedFinancial.monthlyContribution = explicit.monthlyContribution;
      } else if (isFollowUp && state.financialParameters.monthlyContribution !== null) {
        scenario.monthlyContribution = state.financialParameters.monthlyContribution;
        inheritedFromContext.push("monthlyContribution");
      }

      if (explicit.years !== null) {
        scenario.years = explicit.years;
        overrides.push("years");
        mergedFinancial.years = explicit.years;
      } else if (isFollowUp && state.financialParameters.years !== null) {
        scenario.years = state.financialParameters.years;
        inheritedFromContext.push("years");
      }

      if (explicit.annualReturnPct !== null) {
        scenario.annualReturnPct = explicit.annualReturnPct;
        overrides.push("annualReturnPct");
        mergedFinancial.annualReturnPct = explicit.annualReturnPct;
      } else if (isFollowUp && state.financialParameters.annualReturnPct !== null) {
        scenario.annualReturnPct = state.financialParameters.annualReturnPct;
        inheritedFromContext.push("annualReturnPct");
      }

      if (explicit.initialInvestment !== null) {
        scenario.initialInvestment = explicit.initialInvestment;
        scenario.initialInvestmentSpecified = true;
        overrides.push("initialInvestment");
        mergedFinancial.initialInvestment = explicit.initialInvestment;
      } else if (isFollowUp && state.financialParameters.initialInvestment !== null) {
        scenario.initialInvestment = state.financialParameters.initialInvestment;
        scenario.initialInvestmentSpecified = true;
        inheritedFromContext.push("initialInvestment");
      }

      if (explicit.currency !== null) {
        scenario.currency = explicit.currency;
        overrides.push("currency");
        mergedFinancial.currency = explicit.currency;
      } else if (isFollowUp && state.financialParameters.currency !== null) {
        scenario.currency = state.financialParameters.currency;
        mergedFinancial.currency = state.financialParameters.currency;
        inheritedFromContext.push("currency");
      } else {
        // Only a standalone turn with no explicit/contextual currency reaches
        // this fallback. The caller may supply the UI selection; otherwise the
        // existing engine's safe default remains in force.
        scenario.currency = options.fallbackCurrency ?? scenario.currency;
        mergedFinancial.currency = scenario.currency;
      }
    }

    // -------------------------------------------------
    // Commit resolved turn to session context
    // -------------------------------------------------
    if (intent) state.currentIntent = intent;
    state.currentLanguage = language;

    if (explicitAsset) {
      state.currentAsset = explicitAsset;
      // A new explicit single-asset focus ends any previous
      // comparison context — stale context must never leak.
      if (intent !== "comparison" && explicitIntent !== null) {
        state.comparisonSet = [];
      }
    }

    if (intent === "comparison" && resolvedComparisonSet.length >= 2) {
      state.comparisonSet = resolvedComparisonSet;
    }

    // Phase 6: commit strategy context with the same precedence
    // rules as assets — explicit mentions replace, follow-ups carry.
    if (intent === "strategy_question" && strategyMentions.length > 0) {
      state.currentStrategy = strategyMentions[0];
      if (strategyMentions.length >= 2) {
        state.strategyComparisonSet = [...strategyMentions];
      } else if (explicitIntent !== null) {
        // A new explicit single-strategy focus ends any previous
        // strategy comparison context — stale context must not leak.
        state.strategyComparisonSet = [];
      }
    }

    if (intent === "financial_projection") {
      state.financialParameters = mergedFinancial;
    }

    state.lastRelevantTurn = turnIndex;

    return {
      status: "resolved",
      intent: intent ?? "general",
      language,
      currentAsset,
      comparisonSet: resolvedComparisonSet,
      strategyIds: resolvedStrategyIds,
      strategyFitRequested,
      financialParameters:
        intent === "financial_projection"
          ? { ...mergedFinancial }
          : { ...state.financialParameters },
      scenario,
      investorProfileContext: state.investorProfileContext
        ? { ...state.investorProfileContext }
        : null,
      establishesInvestorProfile,
      overrides,
      inheritedFromContext,
      clarification: null,
    };
  }

  return {
    processTurn,
    getContext: snapshot,
    setInvestorProfile(profile) {
      state.investorProfileContext = profile ? { ...profile } : null;
    },
    reset() {
      const profile = state.investorProfileContext;
      state = freshState(profile ? { ...profile } : null);
    },
  };
}
