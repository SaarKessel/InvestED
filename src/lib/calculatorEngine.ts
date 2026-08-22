// ---------------------------------------------------------------------------
// InvestED — Smart Financial Scenario Engine v12
// Educational Financial Simulation Engine
// ---------------------------------------------------------------------------

import type {
  FinancialScenario
} from "@/types";

import { analyzeFinancialGoal } from "./goalEngine";

export type {
  FinancialScenario
} from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_WITHDRAWAL_RATE_PCT = 4;
export const DEFAULT_INFLATION_PCT = 2.5;

// ---------------------------------------------------------------------------
// Asset Classes
// ---------------------------------------------------------------------------

export interface AssetClassOption {
  key: string;
  label: string;
  expectedReturnPct: number;
  annualReturnPct: number;
  keywords: string[];
  description: string;
}

export const ASSET_CLASSES: AssetClassOption[] = [
  {
    key: "sp500",
    label: "מדד S&P 500",
    expectedReturnPct: 10,
    annualReturnPct: 10,
    keywords: [
      "s&p",
      "sp500",
      "s&p500",
      "s and p",
      "סנופי",
      "אס אנד פי"
    ],
    description: "מדד רחב הכולל חברות גדולות בארה״ב."
  },
  {
    key: "world",
    label: "מדד עולמי",
    expectedReturnPct: 8,
    annualReturnPct: 8,
    keywords: [
      "world",
      "msci",
      "עולמי",
      "גלובלי"
    ],
    description: "פיזור בין שווקים בינלאומיים."
  },
  {
    key: "nasdaq",
    label: "Nasdaq",
    expectedReturnPct: 11,
    annualReturnPct: 11,
    keywords: [
      "nasdaq",
      "נאסדק",
      "נאסד״ק",
      "נאסדק 100",
      "נאסד״ק 100"
    ],
    description: "חשיפה גבוהה לחברות טכנולוגיה."
  },
  {
    key: "bonds",
    label: "אג״ח",
    expectedReturnPct: 3,
    annualReturnPct: 3,
    keywords: [
      "אגח",
      "אג״ח",
      "bonds",
      "bond",
      "סולידי",
      "יציבות",
      "בטוח"
    ],
    description: "אפיק בעל תנודתיות נמוכה יחסית."
  },
  {
    key: "balanced",
    label: "תיק מאוזן",
    expectedReturnPct: 7,
    annualReturnPct: 7,
    keywords: [
      "מאוזן",
      "פיזור",
      "תיק",
      "השקעה כללית"
    ],
    description: "שילוב בין מספר סוגי נכסים."
  }
];

// ---------------------------------------------------------------------------
// Parsed Query
// ---------------------------------------------------------------------------

export type TargetAmountSource =
  | "explicit"
  | "retirement_income"
  | "none";

export interface ParsedQuery {
  age: number | null;
  years: number;
  monthlyContribution: number;
  principal: number;
  targetAmount: number | null;
  targetMonthlyIncome: number | null;
  assetClassKey: string;
  targetAmountSource: TargetAmountSource;
}

// ---------------------------------------------------------------------------
// Text Helpers
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/₪/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Asset Detection
// ---------------------------------------------------------------------------

function detectAssetClass(text: string): string {
  const normalized = normalizeText(text);

  if (
    normalized.includes("s&p") ||
    normalized.includes("sp500") ||
    normalized.includes("s&p500") ||
    normalized.includes("s and p") ||
    normalized.includes("אס אנד פי") ||
    normalized.includes("סנופי")
  ) {
    return "sp500";
  }

  if (
    normalized.includes("nasdaq") ||
    normalized.includes("נאסדק") ||
    normalized.includes("נאסד״ק")
  ) {
    return "nasdaq";
  }

  if (
    normalized.includes("אגח") ||
    normalized.includes("אג״ח") ||
    normalized.includes("bonds") ||
    normalized.includes("bond")
  ) {
    return "bonds";
  }

  if (
    normalized.includes("world") ||
    normalized.includes("msci world") ||
    normalized.includes("עולמי") ||
    normalized.includes("גלובלי")
  ) {
    return "world";
  }

  return "balanced";
}

