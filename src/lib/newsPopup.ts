/** Breaking-news popup rules. Importance is a fixed headline rule, never a model opinion. Headlines and links only. */
export interface PopupNews { id: string; title: string; url: string; source: string; publishedAt: string; eventType: string; symbols: string[] }
const MAJOR_TYPES = new Set(["earnings", "guidance", "merger_acquisition", "regulatory", "management_change"]);
const BOARD = /board of directors|board meeting|shareholder meeting|annual meeting|\bAGM\b|דירקטוריון|אסיפת בעלי מניות/i;
export const MAX_AGE_MS = 3 * 60 * 60 * 1000;
export const MIN_GAP_MS = 30 * 60 * 1000;
export const MAX_PER_DAY = 3;

export function isMajor(n: PopupNews, now: number): boolean {
  const age = now - Date.parse(n.publishedAt);
  if (!Number.isFinite(age) || age < -5 * 60 * 1000 || age > MAX_AGE_MS) return false;
  if (!/^https?:\/\//.test(n.url) || !n.title.trim()) return false;
  const watched = n.symbols.length > 0;
  return (watched && MAJOR_TYPES.has(n.eventType)) || BOARD.test(n.title);
}
export interface PopupState { seen: string[]; lastShownAt: number; dayKey: string; shownToday: number; off: boolean }
export const emptyState = (): PopupState => ({ seen: [], lastShownAt: 0, dayKey: "", shownToday: 0, off: false });
const KEY = "invested.newsPopup.v1";
export function loadState(store: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage): PopupState {
  try { const raw = store?.getItem(KEY); return raw ? { ...emptyState(), ...(JSON.parse(raw) as Partial<PopupState>) } : emptyState(); } catch { return emptyState(); }
}
export function saveState(s: PopupState, store: Pick<Storage, "setItem"> | null = typeof localStorage === "undefined" ? null : localStorage): void {
  try { store?.setItem(KEY, JSON.stringify({ ...s, seen: s.seen.slice(-50) })); } catch { /* not remembered */ }
}
/** The one story worth a popup right now, or null (off, too soon, daily cap reached, nothing major or already seen). */
export function pickPopup(items: PopupNews[], now: number, dayKey: string, state: PopupState): PopupNews | null {
  if (state.off) return null;
  if (now - state.lastShownAt < MIN_GAP_MS) return null;
  if (state.dayKey === dayKey && state.shownToday >= MAX_PER_DAY) return null;
  return items.filter((n) => isMajor(n, now) && !state.seen.includes(n.id)).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0] ?? null;
}
export function markShown(state: PopupState, id: string, now: number, dayKey: string): PopupState {
  return { ...state, seen: [...state.seen, id], lastShownAt: now, dayKey, shownToday: state.dayKey === dayKey ? state.shownToday + 1 : 1 };
}
export function normalizePopupNews(body: unknown): PopupNews[] {
  const items = (body as { items?: unknown[] } | null)?.items;
  if (!Array.isArray(items)) return [];
  return (items as Record<string, unknown>[]).flatMap((i) => typeof i?.id === "string" && typeof i.title === "string" && typeof i.url === "string" && typeof i.source === "string" && typeof i.publishedAt === "string"
    ? [{ id: i.id, title: i.title, url: i.url, source: i.source, publishedAt: i.publishedAt, eventType: typeof i.eventType === "string" ? i.eventType : "unknown", symbols: Array.isArray(i.symbols) ? i.symbols.filter((x): x is string => typeof x === "string") : [] }] : []);
}
