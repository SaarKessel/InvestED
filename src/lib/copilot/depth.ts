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

export function depthSections(level: Level, msg: { calc?: CalcDeskResult | null; desk?: { kind: DataDeskKind } | null; question?: string }): DepthSection[] {
  if (level === "basic") return [];
  if (msg.desk) return deskSections(level, msg.desk.kind);
  if (msg.calc) return calcSections(level, msg.calc);
  return msg.question ? conceptSections(level, msg.question) : [];
}
