import type {
  ProfileFlags,
  RiskDescription,
  InvestorClassification,
  InterestArea,
  HorizonBucket,
} from "@/types";

// ---------------------------------------------------------------------------
// InvestED — Rule-Based Risk Engine
// המספרים (ציון סיכון, אופק, סיווג) מחושבים בכללים שקופים וניתנים
// להסבר. שכבת ה-AI (ollamaClient) רק מנסחת אותם בשפה חמה יותר.
// ---------------------------------------------------------------------------

const RISK_KEYWORDS: Record<string, string[]> = {
  very_low: ["שמרן מאוד", "סיכון נמוך מאוד", "שימור הון", "לא רוצה להפסיד", "הכי בטוח", "very conservative"],
  low: ["שמרן", "סיכון נמוך", "בטוח", "זהיר", "שונא סיכון", "יציב", "conservative", "low risk"],
  moderate: ["סיכון בינוני", "מאוזן", "סיכון מתון", "moderate risk", "balanced"],
  high: ["סיכון גבוה", "אגרסיבי", "ממוקד צמיחה", "נוח עם תנודתיות", "סיבולת סיכון גבוהה", "high risk"],
  very_high: ["אגרסיבי מאוד", "סיכון גבוה מאוד", "ספקולטיבי", "very aggressive", "very high risk"],
};

const HORIZON_KEYWORDS: Record<string, string[]> = {
  short: ["טווח קצר", "שנה אחת", "שנתיים", "אופק קצר", "צריך את הכסף בקרוב", "short term"],
  medium: ["טווח בינוני", "5 שנים", "אופק בינוני", "medium term"],
  long: ["טווח ארוך", "20 שנה", "30 שנה", "פרישה", "עשורים", "אופק ארוך", "long term", "retirement"],
};

const KNOWLEDGE_KEYWORDS: Record<string, string[]> = {
  beginner: ["אין לי ידע", "אין לי הרבה ידע", "מתחיל", "לא יודע כלום", "חדש בתחום"],
  some: ["קצת ידע", "יודע בסיס", "מכיר קצת"],
  experienced: ["מנוסה", "יודע הרבה", "בעל ידע", "משקיע ותיק", "עם ניסיון", "משקיע מנוסה"],
};

const INTEREST_KEYWORDS: Record<InterestArea, string[]> = {
  "טכנולוגיה": ["טכנולוגיה", "טק", "הייטק", "technology", "tech"],
  "פיננסים": ["פיננסים", "בנקאות", "finance", "financial"],
  "בריאות": ["בריאות", "רפואה", "ביוטק", "healthcare", "biotech"],
  "אנרגיה": ["אנרגיה", "אנרגיה מתחדשת", "energy"],
  "נדל\"ן": ["נדל\"ן", "נדלן", "real estate", "reit"],
};

const PREFERENCE_KEYWORDS: Record<string, string[]> = {
  dividend: ["דיבידנד", "הכנסה פסיבית"],
  growth: ["צמיחה", "עליית ערך"],
  value: ["השקעת ערך", "מניות ערך"],
  index: ["מדד", "פסיבית", "index"],
  etf_only: ["קרנות סל", "תעודות סל", "etf"],
  low_fees: ["דמי ניהול נמוכים", "עלות נמוכה"],
  no_crypto: ["בלי קריפטו", "לא רוצה קריפטו", "ללא קריפטו"],
  crypto: ["קריפטו", "ביטקוין"],
  bonds: ["אג\"ח", "אגרות חוב"],
};

const YEAR_HORIZON_PATTERN = /(\d{1,2})\s*שנ/;

function containsAny(text: string, phrases: string[]): boolean {
  return phrases.some((p) => text.includes(p));
}

