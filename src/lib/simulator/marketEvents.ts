// ---------------------------------------------------------------------------
// InvestED — Market event simulator (educational, fictional).
//
// Invented scenarios (crash, rally, bubble) on a FICTIONAL index. Deterministic:
// the same input always gives the same path, no randomness, no network, no
// model. It never reads, mixes with or imitates a real price series, and it
// names no real company, index or date. Every result carries the label
// MARKET_SIM_LABEL, which every surface must show.
//
// Difference from the neighbours:
// - scenarioDesk splits one long question into several ordinary calculations.
// - stockSimulationEngine replays REAL historical prices (DCA / projections).
// - this module invents a path from fixed phase shapes, to teach what drawdowns,
//   recovery maths and bubbles feel like. It is never evidence about the market.
// ---------------------------------------------------------------------------
import type { Bi } from "@/lib/intelligence/envelope";

export const MARKET_SIM_LABEL: Bi = { en: "Educational scenario, not real data", he: "תרחיש לימודי, לא נתונים אמיתיים" };
export const FICTIONAL_INDEX: Bi = { en: "Fictional Index (invented)", he: "מדד דמיוני (מומצא)" };

export type MarketEventKind = "crash" | "rally" | "bubble";
export interface MarketEventInput { kind: MarketEventKind; amount?: number; magnitudePct?: number }
export interface MarketEventPoint { month: number; level: number; value: number }
export interface MarketEventResult {
  synthetic: true;
  label: Bi;
  kind: MarketEventKind;
  title: Bi;
  index: Bi;
  startAmount: number;
  magnitudePct: number;
  points: MarketEventPoint[];
  endValue: number;
  returnPct: number;
  peakValue: number;
  troughValue: number;
  maxDrawdownPct: number;
  /** gain needed from the lowest point to get back to the previous high */
  recoveryNeededPct: number;
  lessons: Bi[];
}

export const DEFAULT_AMOUNT = 10_000;
const RANGE: Record<MarketEventKind, { def: number; min: number; max: number }> = {
  crash: { def: 40, min: 5, max: 90 },
  rally: { def: 50, min: 5, max: 300 },
  bubble: { def: 120, min: 20, max: 300 },
};
const r2 = (n: number) => Math.round(n * 100) / 100;
const smooth = (t: number) => t * t * (3 - 2 * t);

interface Phase { months: number; to: number }

/** Phase end-levels (start = 100). Fixed shapes; only the magnitude scales them. */
function phases(kind: MarketEventKind, m: number): Phase[] {
  if (kind === "crash") {
    const top = 104;
    const low = top * (1 - m / 100);
    return [{ months: 2, to: top }, { months: 4, to: low }, { months: 6, to: low + (top - low) * 0.4 }];
  }
  if (kind === "rally") {
    return [{ months: 3, to: 100 + m * 0.3 }, { months: 6, to: 100 + m * 0.8 }, { months: 3, to: 100 + m }];
  }
  const peak = 100 + m;
  return [{ months: 6, to: 100 + m * 0.5 }, { months: 6, to: peak }, { months: 3, to: peak * 0.35 }, { months: 5, to: peak * 0.35 * 1.1 }];
}

export function clampMagnitude(kind: MarketEventKind, pct?: number): number {
  const r = RANGE[kind];
  if (pct === undefined || !Number.isFinite(pct)) return r.def;
  return Math.min(r.max, Math.max(r.min, Math.round(pct)));
}

