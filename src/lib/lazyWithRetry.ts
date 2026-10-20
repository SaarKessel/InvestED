import { lazy as reactLazy, type ComponentType, type LazyExoticComponent } from "react";

export const CHUNK_RELOAD_GUARD_MS = 15_000;
const RELOAD_KEY = "invested_chunk_reload_at";

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Loading chunk [\w-]+ failed|ChunkLoadError|Importing a module script failed|error loading dynamically imported module/i;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return CHUNK_ERROR_PATTERN.test(message);
}

export function shouldReloadForChunkError(error: unknown, now: number, lastReloadAt: number): boolean {
  return isChunkLoadError(error) && now - lastReloadAt > CHUNK_RELOAD_GUARD_MS;
}

/**
 * React.lazy with one automatic recovery from stale-chunk failures.
 *
 * After a redeploy the previous hashed chunks are gone, so a session that
 * started on the old build cannot fetch a lazy route's chunk. Instead of
 * dropping the user on the error boundary, reload once to pick up the new
 * build. A sessionStorage timestamp guards against reload loops when the
 * failure is not deploy-related.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return reactLazy(async () => {
    try {
      return await factory();
    } catch (error) {
      let lastReloadAt = 0;
      try {
        lastReloadAt = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
      } catch {
        // sessionStorage unavailable (private mode) - treat as no prior reload.
      }
      if (shouldReloadForChunkError(error, Date.now(), lastReloadAt)) {
        try {
          sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        } catch {
          // Best effort only; the reload itself is the recovery.
        }
        window.location.reload();
        // Keep Suspense pending while the page reloads.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}
