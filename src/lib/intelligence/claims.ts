/** Claim-level verification. Deterministic, no model. Goes past "the number appears somewhere": each number in a draft sentence must sit in one sentence of a source together with the other numbers of that sentence. Also audits a tool result's provenance and checks that links come from the sources. */
import { numbersIn } from "./verificationEngine";
import type { DataState, ToolResult } from "./envelope";

export type ClaimLabel = "sourced" | "mispaired" | "unsupported" | "no_numbers";
export interface ClaimCheck { sentence: string; label: ClaimLabel }
export type Outcome = "verified" | "verified_with_limits" | "partial" | "contradicted" | "unverifiable";

const sentences = (t: string) => t.split(/(?<=[.!?\n])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

/** Label every draft sentence. "mispaired": every number exists in the sources, but never together in one source sentence. */
export function checkClaims(draft: string, sources: string[]): ClaimCheck[] {
  const srcSent = sources.flatMap(sentences).map((s) => new Set(numbersIn(s)));
  const all = new Set(srcSent.flatMap((s) => [...s]));
  return sentences(draft).map((sentence) => {
    const nums = [...new Set(numbersIn(sentence))];
    if (!nums.length) return { sentence, label: "no_numbers" as const };
    if (!nums.every((n) => all.has(n))) return { sentence, label: "unsupported" as const };
    return { sentence, label: srcSent.some((s) => nums.every((n) => s.has(n))) ? ("sourced" as const) : ("mispaired" as const) };
  });
}

const URL_RE = /https?:\/\/[^\s)>\]"']+/g;
/** Links in a draft that no source contains. */
export function unknownLinks(draft: string, sources: string[]): string[] {
  const known = sources.join("\n");
  return [...new Set((draft.match(URL_RE) ?? []).map((u) => u.replace(/[.,;]+$/, "")))].filter((u) => !known.includes(u));
}

export const FRESH_LIMIT_DAYS: Record<DataState, number | null> = { live: 4, cached: 4, fallback: 4, static: null, calculated: null, synthetic: null };
export interface Audit { issues: string[]; stale: boolean }
/** Provenance integrity for one tool result: a source named, data states that claim real data carry a date, and that date is not older than the limit. */
/** Tools whose data is published on a slower rhythm than daily. 13F: due 45 days after quarter end, so the newest report is at most about 135 days old. */
export const TOOL_FRESH_LIMIT_DAYS: Partial<Record<string, number>> = { filings: 140 };

export function auditResult(r: ToolResult, now: number = Date.now()): Audit {
  const issues: string[] = [];
  const p = r.provenance;
  if (!p?.source?.en || !p.source.he) issues.push("source missing in one language");
  let stale = false;
  const limit = FRESH_LIMIT_DAYS[p.state] === null ? null : (TOOL_FRESH_LIMIT_DAYS[r.toolId] ?? FRESH_LIMIT_DAYS[p.state]);
  if (limit !== null) {
    const t = p.asOf ? Date.parse(p.asOf) : NaN;
    if (Number.isNaN(t)) issues.push("real-data state without a date");
    else if (now - t > limit * 86_400_000) { stale = true; issues.push(`data older than ${limit} days`); }
  }
  if (p.state === "synthetic" && r.trust !== "SIMULATION") issues.push("invented scenario not marked as simulation");
  if (r.trust === "SIMULATION" && p.state !== "synthetic") issues.push("simulation not marked as invented");
  return { issues, stale };
}

/** One outcome for a draft: contradicted beats partial beats limited. */
export function outcomeOf(opts: { claims: ClaimCheck[]; conflicts: number; badLinks: number; audits: Audit[]; missing: number }): Outcome {
  const numeric = opts.claims.filter((c) => c.label !== "no_numbers");
  if (opts.conflicts > 0) return "contradicted";
  if (numeric.length && numeric.every((c) => c.label === "unsupported")) return "unverifiable";
  if (numeric.some((c) => c.label !== "sourced") || opts.badLinks > 0) return "partial";
  if (opts.audits.some((a) => a.issues.length) || opts.missing > 0) return "verified_with_limits";
  return "verified";
}
export const OUTCOME_LINE: Record<Outcome, { en: string; he: string }> = {
  verified: { en: "Verification: every number and link traces to a source.", he: "אימות: כל מספר וקישור מתחקה למקור." },
  verified_with_limits: { en: "Verification: claims trace to sources, with limits noted (stale data, missing topics or provenance gaps).", he: "אימות: הטענות מתחקות למקורות, עם מגבלות שצוינו (נתונים ישנים, נושאים חסרים או פערי מקור)." },
  partial: { en: "Verification: partial. Some numbers do not appear together in a source, or a link is not from the sources.", he: "אימות: חלקי. חלק מהמספרים לא מופיעים יחד במקור, או שקישור אינו מהמקורות." },
  contradicted: { en: "Verification: the sources contradict each other on numbers.", he: "אימות: המקורות סותרים זה את זה במספרים." },
  unverifiable: { en: "Verification: none of the numbers could be matched to a source.", he: "אימות: אף מספר לא הותאם למקור." },
};

const ISSUE_TEXT: Array<{ re: RegExp; en: string; he: string }> = [
  { re: /older than/, en: "the data is older than the freshness limit", he: "הנתונים ישנים מגבול הטריות" },
  { re: /without a date/, en: "the data carries no date", he: "לנתונים אין תאריך" },
  { re: /source missing/, en: "the source is not named in both languages", he: "המקור לא מופיע בשתי השפות" },
  { re: /scenario|simulation/, en: "invented and real data are not kept apart", he: "נתונים מומצאים ואמיתיים לא מופרדים" },
];
/** One trace line about a live-data tool result: what the audit found, or that it passed. Bilingual, built from fixed text and the result's own date. */
export function dataCheckLine(r: ToolResult, now: number = Date.now()): { en: string; he: string } {
  const a = auditResult(r, now);
  const day = r.provenance.asOf?.slice(0, 10);
  if (!a.issues.length) return { en: `Data check passed: source named, dated${day ? ` (as of ${day})` : ""}, within the freshness limit.`, he: `בדיקת נתונים עברה: המקור מצוין, מתוארך${day ? ` (נכון ל-${day})` : ""} ובתוך גבול הטריות.` };
  const words = a.issues.map((i) => ISSUE_TEXT.find((t) => t.re.test(i)));
  return { en: `Data check found: ${words.map((w) => w?.en ?? "an unexplained issue").join("; ")}.`, he: `בדיקת נתונים מצאה: ${words.map((w) => w?.he ?? "בעיה לא מוסברת").join("; ")}.` };
}