// ---------------------------------------------------------------------------
// Amount Parsing
// ---------------------------------------------------------------------------

function parseAmount(
  value: number,
  unit: string
): number {
  const normalized = unit
    .toLowerCase()
    .trim();

  if (
    normalized === "k" ||
    normalized === "אלף" ||
    normalized === "thousand"
  ) {
    return value * 1_000;
  }

  if (
    normalized === "m" ||
    normalized === "million" ||
    normalized === "מיליון" ||
    normalized === "מליון"
  ) {
    return value * 1_000_000;
  }

  return value;
}

function detectAmount(text: string): number {
  const normalized = normalizeText(text)
    .replace(/,/g, "");

  if (
    normalized.includes("חצי מיליון") ||
    normalized.includes("חצי מליון")
  ) {
    return 500_000;
  }

  if (
    normalized.includes("מיליון וחצי") ||
    normalized.includes("מליון וחצי")
  ) {
    return 1_500_000;
  }

  if (
    normalized.includes("שני מיליון") ||
    normalized.includes("שני מליון")
  ) {
    return 2_000_000;
  }

  if (
    normalized.includes("רבע מיליון") ||
    normalized.includes("רבע מליון")
  ) {
    return 250_000;
  }

  const englishMillion = normalized.match(
    /(\d+(?:\.\d+)?)\s*million\b/i
  );

  if (englishMillion) {
    return Math.round(
      Number(englishMillion[1]) * 1_000_000
    );
  }

  const patterns = [
    /(\d+(?:\.\d+)?)\s*(מיליון|מליון|million)/i,
    /(\d+(?:\.\d+)?)\s*(m)\b/i,
    /(\d+(?:\.\d+)?)\s*(k)\b/i,
    /(\d+(?:\.\d+)?)\s*(אלף)/i,
    /(\d+(?:\.\d+)?)\s*(thousand)/i,
    /(\d{1,3}(?:,\d{3})+)/,
    /(\d{5,})/
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match) {
      return Math.round(
        parseAmount(
          Number(match[1].replace(/,/g, "")),
          match[2] ?? ""
        )
      );
    }
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Initial Investment Detection
// ---------------------------------------------------------------------------

function detectInitialAmount(text: string): number {
  const normalized = normalizeText(text);

  const initialPatterns = [
    /(?:יש לי|יש ברשותי|ברשותי|קיים לי|מחזיק|השקעתי)\s*(?:היום|כיום|כרגע)?\s*(?:הון של|הון בסך|סכום של|סכום)?\s*(\d[\d,.]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון|thousand|million)?/i,

    /(?:initial investment|starting capital|initial capital)\s*(?:of|is)?\s*(\d[\d,.]*(?:\.\d+)?)\s*(k|m|thousand|million)?/i
  ];

  for (const pattern of initialPatterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    const value = Number(
      match[1].replace(/,/g, "")
    );

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      return Math.round(
        parseAmount(
          value,
          match[2] ?? ""
        )
      );
    }
  }

  const onlyMonthlyContext =
    normalized.includes("בחודש") ||
    normalized.includes("לחודש") ||
    normalized.includes("כל חודש") ||
    normalized.includes("מפקיד") ||
    normalized.includes("חוסך") ||
    normalized.includes("מפריש") ||
    normalized.includes("per month") ||
    normalized.includes("monthly");

  if (onlyMonthlyContext) {
    return 0;
  }

  if (
    normalized.includes("חצי מיליון") ||
    normalized.includes("חצי מליון") ||
    normalized.includes("מיליון וחצי") ||
    normalized.includes("מליון וחצי") ||
    normalized.includes("רבע מיליון") ||
    normalized.includes("רבע מליון")
  ) {
    return detectAmount(text);
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Monthly Contribution Detection
// ---------------------------------------------------------------------------

function detectMonthlyContribution(
  text: string
): number {
  const normalized = normalizeText(text);

  const contributionVerbPattern =
    /(?:מפקיד|מוסיף|מפריש|חוסך|invest|contribute|deposit|save)\s*(?:של\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון|thousand|million)?/i;

  const contributionVerbMatch =
    normalized.match(contributionVerbPattern);

  if (contributionVerbMatch) {
    const value = Number(
      contributionVerbMatch[1].replace(/,/g, "")
    );

    if (
      Number.isFinite(value) &&
      value > 0
    ) {
      return Math.round(
        parseAmount(
          value,
          contributionVerbMatch[2] ?? ""
        )
      );
    }
  }

  const patterns = [
    /(\d[\d,]*(?:\.\d+)?)\s*(?:שקל)?\s*(?:בחודש|לחודש|כל חודש)/i,

    /(\d+(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)\s*(?:שקל)?\s*(?:בחודש|לחודש|כל חודש)/i,

    /(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:per month|monthly|a month)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    const matchedText = match[0];

    const retirementIncomeContext =
      /הכנסה|בפרישה|לאחר הפרישה|retirement|retire/i
        .test(matchedText);

    if (retirementIncomeContext) {
      continue;
    }

    const value = Number(
      match[1].replace(/,/g, "")
    );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      continue;
    }

    return Math.round(
      parseAmount(
        value,
        match[2] ?? ""
      )
    );
  }

  return 0;
}

// ---------------------------------------------------------------------------
// Age Detection
// ---------------------------------------------------------------------------

function detectAge(
  text: string
): number | null {
  const match = text.match(
    /(?:אני\s*)?(?:בן|בת)\s*(\d+)/i
  );

  return match
    ? Number(match[1])
    : null;
}

// ---------------------------------------------------------------------------
// Target Age Detection
// ---------------------------------------------------------------------------

function detectTargetAge(
  text: string
): number | null {
  const normalized = normalizeText(text);

  const patterns = [
    /עד\s*גיל\s*(\d+)/i,
    /בגיל\s*(\d+)/i,
    /פורש\s*בגיל\s*(\d+)/i,
    /לפרוש\s*בגיל\s*(\d+)/i,
    /פרישה\s*בגיל\s*(\d+)/i,
    /retire\s*(?:at|by)\s*(\d+)/i,
    /retirement\s*(?:at|by)\s*(\d+)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Years Detection
// ---------------------------------------------------------------------------

function detectYears(
  text: string,
  age: number | null,
  targetAge: number | null
): number {
  const normalized = normalizeText(text);

  const futureMatch = normalized.match(
    /בעוד\s*(\d+)\s*(?:שנה|שנים)/i
  );

  if (futureMatch) {
    return Number(futureMatch[1]);
  }

  const explicitMatch = normalized.match(
    /(?:למשך|תקופה של|ל-?)\s*(\d+)\s*(?:שנה|שנים)/i
  );

  if (explicitMatch) {
    return Number(explicitMatch[1]);
  }

  const englishExplicitMatch = normalized.match(
    /(?:for|over|during|within|period of)\s*(?:a\s+)?(?:period\s+of\s*)?(\d+)\s*years?/i
  );

  if (englishExplicitMatch) {
    return Number(englishExplicitMatch[1]);
  }

  const englishSimpleMatch = normalized.match(
    /(\d+)\s*years?/i
  );

  if (englishSimpleMatch) {
    return Number(englishSimpleMatch[1]);
  }

  const simpleMatch = normalized.match(
    /(\d+)\s*(?:שנה|שנים)/i
  );

  if (simpleMatch) {
    return Number(simpleMatch[1]);
  }

  if (
    age !== null &&
    targetAge !== null
  ) {
    return Math.max(
      targetAge - age,
      1
    );
  }

  return 10;
}

// ---------------------------------------------------------------------------
// Target Monthly Income Detection
// ---------------------------------------------------------------------------

function detectTargetMonthlyIncome(
  text: string
): number | null {
  const normalized = normalizeText(text);

  const retirementContext =
    normalized.includes("פרישה") ||
    normalized.includes("לפרוש") ||
    normalized.includes("פורש") ||
    normalized.includes("חופש כלכלי") ||
    normalized.includes("עצמאות כלכלית") ||
    normalized.includes("retire") ||
    normalized.includes("retirement");

  if (!retirementContext) {
    return null;
  }

  const patterns = [
    /(?:הכנסה|הכנסה חודשית|להכנסה)\s*(?:של\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)?\s*(?:שקל)?\s*(?:בחודש|לחודש)/i,

    /(?:רוצה|לקבל)\s*(?:לקבל\s*)?(?:הכנסה\s*)?(?:של\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)?\s*(?:שקל)?\s*(?:בחודש|לחודש)/i,

    /(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)?\s*(?:שקל)?\s*(?:בחודש|לחודש)\s*(?:בפרישה|לאחר הפרישה)/i,

    /(?:בפרישה|לאחר הפרישה)\s*(?:עם\s*)?(?:הכנסה\s*)?(?:של\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)?\s*(?:שקל)?\s*(?:בחודש|לחודש)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    const value = Number(
      match[1].replace(/,/g, "")
    );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      continue;
    }

    return Math.round(
      parseAmount(
        value,
        match[2] ?? ""
      )
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Explicit Target Amount Detection
// ---------------------------------------------------------------------------

function detectExplicitTargetAmount(
  text: string
): number | null {
  const normalized = normalizeText(text);

  const patterns = [
    /(?:יעד|מטרה)\s*(?:של\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)?/i,

    /(?:להגיע|להגיע ל|להגיע ל־|להגיע ל-)\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)?/i,

    /(?:רוצה|צריך)\s*(?:להגיע\s*)?(?:ל\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)?\s*(?:שקל)?/i,

    /(?:target|goal)\s*(?:of\s*)?(\d[\d,]*(?:\.\d+)?)\s*(k|m|million)?/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    const value = Number(
      match[1].replace(/,/g, "")
    );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      continue;
    }

    return Math.round(
      parseAmount(
        value,
        match[2] ?? ""
      )
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Retirement Target
// ---------------------------------------------------------------------------

export function calculateBaseRetirementTargetAmount(
  targetMonthlyIncome: number,
  withdrawalRatePct: number =
    DEFAULT_WITHDRAWAL_RATE_PCT
): number | null {
  if (
    !Number.isFinite(targetMonthlyIncome) ||
    targetMonthlyIncome <= 0
  ) {
    return null;
  }

  if (
    !Number.isFinite(withdrawalRatePct) ||
    withdrawalRatePct <= 0
  ) {
    return null;
  }

  return Math.round(
    targetMonthlyIncome *
    12 /
    (withdrawalRatePct / 100)
  );
}

export function calculateRetirementTargetAmount(
  targetMonthlyIncome: number,
  years: number,
  withdrawalRatePct: number =
    DEFAULT_WITHDRAWAL_RATE_PCT,
  inflationPct: number =
    DEFAULT_INFLATION_PCT
): number | null {
  const baseTarget =
    calculateBaseRetirementTargetAmount(
      targetMonthlyIncome,
      withdrawalRatePct
    );

  if (baseTarget === null) {
    return null;
  }

  if (
    !Number.isFinite(years) ||
    years < 0
  ) {
    return baseTarget;
  }

  if (
    !Number.isFinite(inflationPct) ||
    inflationPct < 0
  ) {
    return baseTarget;
  }

  return Math.round(
    baseTarget *
    Math.pow(
      1 + inflationPct / 100,
      years
    )
  );
}

// ---------------------------------------------------------------------------
// Target Resolution
// ---------------------------------------------------------------------------

function resolveTargetAmount(
  text: string,
  targetMonthlyIncome: number | null,
  years: number
): {
  targetAmount: number | null;
  source: TargetAmountSource;
} {
  const explicitTarget =
    detectExplicitTargetAmount(text);

  if (
    explicitTarget !== null &&
    explicitTarget > 0
  ) {
    return {
      targetAmount: explicitTarget,
      source: "explicit"
    };
  }

  if (
    targetMonthlyIncome !== null &&
    targetMonthlyIncome > 0
  ) {
    return {
      targetAmount:
        calculateRetirementTargetAmount(
          targetMonthlyIncome,
          years
        ),
      source: "retirement_income"
    };
  }

  return {
    targetAmount: null,
    source: "none"
  };
}

// ---------------------------------------------------------------------------
// Goal Detection
// ---------------------------------------------------------------------------

function detectGoal(
  text: string
): string {
  const normalized = normalizeText(text);

  if (
    normalized.includes("פרישה") ||
    normalized.includes("לפרוש") ||
    normalized.includes("פורש") ||
    normalized.includes("חופש כלכלי") ||
    normalized.includes("עצמאות כלכלית") ||
    normalized.includes("retire") ||
    normalized.includes("retirement") ||
    normalized.includes("עד גיל")
  ) {
    return "retirement";
  }

  if (
    normalized.includes("דירה") ||
    normalized.includes("בית") ||
    normalized.includes("הון עצמי")
  ) {
    return "home";
  }

  if (
    normalized.includes("ילד") ||
    normalized.includes("ילדים") ||
    normalized.includes("לימודים")
  ) {
    return "child";
  }

  return "growth";
}

// ---------------------------------------------------------------------------
// Risk Profile
// ---------------------------------------------------------------------------

export type RiskProfile =
  | "low"
  | "medium"
  | "high";

// ---------------------------------------------------------------------------
// Centralized Horizon Analysis
// ---------------------------------------------------------------------------

export type HorizonProfile =
  | "short"
  | "medium"
  | "long";

export interface HorizonAnalysis {
  years: number;
  profile: HorizonProfile;
  label: string;
}

export function calculateHorizonAnalysis(
  years: number
): HorizonAnalysis {

  const safeYears =
    Number.isFinite(years)
      ? Math.max(0, years)
      : 0;

  if (safeYears < 5) {
    return {
      years: safeYears,
      profile: "short",
      label: "קצר טווח"
    };
  }

  if (safeYears < 15) {
    return {
      years: safeYears,
      profile: "medium",
      label: "טווח בינוני"
    };
  }

  return {
    years: safeYears,
    profile: "long",
    label: "טווח ארוך"
  };
}


function detectRiskProfile(
  assetClassKey: string,
  years: number
): RiskProfile {

  if (assetClassKey === "bonds") {
    return "low";
  }

  if (assetClassKey === "balanced") {
    return "medium";
  }

  if (
    assetClassKey === "sp500" ||
    assetClassKey === "nasdaq" ||
    assetClassKey === "world"
  ) {
    return years >= 15
      ? "high"
      : "medium";
  }

  return "medium";
}

function getRiskLabel(
  riskProfile: RiskProfile
): string {

  switch (riskProfile) {
    case "low":
      return "נמוכה";

    case "medium":
      return "בינונית";

    case "high":
      return "גבוהה";

    default:
      return "בינונית";
  }
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

function calculateConfidence(
  investment: number,
  monthly: number,
  age: number | null,
  years: number,
  asset: string,
  targetAmount: number | null,
  targetMonthlyIncome: number | null
): number {
  let score = 0;

  if (investment > 0) score += 20;
  if (monthly > 0) score += 20;
  if (age !== null) score += 15;
  if (years > 0) score += 20;
  if (asset) score += 15;

  if (
    targetAmount !== null ||
    targetMonthlyIncome !== null
  ) {
    score += 10;
  }

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Explicit Return Rate Detection
// ---------------------------------------------------------------------------
//
// If the user explicitly provides an annual return assumption,
// that value takes precedence over the asset-class default.
//
// Examples:
//   "בתשואה של 7%"        -> 7
//   "תשואה של 7%"         -> 7
//   "with 7% return"      -> 7
//   "at 7% annual return" -> 7
//
// If no explicit return is provided, return null so the caller
// can safely fall back to the selected asset's default.
// ---------------------------------------------------------------------------

function detectExplicitAnnualReturnPct(
  text: string
): number | null {
  const normalized = text
    .replace(/,/g, ".")
    .trim();

  const patterns = [
    /(?:תשואה|תשואה שנתית)\s*(?:של|שנתית של)?\s*(\d+(?:\.\d+)?)\s*%/i,
    /(?:ב|עם|לפי|על)\s*(?:תשואה|תשואה שנתית)\s*(?:של)?\s*(\d+(?:\.\d+)?)\s*%/i,
    /(?:annual\s+return|expected\s+return|return)\s*(?:of|at|is)?\s*(\d+(?:\.\d+)?)\s*%/i,
    /(\d+(?:\.\d+)?)\s*%\s*(?:תשואה|תשואה שנתית|return|annual return)/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    const value = Number(match[1]);

    if (
      Number.isFinite(value) &&
      value >= -100 &&
      value <= 100
    ) {
      return value;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Scenario Builder
// ---------------------------------------------------------------------------

export function analyzeFinancialScenario(
  text: string
): FinancialScenario & {
  targetAmountSource: TargetAmountSource;
  withdrawalRatePct: number | null;
} {
  const currentAge =
    detectAge(text);

  const targetAge =
    detectTargetAge(text);

  const years =
    detectYears(
      text,
      currentAge,
      targetAge
    );

  const assetKey =
    detectAssetClass(text);

  const asset =
    ASSET_CLASSES.find(
      item => item.key === assetKey
    ) ??
    ASSET_CLASSES.find(
      item => item.key === "balanced"
    )!;

  const initialInvestment =
    detectInitialAmount(text);

  const monthlyContribution =
    detectMonthlyContribution(text);

  const targetMonthlyIncome =
    detectTargetMonthlyIncome(text);

  const explicitAnnualReturnPct =
    detectExplicitAnnualReturnPct(text);

  const resolvedTarget =
    resolveTargetAmount(
      text,
      targetMonthlyIncome,
      years
    );

  const withdrawalRatePct =
    resolvedTarget.source === "retirement_income"
      ? DEFAULT_WITHDRAWAL_RATE_PCT
      : null;

  return {
    initialInvestment,

    monthlyContribution,

    currentAge,

    targetAge,

    targetAmount:
      resolvedTarget.targetAmount,

    targetMonthlyIncome,

    years,

    assetClassKey:
      asset.key,

    annualReturnPct:
      explicitAnnualReturnPct ??
      asset.expectedReturnPct,

    goal:
      detectGoal(text),

    riskProfile:
      detectRiskProfile(
        asset.key,
        years
      ),

    confidence:
      calculateConfidence(
        initialInvestment,
        monthlyContribution,
        currentAge,
        years,
        asset.key,
        resolvedTarget.targetAmount,
        targetMonthlyIncome
      ),

    detectedInterests: [],

    targetAmountSource:
      resolvedTarget.source,

    withdrawalRatePct
  };
}

// ---------------------------------------------------------------------------
// Projection Engine
// ---------------------------------------------------------------------------

export interface ProjectionPoint {
  year: number;
  contributed: number;
  balance: number;
}

export interface ProjectionResult {
  finalBalance: number;
  totalContributed: number;
  growth: number;
  realValueAfterInflation: number;
  series: ProjectionPoint[];
}

export function computeProjection(
  principal: number,
  monthlyContribution: number,
  years: number,
  annualReturnPct: number,
  inflationPct: number =
    DEFAULT_INFLATION_PCT
): ProjectionResult {
  const safePrincipal =
    Math.max(
      0,
      Number.isFinite(principal)
        ? principal
        : 0
    );

  const safeMonthlyContribution =
    Math.max(
      0,
      Number.isFinite(monthlyContribution)
        ? monthlyContribution
        : 0
    );

  const safeYears =
    Math.max(
      0,
      Number.isFinite(years)
        ? years
        : 0
    );

  const safeAnnualReturn =
    Number.isFinite(annualReturnPct)
      ? annualReturnPct
      : 0;

  const monthlyRate =
    safeAnnualReturn / 100 / 12;

  const months =
    Math.max(
      0,
      Math.round(safeYears * 12)
    );

  let balance = safePrincipal;
  let contributed = safePrincipal;

  const series: ProjectionPoint[] = [
    {
      year: 0,
      contributed:
        Math.round(contributed),
      balance:
        Math.round(balance)
    }
  ];

  for (
    let month = 1;
    month <= months;
    month++
  ) {
    balance =
      balance *
      (1 + monthlyRate) +
      safeMonthlyContribution;

    contributed +=
      safeMonthlyContribution;

    if (
      month % 12 === 0 ||
      month === months
    ) {
      series.push({
        year:
          Number(
            (month / 12).toFixed(2)
          ),

        contributed:
          Math.round(contributed),

        balance:
          Math.round(balance)
      });
    }
  }

  const inflationFactor =
    Math.pow(
      1 + inflationPct / 100,
      safeYears
    );

  return {
    finalBalance:
      Math.round(balance),

    totalContributed:
      Math.round(contributed),

    growth:
      Math.round(
        balance - contributed
      ),

    realValueAfterInflation:
      Math.round(
        inflationFactor > 0
          ? balance / inflationFactor
          : balance
      ),

    series
  };
}

// ---------------------------------------------------------------------------
// Goal Planner
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Required Monthly Contribution
//
// IMPORTANT:
// This formula uses the SAME monthly compounding convention
// as computeProjection().
//
// FV = P(1+r)^n + PMT[((1+r)^n - 1) / r]
//
// Therefore the monthly contribution calculated here can be
// plugged directly into computeProjection() and should reach
// approximately the requested target.
// ---------------------------------------------------------------------------

export function calculateRequiredMonthlyContribution(
  targetAmount: number,
  initialInvestment: number,
  years: number,
  annualReturnPct: number
): number {
  if (
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0
  ) {
    return 0;
  }

  if (
    !Number.isFinite(initialInvestment) ||
    initialInvestment < 0
  ) {
    return 0;
  }

  if (
    !Number.isFinite(years) ||
    years <= 0
  ) {
    return 0;
  }

  if (
    !Number.isFinite(annualReturnPct)
  ) {
    return 0;
  }

  const months =
    Math.round(years * 12);

  if (months <= 0) {
    return 0;
  }

  const monthlyRate =
    annualReturnPct / 100 / 12;

  const futureInitial =
    initialInvestment *
    Math.pow(
      1 + monthlyRate,
      months
    );

  const remaining =
    targetAmount -
    futureInitial;

  if (remaining <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return Math.round(
      remaining / months
    );
  }

  const annuityFactor =
    (
      Math.pow(
        1 + monthlyRate,
        months
      ) - 1
    ) / monthlyRate;

  if (
    !Number.isFinite(annuityFactor) ||
    annuityFactor <= 0
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      remaining / annuityFactor
    )
  );
}

// ---------------------------------------------------------------------------
// Goal Planner Analysis
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// Unified Financial Analysis
//
// This is the recommended single entry point for CalculatorPage.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Explainable AI Result
//
// IMPORTANT:
// This object is derived from the financial analysis.
// UI components must display this result rather than
// recalculating risk, horizon or confidence themselves.
// ---------------------------------------------------------------------------

export interface AIExplanationResult {

  assetClassKey: string;

  assetLabel: string;

  annualReturnPct: number;

  horizon: HorizonAnalysis;

  riskProfile: RiskProfile;

  riskLabel: string;

  confidence: number;

  goal: string;

  explanation: string;
}

export function buildAIExplanationResult(
  scenario: FinancialScenario & {
    targetAmountSource: TargetAmountSource;
    withdrawalRatePct: number | null;
  }
): AIExplanationResult {

  const asset =
    ASSET_CLASSES.find(
      item => item.key === scenario.assetClassKey
    ) ??
    ASSET_CLASSES.find(
      item => item.key === "balanced"
    )!;

  const horizon =
    calculateHorizonAnalysis(
      scenario.years
    );

  const normalizedRiskProfile: RiskProfile =
    scenario.riskProfile === "low" ||
    scenario.riskProfile === "medium" ||
    scenario.riskProfile === "high"
      ? scenario.riskProfile
      : "medium";

  const explanation =
    `המערכת ניתחה את התרחיש לפי אופק השקעה של ` +
    `${scenario.years} שנים, חשיפה ל-${asset.label} ` +
    `ומטרת ${scenario.goal}.`;

  return {
    assetClassKey:
      scenario.assetClassKey,

    assetLabel:
      asset.label,

    annualReturnPct:
      scenario.annualReturnPct,

    horizon,

    riskProfile: normalizedRiskProfile,
riskLabel:
      getRiskLabel(normalizedRiskProfile),

    confidence:
      scenario.confidence,

    goal:
      scenario.goal,

    explanation
  };
}

export interface UnifiedFinancialAnalysis {
  scenario:
    FinancialScenario & {
      targetAmountSource: TargetAmountSource;
      withdrawalRatePct: number | null;
    };

  projection: ProjectionResult;

  aiExplanation: AIExplanationResult;

  goalPlan?: ReturnType<typeof analyzeFinancialGoal>;
}

export function analyzeFinancialScenarioWithProjection(
  text: string
): UnifiedFinancialAnalysis {
  const scenario =
    analyzeFinancialScenario(text);

  const projection =
    computeProjection(
      scenario.initialInvestment,
      scenario.monthlyContribution,
      scenario.years,
      scenario.annualReturnPct,
      DEFAULT_INFLATION_PCT
    );
const aiExplanation =
    buildAIExplanationResult(
      scenario
    );

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

  return {
    scenario,
    projection,
    aiExplanation,
    goalPlan
  };
}

// ---------------------------------------------------------------------------
// Parser API
// ---------------------------------------------------------------------------

export function parseCalculatorQuery(
  rawText: string
): ParsedQuery {
  const scenario =
    analyzeFinancialScenario(rawText);

  return {
    age:
      scenario.currentAge,

    years:
      scenario.years,

    monthlyContribution:
      scenario.monthlyContribution,

    principal:
      scenario.initialInvestment,

    targetAmount:
      scenario.targetAmount,

    assetClassKey:
      scenario.assetClassKey,

    targetMonthlyIncome:
      scenario.targetMonthlyIncome,

    targetAmountSource:
      scenario.targetAmountSource
  };
}

// ---------------------------------------------------------------------------
// Calculator Presets
// ---------------------------------------------------------------------------

export const CALCULATOR_PRESETS = [
  "אני בן 27, יש לי 100 אלף שקל להשקיע ל-10 שנים במדד S&P 500",

  "אני בן 30, מפקיד 2000 שקל בחודש במדד עולמי עד גיל 60",

  "יש לי חצי מיליון ואני רוצה לפרוש בעוד 20 שנה",

  "אני בן 35 ורוצה לבנות הון לטווח ארוך",

  "אני חוסך לילד 1000 שקל בחודש עד גיל 18",

  "יש לי 300 אלף להשקיע ל-15 שנה ואני מוסיף 2000 שקל בחודש במדד S&P 500",

  "אני בן 27, יש לי 15 אלף שקל, אני מפקיד 10 אלף שקל בחודש, רוצה לפרוש בגיל 40 עם הכנסה של 10 אלף שקל בחודש, ומשקיע במדד S&P 500"
];

// ---------------------------------------------------------------------------
// Debug Helper
// ---------------------------------------------------------------------------

export function debugScenario(
  text: string
) {
  const analysis =
    analyzeFinancialScenarioWithProjection(text);

  return {
    text,
    scenario: analysis.scenario,
    projection: analysis.projection,};
}
