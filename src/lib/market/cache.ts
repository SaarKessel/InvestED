// ---------------------------------------------------------------------------
// InvestED — Market Data Cache (Phase 4)
//
// Generic in-process TTL cache. Used three times with different TTLs:
//
// - quote cache (short TTL, e.g. 60s): prices move, providers rate-limit
// - history cache (long TTL, e.g. 6h): historical series barely change
// - client response cache (short TTL): so React re-renders never hit
//   the network
//
// In-process means per serverless warm instance on Vercel (no Redis or
// external infrastructure, per the Phase 4 scope). This is deliberate:
// correctness does not depend on the cache — every miss simply costs a
// provider request.
// ---------------------------------------------------------------------------

export interface TtlCacheConfig {
  ttlMs: number;
  now?: () => number;
  /** Upper bound on entries; oldest entries are evicted first. */
  maxEntries?: number;
}

interface CacheEntry<T> {
  value: T;
  storedAt: number;
}

export interface TtlCache<T> {
  /** Returns the value only while it is fresh; expired entries count as missing. */
  get(key: string): T | null;
  set(key: string, value: T): void;
  /** True only while the entry is fresh. */
  has(key: string): boolean;
  delete(key: string): void;
  clear(): void;
  readonly size: number;
  /** Age of a fresh entry in ms; null when missing or expired. */
  ageMs(key: string): number | null;
}

export function createTtlCache<T>(config: TtlCacheConfig): TtlCache<T> {
  const entries = new Map<string, CacheEntry<T>>();
  const now = config.now ?? (() => Date.now());
  const maxEntries = config.maxEntries ?? 500;

  function freshEntry(key: string): CacheEntry<T> | null {
    const entry = entries.get(key);
    if (!entry) return null;
    if (now() - entry.storedAt > config.ttlMs) {
      entries.delete(key);
      return null;
    }
    return entry;
  }

  return {
    get(key) {
      return freshEntry(key)?.value ?? null;
    },
    set(key, value) {
      // Refresh insertion order so eviction drops the oldest entry.
      entries.delete(key);
      entries.set(key, { value, storedAt: now() });
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next();
        if (oldest.done) break;
        entries.delete(oldest.value);
      }
    },
    has(key) {
      return freshEntry(key) !== null;
    },
    delete(key) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    },
    ageMs(key) {
      const entry = freshEntry(key);
      return entry ? now() - entry.storedAt : null;
    },
  };
}
