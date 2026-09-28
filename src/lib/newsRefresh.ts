/** Refresh only on a reader's return to a visible tab, never by background polling. */
export function shouldRefreshNews(
  lastFetchedAt: string | null,
  nowMs: number,
  ttlSeconds: number,
): boolean {
  if (!lastFetchedAt) return true;
  const fetchedMs = Date.parse(lastFetchedAt);
  // An invalid or future timestamp cannot establish that the feed is fresh.
  if (!Number.isFinite(fetchedMs) || fetchedMs > nowMs) return true;
  return nowMs - fetchedMs >= Math.max(60, ttlSeconds) * 1000;
}
