// ---------------------------------------------------------------------------
// InvestED — Technical Indicators (Phase 4)
//
// Pure calculations over market history. This module is the boundary
// between provider logic (fetching/normalizing data) and indicator
// math: providers never compute indicators, and indicators never know
// where the history came from. The RSI and volatility implementations
// are the existing Phase 3C ones, moved here unchanged so existing
// behavior is preserved.
// ---------------------------------------------------------------------------

import type { CandleDatum } from "../../types/index";

export function calculateVolatility(history: CandleDatum[]): number {
  const returns = history.slice(1).map((point, index) => {
    const previous = history[index].close || history[index].price;
    const current = point.close || point.price;
    return previous > 0 ? (current - previous) / previous : 0;
  });
  if (returns.length === 0) return 0;
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return Math.round(Math.sqrt(variance) * 10000) / 100;
}

export function calculateRsi(history: CandleDatum[]): number | null {
  const changes = history.slice(1).map((point, index) => {
    const previous = history[index].close || history[index].price;
    const current = point.close || point.price;
    return current - previous;
  }).slice(-14);
  if (changes.length === 0) return null;
  const gains = changes.reduce((sum, value) => sum + Math.max(value, 0), 0) / changes.length;
  const losses = changes.reduce((sum, value) => sum + Math.max(-value, 0), 0) / changes.length;
  if (losses === 0) return gains === 0 ? 50 : 100;
  return Math.round((100 - 100 / (1 + gains / losses)) * 100) / 100;
}
