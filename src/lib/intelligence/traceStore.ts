/** Observability: a small on-device log of how each question was answered (route, tools, timing, checks). Questions are never stored, only a short hash, so nothing personal is kept. */
export interface TraceEntry { at: number; route: string; tools: string[]; ms: number; ok: boolean; failedChecks: string[]; /** short hash of the question, to spot repeats */ q: string; live: "live" | "cached" | "unavailable" | "none" }
const KEY = "invested.traces.v1";
export const MAX_TRACES = 200;
type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const ls = (): Store | null => (typeof localStorage === "undefined" ? null : localStorage);
export const hashQuestion = (q: string): string => { let h = 5381; for (const c of q.trim().toLowerCase()) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return (h >>> 0).toString(36); };
export function loadTraces(store: Store | null = ls()): TraceEntry[] {
  try { const v = JSON.parse(store?.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter((x): x is TraceEntry => typeof x?.route === "string" && typeof x.at === "number") : []; } catch { return []; }
}
export function recordTrace(e: Omit<TraceEntry, "q"> & { question: string }, store: Store | null = ls()): TraceEntry[] {
  const { question, ...rest } = e;
  const next = [...loadTraces(store), { ...rest, q: hashQuestion(question) }].slice(-MAX_TRACES);
  try { store?.setItem(KEY, JSON.stringify(next)); } catch { /* not remembered */ }
  return next;
}
export const clearTraces = (store: Store | null = ls()): void => { try { store?.removeItem(KEY); } catch { /* nothing to clear */ } };
const pct = (sorted: number[], p: number) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0);
export function summarize(list: TraceEntry[]) {
  const ms = list.map((t) => t.ms).sort((a, b) => a - b);
  const byRoute: Record<string, number> = {}; const failures: Record<string, number> = {};
  for (const t of list) { byRoute[t.route] = (byRoute[t.route] ?? 0) + 1; for (const f of t.failedChecks) failures[f] = (failures[f] ?? 0) + 1; }
  return { count: list.length, okRate: list.length ? list.filter((t) => t.ok).length / list.length : null, p50: pct(ms, 0.5), p95: pct(ms, 0.95), byRoute, failures };
}