export function extractProfileFlags(rawText: string): ProfileFlags {
  const text = rawText.toLowerCase().trim();

  let riskLevel: ProfileFlags["riskLevel"] = null;
  for (const level of ["very_low", "very_high", "low", "high", "moderate"] as const) {
    if (containsAny(text, RISK_KEYWORDS[level])) {
      riskLevel = level;
      break;
    }
  }

  let horizon: ProfileFlags["horizon"] = null;
  for (const h of ["short", "medium", "long"] as const) {
    if (containsAny(text, HORIZON_KEYWORDS[h])) {
      horizon = h;
      break;
    }
  }

  const yearMatch = text.match(YEAR_HORIZON_PATTERN);
  if (yearMatch && !text.includes("בן ") && !text.includes("בת ")) {
    const years = parseInt(yearMatch[1], 10);
    if (years <= 3) horizon = "short";
    else if (years <= 10) horizon = "medium";
    else horizon = "long";
  }

  let knowledgeLevel: ProfileFlags["knowledgeLevel"] = null;
  for (const k of ["beginner", "some", "experienced"] as const) {
    if (containsAny(text, KNOWLEDGE_KEYWORDS[k])) {
      knowledgeLevel = k;
      break;
    }
  }

  const interests: InterestArea[] = [];
  (Object.keys(INTEREST_KEYWORDS) as InterestArea[]).forEach((area) => {
    if (containsAny(text, INTEREST_KEYWORDS[area])) interests.push(area);
  });

  const preferences: string[] = [];
  Object.entries(PREFERENCE_KEYWORDS).forEach(([pref, phrases]) => {
    if (containsAny(text, phrases)) preferences.push(pref);
  });
  if (preferences.includes("no_crypto") && preferences.includes("crypto")) {
    preferences.splice(preferences.indexOf("crypto"), 1);
  }

  const ageMatch = text.match(/בן\s*(\d{1,2})|בת\s*(\d{1,2})/);
  const age = ageMatch ? parseInt(ageMatch[1] ?? ageMatch[2], 10) : null;

  return {
    rawText,
    age,
    riskLevel,
    horizon,
    knowledgeLevel,
    interests,
    preferences,
  };
}

const RISK_BASE_SCORE: Record<string, number> = {
  very_low: 1.5,
  low: 3,
  moderate: 5.5,
  high: 8,
  very_high: 9.5,
};

const HORIZON_ADJUSTMENT: Record<string, number> = {
  short: -1,
  medium: 0,
  long: 1,
};

export function computeRiskScore(flags: ProfileFlags): number {
  const base = flags.riskLevel ? RISK_BASE_SCORE[flags.riskLevel] : 5;
  const horizonAdj = flags.horizon ? HORIZON_ADJUSTMENT[flags.horizon] : 0;

  let prefAdj = 0;
  if (flags.preferences.includes("growth")) prefAdj += 0.5;
  if (flags.preferences.includes("crypto")) prefAdj += 1;
  if (flags.preferences.includes("no_crypto")) prefAdj -= 0.2;
  if (flags.preferences.includes("dividend") || flags.preferences.includes("bonds")) prefAdj -= 0.5;
  if (flags.preferences.includes("index") || flags.preferences.includes("etf_only")) prefAdj -= 0.2;

  // אופק צעיר יחסית (למשל בני 20-30) לרוב מאפשר קצת יותר סיכון חינוכית
  let ageAdj = 0;
  if (flags.age !== null) {
    if (flags.age < 30) ageAdj = 0.5;
    else if (flags.age > 55) ageAdj = -0.5;
  }

  const score = base + horizonAdj + prefAdj + ageAdj;
  return Math.max(1, Math.min(10, Math.round(score)));
}

export function riskScoreDescription(score: number): RiskDescription {
  if (score <= 2) {
    return {
      band: "שמרני מאוד",
      volatility: "תנודתיות נמוכה — נועד למזער תנודות חדות בשווי התיק.",
      psychology: "מתאים למי שמרגיש חוסר נוחות כשרואה את יתרת החשבון יורדת.",
    };
  }
  if (score <= 4) {
    return {
      band: "שמרני",
      volatility: "תנודתיות מתחת לממוצע, עם ירידות מתונות מדי פעם.",
      psychology: "התאמה טובה אם יציבות בטווח הקצר חשובה לך יותר ממקסום צמיחה.",
    };
  }
  if (score <= 6) {
    return {
      band: "מאוזן",
      volatility: "תנודתיות ממוצעת — ירידות ניכרות אפשריות, אך היסטורית מתאוששות עם הזמן.",
      psychology: "מתאים למי שיכול לספוג אי-נוחות מסוימת בתמורה לצמיחה לטווח ארוך.",
    };
  }
  if (score <= 8) {
    return {
      band: "מוטה צמיחה",
      volatility: "תנודתיות מעל הממוצע — ירידות של 15%-30% אפשריות בשנים גרועות.",
      psychology: "מתאים בעיקר למי שיש לו אופק ארוך ולא ימכור בפאניקה בירידות.",
    };
  }
  return {
    band: "אגרסיבי",
    volatility: "תנודתיות גבוהה — ירידות של 30%+ בשווקים קשים הן אפשריות.",
    psychology: "מתאים רק למי שיש לו אופק ארוך, יציבות כלכלית ומשמעת רגשית גבוהה.",
  };
}

