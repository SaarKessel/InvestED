// ---------------------------------------------------------------------------
// InvestED — Market Data Freshness (Phase 4)
//
// Truthful freshness classification. Freshness is always derived from
// real timestamps: the provider's own data timestamp when it supplies
// one, otherwise the time we fetched the data. It is never fabricated.
// "Live" is never used: the free provider tiers InvestED relies on
// serve delayed/end-of-day data, so the strongest honest label is
// "current" (latest available, minutes old).
// ---------------------------------------------------------------------------

import type { MarketDataFreshness, MarketDataSource } from "../../types/index.js";

/** ≤ this age, real provider data counts as "current" (latest available). */
export const CURRENT_THRESHOLD_MS = 15 * 60 * 1000;

/** ≤ this age, real provider data counts as "recent" (covers closed markets/weekends). */
export const RECENT_THRESHOLD_MS = 96 * 60 * 60 * 1000;

export interface FreshnessInput {
  dataSource: MarketDataSource;
  /** Provider timestamp for the data (ISO), when the provider supplies one. */
  timestamp?: string | null;
  /** When the data was fetched, used only when no provider timestamp exists. */
  fetchedAt?: number | null;
  now?: () => number;
}

export function computeFreshness(input: FreshnessInput): MarketDataFreshness {
  if (input.dataSource === "mock") return "simulated";

  const referenceMs = input.timestamp
    ? Date.parse(input.timestamp)
    : input.fetchedAt ?? null;

  if (referenceMs === null || !Number.isFinite(referenceMs)) {
    // Real provider data with no usable timestamp cannot be called
    // current or recent; "recent" would be a claim we cannot verify.
    return "stale";
  }

  const now = input.now ? input.now() : Date.now();
  const age = now - referenceMs;
  if (age < 0) return "current"; // clock skew: newest possible reading
  if (age <= CURRENT_THRESHOLD_MS) return "current";
  if (age <= RECENT_THRESHOLD_MS) return "recent";
  return "stale";
}
