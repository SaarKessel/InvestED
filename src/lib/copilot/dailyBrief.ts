/** Daily brief: three fixed parts run by the existing desks. Concept of the day (stored explanation), market movers (live or labelled), one quiz question. Nothing here is generated. */
import { allConcepts, conceptName } from "../knowledge/concepts/registry";

const BRIEF = /^\s*(?:(?:give me|show me|send me|tell me|open|what'?s|what is)\s+)?(?:(?:the|my)\s+)?(?:daily brief(?:ing)?|today'?s brief|morning brief|daily intelligence)(?:\s*,?\s*(?:please|pls))?\s*[.!?]*\s*$/i;
const BRIEF_HE = /^\s*(?:(?:תן לי|תני לי|הראה לי|הראי לי|הצג|מה)\s+(?:את\s+)?)?(?:תדריך יומי|התדריך היומי|סיכום יומי|הסיכום היומי|מודיעין יומי)(?:\s+בבקשה)?\s*[.!?]*\s*$/;
export const isDailyBrief = (text: string): boolean => BRIEF.test(text) || BRIEF_HE.test(text);

/** Day number in the user's local calendar, so the pick is stable for a whole day. */
export const dayNumber = (d: Date): number => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

/** Concept of the day: only concepts that have a stored explanation. */
export function conceptOfTheDay(d: Date, lang: "en" | "he"): { id: string; name: string; ask: string } {
  const list = allConcepts().filter((c) => c.explain !== null);
  const c = list[dayNumber(d) % list.length];
  const name = conceptName(c, lang);
  return { id: c.id, name, ask: lang === "he" ? `מה זה ${name}?` : `What is ${name}?` };
}

export function briefHeader(d: Date, lang: "en" | "he"): string {
  const day = d.toLocaleDateString(lang === "he" ? "he-IL" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const c = conceptOfTheDay(d, lang);
  return lang === "he"
    ? `תדריך יומי, ${day}. שלושה חלקים: מושג היום (${c.name}), תנועות בשוק, ושאלה אחת לבחינה עצמית. הכול מהמנועים הקיימים, בלי תוכן שנוצר.`
    : `Daily brief, ${day}. Three parts: concept of the day (${c.name}), market movers, and one self-test question. Everything comes from the existing engines, nothing is generated.`;
}