export function simulateMarketEvent(input: MarketEventInput): MarketEventResult {
  const amount = input.amount !== undefined && Number.isFinite(input.amount) && input.amount > 0 ? Math.min(input.amount, 1e9) : DEFAULT_AMOUNT;
  const magnitudePct = clampMagnitude(input.kind, input.magnitudePct);
  const levels: number[] = [100];
  let from = 100;
  for (const ph of phases(input.kind, magnitudePct)) {
    for (let i = 1; i <= ph.months; i++) levels.push(from + (ph.to - from) * smooth(i / ph.months));
    from = ph.to;
  }
  const points = levels.map((lv, month) => ({ month, level: r2(lv), value: r2((amount * lv) / 100) }));
  let peak = points[0].value, maxDd = 0, ddLow = points[0].value, ddHigh = points[0].value;
  for (const p of points) {
    if (p.value > peak) peak = p.value;
    const dd = (peak - p.value) / peak;
    if (dd > maxDd) { maxDd = dd; ddLow = p.value; ddHigh = peak; }
  }
  const overallPeak = Math.max(...points.map((p) => p.value));
  const overallTrough = Math.min(...points.map((p) => p.value));
  const end = points[points.length - 1].value;
  return {
    synthetic: true,
    label: MARKET_SIM_LABEL,
    kind: input.kind,
    title: TITLES[input.kind],
    index: FICTIONAL_INDEX,
    startAmount: amount,
    magnitudePct,
    points,
    endValue: end,
    returnPct: r2(((end - amount) / amount) * 100),
    peakValue: overallPeak,
    troughValue: overallTrough,
    maxDrawdownPct: r2(maxDd * 100),
    recoveryNeededPct: maxDd > 0 ? r2((ddHigh / ddLow - 1) * 100) : 0,
    lessons: lessonsFor(input.kind, magnitudePct, maxDd * 100),
  };
}

const TITLES: Record<MarketEventKind, Bi> = {
  crash: { en: "Invented market crash", he: "קריסת שוק מומצאת" },
  rally: { en: "Invented market rally", he: "עליית שוק מומצאת" },
  bubble: { en: "Invented bubble and burst", he: "בועה והתפוצצות מומצאות" },
};

function lessonsFor(kind: MarketEventKind, m: number, dd: number): Bi[] {
  const need = dd > 0 ? Math.round((100 / (100 - dd) - 1) * 100) : 0;
  if (kind === "crash") return [
    { en: `A fall of ${Math.round(dd)}% needs a rise of about ${need}% to get back to the old high. Losses are harder to undo than they look.`, he: `ירידה של ${Math.round(dd)}% דורשת עלייה של כ-${need}% כדי לחזור לשיא הקודם. הפסדים קשים להחזרה יותר ממה שנראה.` },
    { en: "Someone who sold at the low locked in the loss. Someone who held and could wait recovered part of it. This path is invented, so real recoveries can be faster, slower or never.", he: "מי שמכר בשפל נעל את ההפסד. מי שהחזיק ויכול היה לחכות החזיר חלק ממנו. המסלול הזה מומצא, ולכן התאוששות אמיתית יכולה להיות מהירה יותר, איטית יותר או לא להגיע בכלל." },
  ];
  if (kind === "rally") return [
    { en: `A rise of ${m}% in a year is a teaching example. It is not a forecast and real markets rarely move in a smooth line.`, he: `עלייה של ${m}% בשנה היא דוגמת לימוד. זו לא תחזית, ושווקים אמיתיים כמעט אף פעם לא עולים בקו חלק.` },
    { en: "After a long rise it is easy to believe it will continue. Decide your plan before the rise, not during it.", he: "אחרי עלייה ארוכה קל להאמין שהיא תימשך. קובעים תוכנית לפני העלייה ולא בתוכה." },
  ];
  return [
    { en: `The invented bubble rose ${m}% and then fell ${Math.round(dd)}%. A fast rise driven by excitement, not by value, can reverse faster than it grew.`, he: `הבועה המומצאת עלתה ${m}% ואז ירדה ${Math.round(dd)}%. עלייה מהירה שמונעת מהתלהבות ולא משווי יכולה להתהפך מהר יותר משעלתה.` },
    { en: `Buying near the top meant needing about ${need}% just to break even. Spreading money over time and across assets limits this risk.`, he: `מי שקנה ליד השיא היה צריך כ-${need}% רק כדי לחזור לנקודת ההתחלה. פיזור הכסף לאורך זמן ובין נכסים מצמצם את הסיכון הזה.` },
  ];
}

