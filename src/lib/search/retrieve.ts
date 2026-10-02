/** Retrieval layer: ranks the stored explanations against a question with BM25 word matching. Runs on the device over text we already ship; no embeddings, no network, no key. A vector store can later sit behind the same function. */
import { allConcepts, normalizeTerm } from "@/lib/knowledge/concepts/registry";
import { conceptAnswerByLabel } from "@/lib/financialEducation";

export interface Passage { id: string; label: string; text: string; score: number }
interface Doc { id: string; en: string; he: string; text: { en: string; he: string }; tokens: Record<"en" | "he", string[]> }
const STOP = new Set("the and for are was what how why when who does did can you your about tell me this that with from have has not but today now please explain mean means מהי מהו מה איך למה מתי האם על של את זה זאת הוא היא יש אני אתה".split(" "));
const tok = (s: string) => normalizeTerm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w));
let cache: Doc[] | null = null;
function docs(): Doc[] {
  if (cache) return cache;
  cache = allConcepts().filter((c) => c.explain).map((c) => {
    const en = conceptAnswerByLabel(c.explain!, "en") ?? ""; const he = conceptAnswerByLabel(c.explain!, "he") ?? "";
    return { id: c.id, en: c.en, he: c.he, text: { en, he }, tokens: { en: tok(`${c.en} ${c.aliases.join(" ")} ${en}`), he: tok(`${c.he} ${c.aliases.join(" ")} ${he}`) } };
  }).filter((d) => d.text.en || d.text.he);
  return cache;
}
const K1 = 1.5, B = 0.75;
/** Top passages for a question, best first. Scores are relative, not probabilities. Returns nothing when no word matches. */
export function retrieve(question: string, lang: "he" | "en", limit = 3): Passage[] {
  const q = [...new Set(tok(question))];
  if (!q.length) return [];
  const all = docs().filter((d) => d.text[lang]);
  const avg = all.reduce((n, d) => n + d.tokens[lang].length, 0) / (all.length || 1);
  const df = new Map<string, number>();
  for (const w of q) df.set(w, all.filter((d) => d.tokens[lang].includes(w)).length);
  const out: Passage[] = [];
  for (const d of all) {
    const t = d.tokens[lang]; let score = 0; let matched = 0;
    for (const w of q) {
      const f = t.filter((x) => x === w).length;
      if (!f) continue; matched++;
      const n = df.get(w) ?? 0;
      score += Math.log(1 + (all.length - n + 0.5) / (n + 0.5)) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * t.length) / avg)));
    }
    if (score > 0 && (matched >= 2 || q.length === 1)) out.push({ id: d.id, label: lang === "he" ? d.he : d.en, text: d.text[lang], score });
  }
  return out.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}
