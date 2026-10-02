/** Self-critique and cross-check: fixed rules that grade a draft answer against the sources it was built from. No model. A failed check is reported, never hidden, and never repaired by inventing text. */
import { numbersIn, verifyNumbers } from "./verificationEngine";

export interface Bi { en: string; he: string }
export type CheckId = "numbers" | "advice" | "guarantee" | "language" | "empty" | "missing" | "conflict";
export interface Check { id: CheckId; ok: boolean; note: Bi }
export interface Source { label: string; text: string }
export interface Critique { ok: boolean; checks: Check[]; failed: Check[] }

const ADVICE = /\b(?:you\s+(?:should|must|need\s+to)\s+(?:buy|sell|invest|short)|i\s+recommend\s+(?:buying|selling)|buy\s+now|sell\s+now)\b|(?:כדאי\s+לך\s+(?:לקנות|למכור)|אני\s+ממליץ\s+(?:לקנות|למכור)|קנה\s+עכשיו|מכור\s+עכשיו)/i;
const GUARANTEE = /\b(?:guaranteed?\s+(?:returns?|profit|gains?)|risk[- ]free\s+(?:returns?|profit)|can(?:no|')t\s+lose|sure\s+(?:thing|profit))\b|(?:רווח\s+מובטח|תשואה\s+מובטחת|בלי\s+סיכון|אי\s+אפשר\s+להפסיד)/i;
const HE = /[א-ת]/g;
const LAT = /[A-Za-z]/g;
const share = (text: string, re: RegExp) => { const total = (text.match(HE)?.length ?? 0) + (text.match(LAT)?.length ?? 0); return total ? (text.match(re)?.length ?? 0) / total : 0; };

/** Same label stated twice with different numbers: reported as a conflict between sources. */
export function findConflicts(sources: Source[]): Array<{ label: string; a: string[]; b: string[] }> {
  const seen = new Map<string, string[]>();
  const out: Array<{ label: string; a: string[]; b: string[] }> = [];
  for (const s of sources) {
    const nums = [...new Set(numbersIn(s.text))].sort();
    const prev = seen.get(s.label);
    if (prev && nums.length && prev.length && prev.join("|") !== nums.join("|")) out.push({ label: s.label, a: prev, b: nums });
    else if (!prev) seen.set(s.label, nums);
  }
  return out;
}

export function critique(draft: string, opts: { sources: Source[]; lang: "he" | "en"; missingTopics?: string[] }): Critique {
  const checks: Check[] = [];
  const add = (id: CheckId, ok: boolean, en: string, he: string) => checks.push({ id, ok, note: { en, he } });
  const trimmed = draft.trim();
  add("empty", trimmed.length > 0, "The answer has text.", "בתשובה יש טקסט.");
  const v = verifyNumbers(trimmed, opts.sources.map((s) => s.text));
  add("numbers", v.ok, v.ok ? "Every number in the answer appears in a source." : `Numbers not found in any source: ${v.unsupported.join(", ")}.`, v.ok ? "כל מספר בתשובה מופיע במקור." : `מספרים שלא נמצאו באף מקור: ${v.unsupported.join(", ")}.`);
  add("advice", !ADVICE.test(trimmed), "No personal buy or sell instruction.", "אין הוראת קנייה או מכירה אישית.");
  add("guarantee", !GUARANTEE.test(trimmed), "No promise of guaranteed returns.", "אין הבטחה לתשואה מובטחת.");
  const wrong = opts.lang === "he" ? share(trimmed, LAT) : share(trimmed, HE);
  add("language", wrong < 0.3, "The answer is mostly in the language of the question.", "התשובה ברובה בשפת השאלה.");
  const missing = opts.missingTopics ?? [];
  add("missing", missing.length === 0, missing.length ? `No stored explanation yet for: ${missing.join(", ")}.` : "Every named topic has a stored explanation.", missing.length ? `אין עדיין הסבר שמור עבור: ${missing.join(", ")}.` : "לכל נושא שהוזכר יש הסבר שמור.");
  const conflicts = findConflicts(opts.sources);
  add("conflict", conflicts.length === 0, conflicts.length ? `Sources disagree on numbers for: ${conflicts.map((c) => c.label).join(", ")}.` : "No conflicting numbers between sources.", conflicts.length ? `המקורות סותרים במספרים עבור: ${conflicts.map((c) => c.label).join(", ")}.` : "אין מספרים סותרים בין המקורות.");
  const failed = checks.filter((c) => !c.ok);
  return { ok: failed.length === 0, checks, failed };
}
