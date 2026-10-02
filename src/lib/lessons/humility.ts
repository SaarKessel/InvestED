/** Humility mode + circuit-breaker lesson. Math only; thresholds are the learner's own, never recommended. */
export interface ResolvedPrediction { resolvedAt: string; hit: boolean }
export const HUMILITY_STREAK = 3;

/** Number of misses in a row at the end of the history, ordered by resolvedAt (ties keep input order). */
export function trailingMisses(history: ResolvedPrediction[]): number {
  const ordered = history
    .map((p, i) => ({ p, i, t: Date.parse(p.resolvedAt) }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t || a.i - b.i);
  let n = 0;
  for (let k = ordered.length - 1; k >= 0 && !ordered[k].p.hit; k--) n++;
  return n;
}
export const shouldShowHumility = (history: ResolvedPrediction[]) => trailingMisses(history) >= HUMILITY_STREAK;

export interface BreakerResult { tripped: boolean; trippedAtIndex: number | null; drawdownPct: number | null; peak: number | null }
/** First point where the equity falls at least `limitPct` below its running peak. Equity values must be positive finite numbers. */
export function circuitBreaker(equity: number[], limitPct: number): BreakerResult | null {
  if (!Array.isArray(equity) || equity.length < 2 || !equity.every((v) => Number.isFinite(v) && v > 0)) return null;
  if (!Number.isFinite(limitPct) || limitPct <= 0 || limitPct >= 100) return null;
  let peak = equity[0];
  for (let i = 0; i < equity.length; i++) {
    peak = Math.max(peak, equity[i]);
    const dd = ((peak - equity[i]) / peak) * 100;
    if (dd >= limitPct) return { tripped: true, trippedAtIndex: i, drawdownPct: Number(dd.toFixed(2)), peak };
  }
  return { tripped: false, trippedAtIndex: null, drawdownPct: null, peak };
}
