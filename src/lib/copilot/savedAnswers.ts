/** "Saved": answers the user bookmarked, kept on this device per user id. Stores the question and the text as shown; re-asking re-runs the engines. */
export interface SavedAnswer { id: string; question: string; text: string; savedAt: number }
const key = (userId: string) => `invested.saved.v1.${userId}`;
export const MAX_SAVED = 50;
type Store = Pick<Storage, "getItem" | "setItem">;
const ls = (): Store | null => (typeof localStorage === "undefined" ? null : localStorage);
export function loadSaved(userId: string, store: Store | null = ls()): SavedAnswer[] {
  try { const v = JSON.parse(store?.getItem(key(userId)) ?? "[]"); return Array.isArray(v) ? v.filter((x): x is SavedAnswer => typeof x?.id === "string" && typeof x.question === "string" && typeof x.text === "string") : []; } catch { return []; }
}
const write = (userId: string, list: SavedAnswer[], store: Store | null) => { try { store?.setItem(key(userId), JSON.stringify(list)); } catch { /* not remembered */ } };
export const idFor = (question: string, text: string): string => { let h = 5381; for (const c of `${question}\n${text}`) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return `s${(h >>> 0).toString(36)}`; };
export function isSaved(list: SavedAnswer[], question: string, text: string): boolean { return list.some((s) => s.id === idFor(question, text)); }
/** Toggles; returns the new list (newest first, capped). */
export function toggleSaved(userId: string, question: string, text: string, now = Date.now(), store: Store | null = ls()): SavedAnswer[] {
  const list = loadSaved(userId, store);
  const id = idFor(question, text);
  const next = list.some((s) => s.id === id) ? list.filter((s) => s.id !== id) : [{ id, question: question.slice(0, 300), text: text.slice(0, 4000), savedAt: now }, ...list].slice(0, MAX_SAVED);
  write(userId, next, store);
  return next;
}
export function removeSaved(userId: string, id: string, store: Store | null = ls()): SavedAnswer[] {
  const next = loadSaved(userId, store).filter((s) => s.id !== id); write(userId, next, store); return next;
}
