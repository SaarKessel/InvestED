// ---------------------------------------------------------------------------
// InvestED — Conversational Calculator Engine
//
// מנוע כללים (לא LLM) שמפרש שאילתה חופשית בעברית לנתונים מספריים:
// סכום התחלתי, הפקדה חודשית, אופק שנים, וסוג נכס. הפרשנות תמיד מוצגת
// למשתמש בשדות הניתנים לעריכה לפני החישוב, כי פענוח טקסט חופשי לעולם
// אינו מושלם — זו רשת הביטחון שמבטיחה תוצאה נכונה גם אם הניחוש טעה.
// ---------------------------------------------------------------------------

export interface AssetClassOption {
  key: string;
  label: string;
  annualReturnPct: number;
  keywords: string[];
  blurb: string;
}

export const ASSET_CLASSES: AssetClassOption[] = [
  {
    key: "nasdaq",
    label: "מדד נאסד\"ק / מניות טכנולוגיה",
    annualReturnPct: 12,
    keywords: ["נאסד\"ק", "נאסדק", "nasdaq", "מניות טכנולוגיה", "הייטק"],
    blurb: "מדד המרוכז בחברות טכנולוגיה גדולות. היסטורית תנודתי יותר, עם פוטנציאל תשואה גבוה יותר לטווח ארוך.",
  },
  {
    key: "sp500",
    label: "מדד S&P 500",
    annualReturnPct: 10,
    keywords: ["s&p 500", "sp500", "מדד 500", "אס אנד פי", "500 האמריקאי"],
    blurb: "מדד המורכב מ-500 החברות הגדולות בארה\"ב. נחשב לאמת מידה (benchmark) מרכזית להשקעה פסיבית עולמית.",
  },
  {
    key: "ta125",
    label: "מדד ת\"א 125",
    annualReturnPct: 7,
    keywords: ["ת\"א 125", "תא125", "מדד ישראלי", "תל אביב 125", "הבורסה בתל אביב"],
    blurb: "מדד המניות המוביל בבורסה לניירות ערך בתל אביב, המורכב מ-125 החברות הגדולות בישראל.",
  },
  {
    key: "bonds",
    label: "אג\"ח ממשלתי (סולידי)",
    annualReturnPct: 3.5,
    keywords: ["אג\"ח ממשלתי", "אגרות חוב", "אג\"ח", "סולידי"],
    blurb: "הלוואה לממשלה בתמורה לריבית קבועה יחסית. תנודתיות נמוכה משמעותית ביחס למניות, אך גם תשואה פוטנציאלית נמוכה יותר.",
  },
  {
    key: "balanced",
    label: "תיק מאוזן (מניות + אג\"ח)",
    annualReturnPct: 7,
    keywords: ["תיק מאוזן", "מאוזן"],
    blurb: "שילוב של מניות ואג\"ח, שמטרתו לאזן בין פוטנציאל צמיחה ליציבות. שימש כברירת המחדל כאן כי לא זוהה נכס ספציפי.",
  },
];

export interface ParsedQuery {
  age: number | null;
  years: number;
  monthlyContribution: number;
  principal: number;
  assetClassKey: string;
}

function parseAmount(numStr: string, unit?: string): number {
  let val = parseFloat(numStr.replace(/,/g, ""));
  if (unit === "אלף") val *= 1_000;
  if (unit === "מיליון") val *= 1_000_000;
  return val;
}

function detectAssetClass(text: string): string {
  for (const asset of ASSET_CLASSES) {
    if (asset.key === "balanced") continue;
    if (asset.keywords.some((k) => text.includes(k))) return asset.key;
  }
  return "balanced";
}

export function parseCalculatorQuery(rawText: string): ParsedQuery {
  const text = rawText.trim();

  const ageMatch = text.match(/(?:בן|בת)\s*(\d{1,3})/);
  const age = ageMatch ? parseInt(ageMatch[1], 10) : null;

  const yearsMatch = text.match(/(\d{1,3})\s*שנ/);
  const years = yearsMatch ? Math.min(60, parseInt(yearsMatch[1], 10)) : 10;

  let monthlyContribution = 0;
  const monthlyMatch =
    text.match(/([\d,]+(?:\.\d+)?)\s*(אלף|מיליון)?\s*(?:ש"ח|שקל(?:ים)?|₪)?\s*(?:בחודש|לחודש|כל חודש|מדי חודש)/) ||
    text.match(/(?:חיסכון חודשי(?: של)?|מפקיד(?: כל חודש)?|בחודש|לחודש|כל חודש|מדי חודש)\D{0,6}([\d,]+(?:\.\d+)?)\s*(אלף|מיליון)?/);
  if (monthlyMatch) monthlyContribution = parseAmount(monthlyMatch[1], monthlyMatch[2]);

  let principal = 0;
  const currencyMatches = [
    ...text.matchAll(/([\d]{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(אלף|מיליון)?\s*(?:ש"ח|שקל(?:ים)?|₪)/g),
  ];
  for (const m of currencyMatches) {
    const val = parseAmount(m[1], m[2]);
    if (monthlyContribution > 0 && val === monthlyContribution) continue;
    if (val > principal) principal = val;
  }

  const assetClassKey = detectAssetClass(text);

  return { age, years, monthlyContribution, principal, assetClassKey };
}

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
  inflationPct = 3
): ProjectionResult {
  const monthlyRate = annualReturnPct / 100 / 12;
  const months = Math.max(1, Math.round(years * 12));

  let balance = principal;
  let totalContributed = principal;
  const series: ProjectionPoint[] = [{ year: 0, contributed: Math.round(totalContributed), balance: Math.round(balance) }];

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
    totalContributed += monthlyContribution;
    if (m % 12 === 0) {
      series.push({ year: m / 12, contributed: Math.round(totalContributed), balance: Math.round(balance) });
    }
  }

  const finalBalance = Math.round(balance);
  const totalContributedRounded = Math.round(totalContributed);
  const growth = finalBalance - totalContributedRounded;
  const realValueAfterInflation = Math.round(finalBalance / Math.pow(1 + inflationPct / 100, years));

  return { finalBalance, totalContributed: totalContributedRounded, growth, realValueAfterInflation, series };
}

export const CALCULATOR_PRESETS = [
  "אני בן 27, יש לי 100,000 ש\"ח להשקיע ל-10 שנים במדד S&P 500",
  "חיסכון חודשי של 1,000 ש\"ח לילד עד גיל 18",
  "500 ש\"ח בחודש למשך 20 שנה באג\"ח ממשלתי",
  "השקעה חד פעמית של 500,000 ש\"ח ל-15 שנה בתיק מאוזן",
];
