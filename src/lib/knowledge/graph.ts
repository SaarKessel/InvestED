/** Knowledge graph foundation: read-only views over the concept registry's links. Pure functions, no stored copy of the data. */
import { allConcepts, getConcept, relatedConcepts, type ConceptEntry } from "./concepts/registry";

export interface GraphNode { id: string; en: string; he: string; category: ConceptEntry["category"]; hasText: boolean }
export interface GraphEdge { from: string; to: string }
const node = (c: ConceptEntry): GraphNode => ({ id: c.id, en: c.en, he: c.he, category: c.category, hasText: c.explain !== null });

/** Undirected neighbours (a link counts both ways). */
const neighbours = (id: string): string[] => relatedConcepts(id, 1000).map((c) => c.id);

/** Concepts within `depth` links of `id`, with the distance, nearest first. */
export function neighbourhood(id: string, depth = 2, limit = 30): Array<{ node: GraphNode; distance: number }> {
  const start = getConcept(id);
  if (!start) return [];
  const dist = new Map<string, number>([[id, 0]]);
  let frontier = [id];
  for (let d = 1; d <= depth; d++) {
    const next: string[] = [];
    for (const f of frontier) for (const n of neighbours(f)) if (!dist.has(n)) { dist.set(n, d); next.push(n); }
    frontier = next;
  }
  return [...dist.entries()].filter(([k]) => k !== id).sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).slice(0, limit)
    .map(([k, distance]) => ({ node: node(getConcept(k)!), distance }));
}

/** Shortest chain of concepts linking two ideas, or null when they are not connected. */
export function shortestPath(from: string, to: string): GraphNode[] | null {
  if (!getConcept(from) || !getConcept(to)) return null;
  const prev = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const n of neighbours(cur)) if (!prev.has(n)) { prev.set(n, cur); queue.push(n); }
  }
  if (!prev.has(to)) return null;
  const path: string[] = [];
  for (let at: string | null = to; at; at = prev.get(at) ?? null) path.unshift(at);
  return path.map((id) => node(getConcept(id)!));
}

/** Whole-graph facts for a knowledge map: counts per category, concepts with no links, and links that point at nothing. */
export function graphStats() {
  const all = allConcepts();
  const ids = new Set(all.map((c) => c.id));
  const byCategory: Record<string, number> = {};
  for (const c of all) byCategory[c.category] = (byCategory[c.category] ?? 0) + 1;
  const isolated = all.filter((c) => neighbours(c.id).length === 0).map((c) => c.id);
  const brokenLinks: GraphEdge[] = all.flatMap((c) => c.related.filter((r) => !ids.has(r)).map((to) => ({ from: c.id, to })));
  return { nodes: all.length, withText: all.filter((c) => c.explain !== null).length, byCategory, isolated, brokenLinks };
}
