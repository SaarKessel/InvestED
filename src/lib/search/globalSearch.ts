/** Global search: one deterministic pass over the stored concepts, the site's pages and the user's saved answers. Matching only; nothing is generated and no network is used. */
import { allConcepts, normalizeTerm, type ConceptEntry } from "@/lib/knowledge/concepts/registry";
import { SITE_CAPABILITIES } from "@/lib/copilot/siteCapabilities";
import type { SavedAnswer } from "@/lib/copilot/savedAnswers";

export type SearchKind = "concept" | "page" | "saved";
export interface SearchHit { kind: SearchKind; id: string; label: string; /** score: higher is better */ score: number; /** page route, for kind "page" */ route?: string; /** question to put in the copilot, for concept and saved hits */ ask?: string; /** stored text excerpt for saved hits */ excerpt?: string }

const SCORE = { exact: 100, prefix: 70, word: 50, contains: 30 };
function scoreName(name: string, q: string): number {
  const n = normalizeTerm(name);
  if (!n) return 0;
  if (n === q) return SCORE.exact;
  if (n.startsWith(q)) return SCORE.prefix;
  if (n.split(" ").some((w) => w.startsWith(q))) return SCORE.word;
  return n.includes(q) ? SCORE.contains : 0;
}
const best = (names: string[], q: string) => Math.max(0, ...names.map((n) => scoreName(n, q)));

function conceptHit(c: ConceptEntry, q: string, he: boolean): SearchHit | null {
  const score = best([c.en, c.he, ...c.aliases], q);
  if (!score) return null;
  const label = he ? c.he : c.en;
  return { kind: "concept", id: c.id, label, score: score + (c.explain ? 5 : 0), ask: he ? `מה זה ${c.he}?` : `What is ${c.en}?` };
}

/** Results are sorted by score, then label, and capped. A query under 2 characters returns nothing. */
export function globalSearch(query: string, opts: { lang: "he" | "en"; saved?: SavedAnswer[]; limit?: number } = { lang: "en" }): SearchHit[] {
  const q = normalizeTerm(query);
  if (q.length < 2) return [];
  const he = opts.lang === "he";
  const hits: SearchHit[] = [];
  for (const c of allConcepts()) { const h = conceptHit(c, q, he); if (h) hits.push(h); }
  for (const p of SITE_CAPABILITIES) {
    const names = [...p.en, ...p.he];
    const score = best(names, q);
    if (score) hits.push({ kind: "page", id: p.id, label: (he ? p.he : p.en)[0], score, route: p.route });
  }
  for (const s of opts.saved ?? []) {
    const score = Math.max(scoreName(s.question, q), scoreName(s.text, q) ? SCORE.contains : 0);
    if (score) hits.push({ kind: "saved", id: s.id, label: s.question.slice(0, 80), score: score - 5, ask: s.question, excerpt: s.text.slice(0, 120) });
  }
  return hits.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label)).slice(0, opts.limit ?? 8);
}
