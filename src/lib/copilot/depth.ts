/**
 * Per-level depth. BASIC is the plain answer and runs no extra pass (fastest).
 * Each deeper track chains more deterministic passes after it: JUNIOR adds meaning and related terms,
 * SENIOR adds sensitivity and where to practise, PROFESSIONAL adds method and limits.
 * Every pass reads stored knowledge or the fixed calculator. No model writes any number here.
 */
import type { Level } from "./levels";
import type { CalcDeskResult } from "./calcDesk";
import type { TrustClass } from "../intelligence/verificationEngine";
import { computeProjection, DEFAULT_INFLATION_PCT } from "../calculatorEngine";
import { conceptAnswerByLabel } from "../financialEducation";
import { conceptName, findConceptsInText, getConcept, relatedConcepts } from "../knowledge/concepts/registry";
import { fmt } from "./mathDesk";
import type { DataDeskKind } from "./dataDesk";
import type { FxResult } from "./fxDesk";
import type { MathDeskResult } from "./mathDesk";
import type { WbResult } from "./worldBankDesk";
import type { SymbolInfo } from "./symbolDesk";

type Bi = { en: string; he: string };
export interface DepthSection { id: string; title: Bi; lines: Bi[]; trust: TrustClass }

const RANK: Record<Level, number> = { basic: 1, junior: 2, senior: 3, professional: 4 };
export const depthOf = (l: Level) => RANK[l];
const b = (en: string, he: string): Bi => ({ en, he });
/** Keeps a number and its currency code together inside right-to-left text. */
const iso = (t: string) => `\u2066${t}\u2069`;
const money = (n: number, cur: string) => iso(`${fmt(Math.round(n))} ${cur}`);

function firstSentence(t: string): string { const m = /^.*?[.!?](?=\s|$)/.exec(t.trim()); return (m ? m[0] : t).trim(); }

export function calcSections(level: Level, c: CalcDeskResult): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  if (d >= 2) {
    const share = c.finalBalance > 0 ? Math.round((c.growth / c.finalBalance) * 100) : 0;
    out.push({ id: "meaning", trust: "CALCULATION", title: b("What this means", "מה זה אומר"), lines: [
      b(`Of ${fmt(Math.round(c.finalBalance))} ${c.currency} at the end, ${fmt(Math.round(c.contributed))} is money you put in and ${fmt(Math.round(c.growth))} is growth (${share}%).`,
        `מתוך ${money(c.finalBalance, c.currency)} בסוף, ${money(c.contributed, c.currency)} הוא כסף שהפקדתם ו-${money(c.growth, c.currency)} הוא צמיחה (${share}%).`),
      b("The return rate is a teaching assumption, not a forecast.", "שיעור התשואה הוא הנחת לימוד, לא תחזית.")] });
  }
  if (d >= 3) {
    const rows = [Math.max(0, c.returnPct - 2), c.returnPct, c.returnPct + 2].filter((v, i, a) => a.indexOf(v) === i).map((r) => {
      const p = computeProjection(c.principal, c.monthly, c.years, r, DEFAULT_INFLATION_PCT, c.currency);
      return b(`${r}% a year: ${fmt(Math.round(p.finalBalance))} ${c.currency}`, `${r}% בשנה: ${money(p.finalBalance, c.currency)}`);
    });
    out.push({ id: "sensitivity", trust: "CALCULATION", title: b("If the return is different (teaching rates)", "אם התשואה שונה (שיעורי לימוד)"), lines: rows });
  }
  if (d >= 4) {
    out.push({ id: "method", trust: "CALCULATION", title: b("Method and limits", "שיטה ומגבלות"), lines: [
      b("Monthly compounding with deposits at month end. Real value uses a fixed 2.5% inflation assumption.", "ריבית חודשית עם הפקדות בסוף החודש. הערך הריאלי משתמש בהנחת אינפלציה קבועה של 2.5%."),
      b("Ignores taxes, fees and the ups and downs of real markets. Real results vary and can be negative.", "לא כולל מסים, עמלות ותנודות של שווקים אמיתיים. תוצאות אמיתיות משתנות ויכולות להיות שליליות.")] });
  }
  return out;
}

