// The InvestED+ concept registry: one place that knows every concept's names,
// aliases (he + en + abbreviations), category and neighbours. It points at the
// existing explanation text; it never holds numbers or market facts.
import { CONCEPT_DATA } from "./data";
import type { ConceptEntry } from "./types";

export type { ConceptEntry, ConceptCategory } from "./types";

const BY_ID = new Map<string, ConceptEntry>(CONCEPT_DATA.map((c) => [c.id, c]));

export function normalizeTerm(text: string): string {
  return text.toLowerCase().replace(/["'״׳`]/g, "").replace(/[^a-z0-9\u0590-\u05ff&/%+ ]+/g, " ").replace(/\s+/g, " ").trim();
}

interface Term { norm: string; id: string; }
const TERMS: Term[] = CONCEPT_DATA.flatMap((c) => [c.en, c.he, ...c.aliases].map((name) => ({ norm: normalizeTerm(name), id: c.id })))
  .filter((t) => t.norm.length >= 2)
  .sort((a, b) => b.norm.length - a.norm.length);

export function getConcept(id: string): ConceptEntry | undefined { return BY_ID.get(id); }
export function allConcepts(): ConceptEntry[] { return CONCEPT_DATA; }

/** Exact lookup by name or alias ("Sharpe", "יחס שארפ", "SPX"). */
export function findConcept(term: string): ConceptEntry | undefined {
  const n = normalizeTerm(term);
  const hit = TERMS.find((t) => t.norm === n);
  return hit ? BY_ID.get(hit.id) : undefined;
}

const LATIN = /^[a-z0-9]/;
function occurs(haystack: string, needle: string): boolean {
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) return false;
    const before = haystack[at - 1];
    const after = haystack[at + needle.length];
    const wordChar = (ch: string | undefined) => ch !== undefined && /[a-z0-9\u0590-\u05ff]/.test(ch);
    // Hebrew prefixes (ה, ב, ל, ו, מ, ש, כ) may attach to the front of a Hebrew term.
    const prefixOk = !wordChar(before) || (!LATIN.test(needle) && /[הבלומשכ]/.test(before ?? "") && !wordChar(haystack[at - 2]));
    if (prefixOk && !wordChar(after)) return true;
    from = at + 1;
  }
}

/** Every concept mentioned in free text, longest and most specific first, without duplicates. */
export function findConceptsInText(text: string, limit = 5): ConceptEntry[] {
  const hay = normalizeTerm(text);
  const found: string[] = [];
  let rest = hay;
  for (const t of TERMS) {
    if (found.includes(t.id) || !occurs(rest, t.norm)) continue;
    found.push(t.id);
    rest = rest.split(t.norm).join(" ");
    if (found.length >= limit) break;
  }
  return found.map((id) => BY_ID.get(id)!).filter(Boolean);
}

/** Neighbours in the concept graph (deterministic, no model). */
export function relatedConcepts(id: string, limit = 5): ConceptEntry[] {
  const c = BY_ID.get(id);
  if (!c) return [];
  const direct = c.related.map((r) => BY_ID.get(r)).filter((x): x is ConceptEntry => Boolean(x));
  const back = CONCEPT_DATA.filter((o) => o.related.includes(id) && !c.related.includes(o.id));
  return [...direct, ...back].slice(0, limit);
}

export function conceptName(c: ConceptEntry, language: "he" | "en"): string { return language === "he" ? c.he : c.en; }