export function horizonBucket(flags: ProfileFlags): HorizonBucket {
  if (flags.horizon === "short") return "קצר";
  if (flags.horizon === "long") return "ארוך";
  return "בינוני";
}

export function horizonExplanation(bucket: HorizonBucket): string {
  if (bucket === "קצר") {
    return "באופק קצר יש פחות זמן להתאושש מירידה בשוק, ולכן תיקים בקבוצה הזו נוטים להטות למזומן ואג\"ח סולידי.";
  }
  if (bucket === "ארוך") {
    return "אופק ארוך נותן לתיק זמן לספוג תנודתיות וליהנות מריבית דריבית, ולכן ניתן להרשות לעצמו חשיפה גדולה יותר למניות.";
  }
  return "אופק בינוני דורש איזון בין חשיפה לצמיחה לבין יציבות, כדי להימנע מירידות גדולות סמוך למועד שבו יידרש הכסף.";
}

export function classifyInvestor(
  flags: ProfileFlags,
  riskScore: number
): InvestorClassification {
  const prefs = new Set(flags.preferences);

  if (prefs.has("dividend") && riskScore <= 6) {
    return {
      type: "משקיע דיבידנדים",
      reason:
        "זיהינו התעניינות בדיבידנדים/הכנסה פסיבית, מה שמצביע על נטייה לקרנות ומניות מניבות הכנסה שוטפת ולא רק על עליית ערך.",
    };
  }
  if (prefs.has("value")) {
    return {
      type: "משקיע ערך",
      reason: "ציינת סגנון השקעת ערך — התמקדות בנכסים שנראים זולים ביחס לפונדמנטלס שלהם.",
    };
  }
  if ((prefs.has("index") || prefs.has("etf_only")) && riskScore <= 6 && flags.horizon !== "short") {
    return {
      type: "משקיע פסיבי",
      reason:
        "זיהינו שאתה מעוניין בגישה פסיבית/מבוססת מדדים — לרוב כי אתה מעדיף אופק ארוך ולא רוצה לעקוב אחרי השוק מדי יום.",
    };
  }
  if (riskScore <= 3) {
    return {
      type: "משקיע שמרני",
      reason: "ציון הסיכון הנמוך שלך מצביע על כך ששימור ההון ויציבות חשובים לך יותר ממקסום התשואה.",
    };
  }
  if (riskScore >= 7 && (prefs.has("growth") || flags.horizon === "long")) {
    return {
      type: "משקיע צמיחה",
      reason:
        "סיבולת הסיכון הגבוהה שלך והאופק הארוך מצביעים על כך שאתה יכול לתת עדיפות לנכסי צמיחה, שתנודתיים יותר אך היסטורית צומחים יותר לאורך זמן.",
    };
  }
  return {
    type: "משקיע מאוזן",
    reason: "הפרופיל שלך נמצא באמצע ספקטרום הסיכון, ומאזן בין צמיחה ליציבות מבלי להטות חזק לכיוון אחד.",
  };
}

export function buildExplainability(
  flags: ProfileFlags,
  riskScore: number,
  investor: InvestorClassification
): { signals: string[]; summary: string } {
  const signals: string[] = [];

  if (flags.age !== null) signals.push(`גיל שצוין: ${flags.age}`);
  if (flags.horizon) {
    const map: Record<string, string> = { short: "קצר", medium: "בינוני", long: "ארוך" };
    signals.push(`אופק השקעה שזוהה: ${map[flags.horizon]}`);
  }
  if (flags.riskLevel) {
    const map: Record<string, string> = {
      very_low: "נמוך מאוד",
      low: "נמוך",
      moderate: "בינוני",
      high: "גבוה",
      very_high: "גבוה מאוד",
    };
    signals.push(`רמת סיכון שהוזכרה: ${map[flags.riskLevel]}`);
  }
  if (flags.knowledgeLevel === "beginner") signals.push("ציינת שאין לך הרבה ידע פיננסי מוקדם");
  if (flags.interests.length) signals.push(`תחומי עניין שזוהו: ${flags.interests.join(", ")}`);
  if (flags.preferences.length) signals.push(`העדפות שזוהו: ${flags.preferences.join(", ")}`);
  signals.push(`ציון הסיכון המחושב: ${riskScore}/10`);

  const summary = `זיהינו שאתה מתאים ל"${investor.type}" בעיקר בגלל ${
    flags.horizon === "long"
      ? "האופק הארוך שציינת ו"
      : flags.horizon === "short"
        ? "האופק הקצר שציינת ו"
        : ""
  }${investor.reason}`;

  return { signals, summary };
}