export function conceptSections(level: Level, question: string): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  const main = findConceptsInText(question, 1)[0];
  if (!main || d < 2) return out;
  const related = relatedConcepts(main.id, 3);
  const line = (id: string): Bi | null => {
    const c = getConcept(id); if (!c?.explain) return null;
    const en = conceptAnswerByLabel(c.explain, "en"), he = conceptAnswerByLabel(c.explain, "he");
    return en && he ? b(`${conceptName(c, "en")}: ${firstSentence(en)}`, `${conceptName(c, "he")}: ${firstSentence(he)}`) : null;
  };
  const relLines = related.map((r) => line(r.id)).filter((x): x is Bi => x !== null);
  if (relLines.length) out.push({ id: "related", trust: "EDUCATIONAL", title: b("Related terms", "מושגים קשורים"), lines: relLines });
  if (d >= 3) {
    const shown = new Set([main.id, ...related.map((r) => r.id)]);
    const further = related.flatMap((r) => relatedConcepts(r.id, 3)).filter((c) => !shown.has(c.id)).filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i).slice(0, 3);
    const names = further.map((c) => b(conceptName(c, "en"), conceptName(c, "he")));
    if (names.length) out.push({ id: "further", trust: "EDUCATIONAL", title: b("Often studied next", "מה לומדים בדרך כלל אחר כך"), lines: [b(names.map((n) => n.en).join(", "), names.map((n) => n.he).join(", "))] });
    if (main.tools.length) out.push({ id: "tools", trust: "EDUCATIONAL", title: b("Where to practise on this site", "איפה לתרגל באתר"), lines: [b(main.tools.join(", "), main.tools.join(", "))] });
  }
  if (d >= 4) out.push({ id: "limits", trust: "EDUCATIONAL", title: b("Limits of this answer", "מגבלות התשובה"), lines: [
    b("This is general teaching text from stored knowledge. It is not advice, and it has no market data. Rules and rates differ by country and change over time, so check an official source before you act.",
      "זהו טקסט לימודי כללי מתוך ידע שמור. הוא לא ייעוץ ואין בו נתוני שוק. כללים ושיעורים שונים בין מדינות ומשתנים עם הזמן, לכן בדקו מקור רשמי לפני שפועלים.")] });
  return out;
}

const DESK: Record<DataDeskKind, { read: Bi; next: Bi; limit: Bi }> = {
  movers: {
    read: b("A big move in one day is a fact about the past day. It is not a reason to buy or sell.", "תנועה גדולה ביום אחד היא עובדה על היום שחלף. היא לא סיבה לקנות או למכור."),
    next: b("Check why it moved (news), how it behaved over a longer period, and whether it fits a plan you already have.", "בדקו למה זה זז (חדשות), איך זה התנהג לאורך זמן, והאם זה מתאים לתוכנית שכבר יש לכם."),
    limit: b("This is a free, delayed snapshot of a limited list. It is not every stock, and it is not live.", "זו תמונת מצב חינמית ומאוחרת של רשימה מוגבלת. זה לא כל המניות, וזה לא חי."),
  },
  policy_rate: {
    read: b("The policy rate is the central bank's base interest rate. It influences loan and savings rates across the economy.", "ריבית המדיניות היא ריבית הבסיס של הבנק המרכזי. היא משפיעה על ריביות הלוואות וחיסכון במשק."),
    next: b("Variable-rate loans usually move with it, fixed-rate loans do not. Compare this with your own loan terms.", "הלוואות בריבית משתנה בדרך כלל זזות איתה, הלוואות בריבית קבועה לא. השוו את זה לתנאי ההלוואה שלכם."),
    limit: b("A rate history shows what happened, not what will happen. Decisions are announced on set dates.", "היסטוריית ריבית מראה מה קרה, לא מה יקרה. ההחלטות מתפרסמות במועדים קבועים."),
  },
  insurance: {
    read: b("These are reported yields of insurance and pension funds for a period. A yield is past performance.", "אלו תשואות מדווחות של קופות ביטוח ופנסיה לתקופה. תשואה היא ביצוע עבר."),
    next: b("Compare over several periods, and look at management fees as well as yield, since fees reduce what you keep.", "השוו על פני כמה תקופות, והסתכלו גם על דמי ניהול ולא רק על תשואה, כי דמי ניהול מקטינים את מה שנשאר לכם."),
    limit: b("The data comes from the official report and covers one reporting period. It is not advice and not a ranking of what suits you.", "הנתונים מהדוח הרשמי ומכסים תקופת דיווח אחת. זה לא ייעוץ ולא דירוג של מה שמתאים לכם."),
  },
};

