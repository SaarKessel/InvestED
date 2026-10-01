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

type Bi = { en: string; he: string };
export interface DepthSection { id: string; title: Bi; lines: Bi[]; trust: TrustClass }

const RANK: Record<Level, number> = { basic: 1, junior: 2, senior: 3, professional: 4 };
export const depthOf = (l: Level) => RANK[l];
const b = (en: string, he: string): Bi => ({ en, he });

function firstSentence(t: string): string { const m = /^.*?[.!?](?=\s|$)/.exec(t.trim()); return (m ? m[0] : t).trim(); }

export function calcSections(level: Level, c: CalcDeskResult): DepthSection[] {
  const d = RANK[level], out: DepthSection[] = [];
  if (d >= 2) {
    const share = c.finalBalance > 0 ? Math.round((c.growth / c.finalBalance) * 100) : 0;
    out.push({ id: "meaning", trust: "CALCULATION", title: b("What this means", "מה זה אומר"), lines: [
      b(`Of ${fmt(Math.round(c.finalBalance))} ${c.currency} at the end, ${fmt(Math.round(c.contributed))} is money you put in and ${fmt(Math.round(c.growth))} is growth (${share}%).`,
        `מתוך ${fmt(Math.round(c.finalBalance))} ${c.currency} בסוף, ${fmt(Math.round(c.contributed))} הוא כסף שהפקדתם ו-${fmt(Math.round(c.growth))} הוא צמיחה (${share}%).`),
      b("The return rate is a teaching assumption, not a forecast.", "שיעור התשואה הוא הנחת לימוד, לא תחזית.")] });
  }
  if (d >= 3) {
    const rows = [Math.max(0, c.returnPct - 2), c.returnPct, c.returnPct + 2].filter((v, i, a) => a.indexOf(v) === i).map((r) => {
      const p = computeProjection(c.principal, c.monthly, c.years, r, DEFAULT_INFLATION_PCT, c.currency);
      return b(`${r}% a year: ${fmt(Math.round(p.finalBalance))} ${c.currency}`, `${r}% בשנה: ${fmt(Math.round(p.finalBalance))} ${c.currency}`);
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

export function depthSections(level: Level, msg: { calc?: CalcDeskResult | null; question?: string }): DepthSection[] {
  if (level === "basic") return [];
  if (msg.calc) return calcSections(level, msg.calc);
  return msg.question ? conceptSections(level, msg.question) : [];
}