const KIND_PATTERNS: Array<[MarketEventKind, RegExp]> = [
  ["bubble", /bubble|בועה|בועת/i],
  ["crash", /crash|collapse|meltdown|plunge|\bdrops?\b|\bfalls?\b|declin|tumbl|sell-?off|correction|קריס|התרסק|מפולת|קורס|(?<![א-ת])(?:יצנח|צונח|יירד|ירד|יורד|נופל|ייפול|יפול)(?![א-ת])/i],
  ["rally", /rally|boom|bull run|surge|goes up|climbs?\b|ראלי|זינוק|פריחה|עליית שוק|שוק עולה|(?<![א-ת])(?:יעלה|יעלו)(?![א-ת])/i],
];
const SIM_WORDS = /simulat|scenario|what if|what would happen|what happens if|what will happen|imagine|סימולצ|תרחיש|דמה|דמיין|הדמי(?:ה|ית)|מה יקרה אם|מה קורה אם|מה היה קורה|מה אם/i;

/** Something other than the market that can "drop" or "fall": a what-if about it is not a market simulation. */
const NOT_THE_MARKET = /\b(?:interest rates?|rates?|salary|salaries|wages?|income|pay|rent|inflation|fed|unemployment|mortgage|taxes|tax|job)\b|ריבית|משכורת|שכר|שכירות|אינפלציה|הכנסה|אבטלה|משכנתא|מס(?![א-ת])/i;
const MARKET_SUBJECT = /\b(?:market|markets|stocks?|shares?|index|indices|portfolio|equities|s&p|nasdaq|dow)\b|שוק|שווקים|מניות|מדד|תיק|בורסה/i;
const HARD_CRASH = /crash|meltdown|collapse|bubble|קריס|התרסק|מפולת|בועה|בועת/i;

/** Recognize a request to simulate an invented market event. A plain question about a real crash is NOT matched: a simulation word is required. */
export function parseMarketEventRequest(text: string): MarketEventInput | null {
  if (!SIM_WORDS.test(text)) return null;
  const kind = KIND_PATTERNS.find(([, re]) => re.test(text))?.[0];
  if (!kind) return null;
  if (NOT_THE_MARKET.test(text) && !MARKET_SUBJECT.test(text) && !HARD_CRASH.test(text)) return null;
  const pct = /(\d+(?:\.\d+)?)\s*%/.exec(text);
  const rest = text.replace(/(\d+(?:\.\d+)?)\s*%/g, " ").replace(/\b(?:s&p\s*500|nasdaq[- ]?100|dow\s*30|russell\s*2000)\b/gi, " ");
  let amount: number | undefined;
  for (const m of rest.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*(k\b|m\b|million|thousand|אלף|מיליון)?/gi)) {
    const after = rest.slice(m.index! + m[0].length);
    const before = rest.slice(0, m.index!);
    // a duration ("in 2 years") or a year ("like 2008", "2000-style") is not the amount
    if (!m[2] && /^\s*(?:years?|yrs?|months?|weeks?|days?|שנים|שנה|חודשים|חודש)/i.test(after)) continue;
    if (!m[2] && /^(?:19|20)\d\d$/.test(m[1]) && (/(?:like|in|of|during|since|from|the)\s+$/i.test(before) || /^(?:-?style|'s|\s*(?:crash|bubble|collapse))/i.test(after))) continue;
    const unit = m[2]?.toLowerCase();
    const scale = unit === "m" || unit === "million" || unit === "מיליון" ? 1_000_000 : unit ? 1000 : 1;
    const value = Number(m[1].replace(/,/g, "")) * scale;
    if (value > 0) { amount = value; break; }
  }
  return { kind, amount, magnitudePct: pct ? Number(pct[1]) : undefined };
}