export function deskSections(level: Level, kind: DataDeskKind): DepthSection[] {
  const d = RANK[level], x = DESK[kind], out: DepthSection[] = [];
  if (d >= 2) out.push({ id: "read", trust: "EDUCATIONAL", title: b("How to read this", "איך לקרוא את זה"), lines: [x.read] });
  if (d >= 3) out.push({ id: "next", trust: "EDUCATIONAL", title: b("What to check next", "מה לבדוק אחר כך"), lines: [x.next] });
  if (d >= 4) out.push({ id: "datalimits", trust: "DATA", title: b("Limits of this data", "מגבלות הנתונים"), lines: [x.limit] });
  return out;
}

export interface AssetLite { symbol: string; price: number; changePercent: number }

export function assetSections(level: Level, assets: AssetLite[]): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  const a = assets[0];
  if (!a || d < 2) return out;
  const terms = ["rsi", "volatility"].map((id) => {
    const c = getConcept(id); if (!c?.explain) return null;
    const en = conceptAnswerByLabel(c.explain, "en"), he = conceptAnswerByLabel(c.explain, "he");
    return en && he ? b(`${conceptName(c, "en")}: ${firstSentence(en)}`, `${conceptName(c, "he")}: ${firstSentence(he)}`) : null;
  }).filter((x): x is Bi => x !== null);
  if (terms.length) out.push({ id: "terms", trust: "EDUCATIONAL", title: b("Terms in this answer", "מושגים בתשובה"), lines: terms });
  if (d >= 3) {
    const m = Math.abs(a.changePercent);
    const size = m < 1 ? b("small", "קטנה") : m < 3 ? b("moderate", "בינונית") : b("large", "גדולה");
    out.push({ id: "move", trust: "ANALYSIS", title: b("Size of the move", "גודל התנועה"), lines: [
      b(`${a.symbol} changed ${fmt(Number(a.changePercent.toFixed(2)))}% in the latest period. Teaching label: a ${size.en} move (under 1% small, 1% to 3% moderate, over 3% large). These bands are a rule of thumb, not a signal.`,
        `${a.symbol} השתנה ב-${iso(`${fmt(Number(a.changePercent.toFixed(2)))}%`)} בתקופה האחרונה. תווית לימוד: תנועה ${size.he} (מתחת ל-1% קטנה, 1% עד 3% בינונית, מעל 3% גדולה). הטווחים הם כלל אצבע, לא איתות.`)] });
  }
  if (d >= 4) out.push({ id: "assetlimits", trust: "DATA", title: b("Limits of this data", "מגבלות הנתונים"), lines: [
    b("Free feed, possibly delayed, with the date shown on the chart. Indicators describe the past and do not predict. One asset is not a plan, so look at how it fits your whole portfolio.",
      "מקור חינמי, אולי באיחור, והתאריך מוצג בגרף. אינדיקטורים מתארים את העבר ולא חוזים. נכס בודד הוא לא תוכנית, לכן בדקו איך הוא משתלב בכל התיק.")] });
  return out;
}

const concept = (id: string): Bi | null => {
  const c = getConcept(id); if (!c?.explain) return null;
  const en = conceptAnswerByLabel(c.explain, "en"), he = conceptAnswerByLabel(c.explain, "he");
  return en && he ? b(`${conceptName(c, "en")}: ${firstSentence(en)}`, `${conceptName(c, "he")}: ${firstSentence(he)}`) : null;
};
const num = (n: number, dp = 4) => fmt(Number(n.toFixed(dp)));

