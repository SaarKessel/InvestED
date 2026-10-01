/** Four tracks of the InvestED pipeline. All four tracks are selectable. BASIC is the plain answer; deeper tracks chain more fixed passes (see depth.ts). */
export type Level = "basic" | "junior" | "senior" | "professional";
export interface LevelTrack { id: Level; available: boolean; /** engine passes: BASIC runs one pass and plain text; deeper tracks will chain more. */ depth: 1 | 2 | 3 | 4; /** speed profile: how long the optional AI rewording may take before the plain deterministic answer is shown instead. */ rewordBudgetMs: number }
export const LEVELS: LevelTrack[] = [
  { id: "basic", available: true, depth: 1, rewordBudgetMs: 5000 },
  { id: "junior", available: true, depth: 2, rewordBudgetMs: 8000 },
  { id: "senior", available: true, depth: 3, rewordBudgetMs: 10000 },
  { id: "professional", available: true, depth: 4, rewordBudgetMs: 14000 },
];
export const DEFAULT_LEVEL: Level = "basic";
const key = (userId: string | null | undefined) => `invested.level.${userId ?? "anon"}`;
export function isSelectable(level: string): level is Level { return LEVELS.some((l) => l.id === level && l.available); }
/** Stored choice for this user; anything unavailable or unknown falls back to BASIC. */
export function readLevel(userId: string | null | undefined, store: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): Level {
  try { const v = store?.getItem(key(userId)); return v && isSelectable(v) ? v : DEFAULT_LEVEL; } catch { return DEFAULT_LEVEL; }
}
export function saveLevel(userId: string | null | undefined, level: Level, store: Pick<Storage, "setItem"> | null = typeof localStorage === "undefined" ? null : localStorage): boolean {
  if (!isSelectable(level)) return false;
  try { store?.setItem(key(userId), level); return true; } catch { return false; }
}

/** The track in use right now. The chat sets it; the answer pipeline reads it for its speed budget. */
let active: Level = DEFAULT_LEVEL;
export const setActiveLevel = (l: Level) => { active = l; };
export const rewordBudgetMs = (l: Level = active): number => LEVELS.find((x) => x.id === l)?.rewordBudgetMs ?? 5000;
