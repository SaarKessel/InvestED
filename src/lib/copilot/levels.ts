/** Four tracks of the InvestED pipeline. Only BASIC is live; the others are visible but not selectable yet. */
export type Level = "basic" | "junior" | "senior" | "professional";
export interface LevelTrack { id: Level; available: boolean; /** engine passes: BASIC runs one pass and plain text; deeper tracks will chain more. */ depth: 1 | 2 | 3 | 4 }
export const LEVELS: LevelTrack[] = [
  { id: "basic", available: true, depth: 1 },
  { id: "junior", available: false, depth: 2 },
  { id: "senior", available: false, depth: 3 },
  { id: "professional", available: false, depth: 4 },
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