export function fxSections(level: Level, r: FxResult): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  if (d < 2) return out;
  out.push({ id: "fxmeaning", trust: "DATA", title: b("What this rate is", "מה השער הזה"), lines: [
    b(`The rate is the European Central Bank reference rate for ${r.date}. It is set once per working day.`, `השער הוא שער הייחוס של הבנק המרכזי האירופי לתאריך ${r.date}. הוא נקבע פעם ביום עבודה.`),
    b("It is not the rate a bank or card company will give you.", "זה לא השער שבנק או חברת אשראי יתנו לכם.")] });
  if (d >= 3) {
    const inv = 1 / r.rate;
    out.push({ id: "fxsens", trust: "CALCULATION", title: b("Other ways to read it", "דרכים נוספות לקרוא את זה"), lines: [
      b(`1 ${r.to} = ${num(inv)} ${r.from} (the inverse of ${num(r.rate)}).`, `${iso(`1 ${r.to} = ${num(inv)} ${r.from}`)} (ההופכי של ${iso(num(r.rate))}).`),
      b(`If the rate were 1% lower, ${num(r.amount, 2)} ${r.from} would give ${num(r.result * 0.99, 2)} ${r.to} (a what-if for teaching, not a forecast).`,
        `אם השער היה נמוך ב-1%, ${iso(`${num(r.amount, 2)} ${r.from}`)} היו נותנים ${iso(`${num(r.result * 0.99, 2)} ${r.to}`)} (תרחיש לימוד, לא תחזית).`)] });
  }
  if (d >= 4) out.push({ id: "fxlimits", trust: "DATA", title: b("Limits of this data", "מגבלות הנתונים"), lines: [
    b("Real conversions add a spread or a fee, so you receive less than this. Rates move every day and past moves do not predict the next one.", "המרה אמיתית כוללת מרווח או עמלה, ולכן תקבלו פחות. שערים זזים כל יום ותנועות עבר לא חוזות את הבאה.")] });
  return out;
}

export function wbSections(level: Level, r: WbResult): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  if (d < 2 || r.points.length === 0) return out;
  out.push({ id: "wbmeaning", trust: "DATA", title: b("How to read this", "איך לקרוא את זה"), lines: [
    b("Each value is one year. The World Bank publishes with a delay, so the latest year is not this year.", "כל ערך הוא שנה אחת. הבנק העולמי מפרסם באיחור, ולכן השנה האחרונה היא לא השנה הנוכחית."),
    ...(r.indicator === "inflation" ? [concept("inflation")] : []).filter((x): x is Bi => x !== null)] });
  if (d >= 3 && r.points.length >= 2) {
    const vals = r.points.map((p) => p.value);
    const avg = vals.reduce((a, v) => a + v, 0) / vals.length;
    const hi = r.points.reduce((a, p) => (p.value > a.value ? p : a)), lo = r.points.reduce((a, p) => (p.value < a.value ? p : a));
    out.push({ id: "wbrange", trust: "CALCULATION", title: b("Across the years shown", "על פני השנים המוצגות"), lines: [
      b(`Average ${num(avg, 2)}%. Highest ${num(hi.value, 2)}% in ${hi.year}. Lowest ${num(lo.value, 2)}% in ${lo.year}.`, `ממוצע ${iso(`${num(avg, 2)}%`)}. הגבוה ביותר ${iso(`${num(hi.value, 2)}%`)} ב-${hi.year}. הנמוך ביותר ${iso(`${num(lo.value, 2)}%`)} ב-${lo.year}.`)] });
  }
  if (d >= 4) out.push({ id: "wblimits", trust: "DATA", title: b("Limits of this data", "מגבלות הנתונים"), lines: [
    b("Official figures are revised later, and countries measure in slightly different ways. One indicator does not describe an economy. Source: World Bank Open Data, CC BY 4.0.", "נתונים רשמיים מתוקנים מאוחר יותר, ומדינות מודדות בדרכים מעט שונות. מדד אחד לא מתאר משק. מקור: World Bank Open Data, CC BY 4.0.")] });
  return out;
}

export function symbolSections(level: Level, s: SymbolInfo): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  if (d < 2) return out;
  const terms = (s.kind === "fund" ? ["etf", "index-fund", "expense-ratio"] : ["stock", "market-cap", "dividend"]).map(concept).filter((x): x is Bi => x !== null);
  if (terms.length) out.push({ id: "symterms", trust: "EDUCATIONAL", title: b("Terms for this kind of asset", "מושגים לסוג הנכס הזה"), lines: terms.slice(0, d >= 3 ? 3 : 2) });
  if (d >= 3) out.push({ id: "symnext", trust: "EDUCATIONAL", title: b("What to check next", "מה כדאי לבדוק הלאה"), lines: [
    s.kind === "fund" ? b("What the fund holds, its yearly cost (expense ratio) and how long it has existed.", "במה הקרן מחזיקה, מה העלות השנתית שלה (דמי ניהול) וכמה זמן היא קיימת.")
      : b("What the company sells, how its price moved over years, and how much of your plan one company should be.", "מה החברה מוכרת, איך המחיר זז לאורך שנים, וכמה מהתוכנית שלכם צריכה להיות חברה אחת.")] });
  if (d >= 4) out.push({ id: "symlimits", trust: "DATA", title: b("Limits of this data", "מגבלות הנתונים"), lines: [
    b("Name, sector and size come from the open FinanceDatabase list, which can lag the real company. This is a description, not a recommendation.", "השם, הסקטור והגודל מגיעים מרשימת FinanceDatabase הפתוחה, שיכולה לפגר אחרי החברה האמיתית. זה תיאור, לא המלצה.")] });
  return out;
}

