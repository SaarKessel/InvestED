/** Picks the saved notes that share a meaningful word with the question. Pure and deterministic; notes are shown verbatim, never rewritten. */
const words = (s: string) => (s.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? []).map((w) => w.replace(/^[הבלומשכ](?=[\p{L}]{4,})/u, ""));
const STOP = new Set(["what", "that", "this", "with", "have", "about", "from", "your", "מהו", "מהי", "איך", "למה", "האם", "זכור", "תזכור"]);

export function relevantNotes(question: string, notes: string[], max = 2): string[] {
  const q = new Set(words(question).filter((w) => !STOP.has(w)));
  if (q.size === 0) return [];
  return notes
    .map((n) => ({ n, score: words(n).filter((w) => q.has(w)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.n);
}

export const recallLine = (notes: string[], lang: "en" | "he"): string =>
  `${lang === "he" ? "מההערות ששמרת (מוצגות כפי שכתבת, לא משנות את התשובה):" : "From your saved notes (shown as you wrote them, they do not change the answer):"}\n${notes.map((n) => `- ${n}`).join("\n")}`;