export function scenarioSections(level: Level): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  if (d < 2) return out;
  out.push({ id: "scmeaning", trust: "CALCULATION", title: b("How the parts were handled", "איך טיפלנו בחלקים"), lines: [
    b("Each part was calculated on its own by a fixed engine. A result is not carried into the next part.", "כל חלק חושב בנפרד על ידי מנוע קבוע. תוצאה אחת לא עוברת לחלק הבא.")] });
  if (d >= 4) out.push({ id: "sclimits", trust: "CALCULATION", title: b("Limits", "מגבלות"), lines: [
    b("If a part could not be read exactly, it says so instead of guessing. Rates in these examples are teaching assumptions, not forecasts.", "אם חלק לא היה ניתן לקריאה מדויקת, הוא אומר זאת ולא מנחש. שיעורים בדוגמאות הם הנחות לימוד, לא תחזיות.")] });
  return out;
}

export function mathSections(level: Level, r: MathDeskResult): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  if (d < 2 || !r.ok || r.value === undefined) return out;
  out.push({ id: "mathread", trust: "CALCULATION", title: b("How it was solved", "איך זה נפתר"), lines: [
    b(`The expression was solved in ${r.steps.length} step${r.steps.length === 1 ? "" : "s"}, shown above, using the usual order: brackets, powers, multiplication and division, then addition and subtraction.`,
      `הביטוי נפתר ב-${r.steps.length} שלבים, מוצגים למעלה, לפי הסדר הרגיל: סוגריים, חזקות, כפל וחילוק, ואז חיבור וחיסור.`)] });
  if (d >= 3) out.push({ id: "mathcheck", trust: "CALCULATION", title: b("Check it yourself", "בדקו בעצמכם"), lines: [
    b("Redo the steps in the same order with a calculator, or change one number and see how the result moves.", "חזרו על השלבים באותו סדר במחשבון, או שנו מספר אחד וראו איך התוצאה זזה.")] });
  if (d >= 4) out.push({ id: "mathlimits", trust: "CALCULATION", title: b("Limits", "מגבלות"), lines: [
    b("The result is shown to 4 decimals and computed in standard floating point, so a very long decimal can differ in the last digits. If an expression cannot be read exactly, the desk says so instead of guessing.",
      "התוצאה מוצגת עד 4 ספרות אחרי הנקודה ומחושבת בנקודה צפה סטנדרטית, ולכן עשרוני ארוך מאוד יכול להיות שונה בספרות האחרונות. אם ביטוי לא ניתן לקריאה מדויקת, המנוע אומר זאת ולא מנחש.")] });
  return out;
}

export function depthSections(level: Level, msg: { calc?: CalcDeskResult | null; desk?: { kind: DataDeskKind } | null; assets?: AssetLite[]; question?: string; fx?: FxResult | null; math?: MathDeskResult | null; wb?: WbResult | null; symbol?: SymbolInfo | null; scenario?: unknown }): DepthSection[] {
  if (level === "basic") return [];
  if (msg.math) return mathSections(level, msg.math);
  if (msg.fx) return fxSections(level, msg.fx);
  if (msg.wb) return wbSections(level, msg.wb);
  if (msg.symbol) return symbolSections(level, msg.symbol);
  if (msg.scenario) return scenarioSections(level);
  if (msg.desk) return deskSections(level, msg.desk.kind);
  if (msg.assets && msg.assets.length) return assetSections(level, msg.assets);
  if (msg.calc) return calcSections(level, msg.calc);
  return msg.question ? conceptSections(level, msg.question) : [];
}
