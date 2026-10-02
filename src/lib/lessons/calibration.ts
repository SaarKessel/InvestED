/** Calibration lesson: Brier score and reliability bins. Math only - no data source, no advice. */
export interface ResolvedForecast { probability: number; outcome: 0 | 1 }
export interface CalibrationBin { from: number; to: number; count: number; meanForecast: number; observedRate: number }
export interface CalibrationResult {
  count: number;
  brier: number;
  /** Brier score of always saying 50%. Always 0.25. */
  coinFlipBrier: number;
  bins: CalibrationBin[];
  verdict: "better_than_coin_flip" | "same_as_coin_flip" | "worse_than_coin_flip";
}
export const MIN_FORECASTS = 5;

export const isForecast = (f: unknown): f is ResolvedForecast => {
  if (!f || typeof f !== "object") return false;
  const x = f as ResolvedForecast;
  return Number.isFinite(x.probability) && x.probability >= 0 && x.probability <= 1 && (x.outcome === 0 || x.outcome === 1);
};

/** Returns null when there are fewer than MIN_FORECASTS valid forecasts: a score from 2 guesses teaches nothing. */
export function calibrate(forecasts: unknown[], binCount = 5): CalibrationResult | null {
  const valid = forecasts.filter(isForecast);
  if (valid.length !== forecasts.length || valid.length < MIN_FORECASTS) return null;
  const brier = valid.reduce((s, f) => s + (f.probability - f.outcome) ** 2, 0) / valid.length;
  const bins: CalibrationBin[] = [];
  for (let i = 0; i < binCount; i++) {
    const from = i / binCount;
    const to = (i + 1) / binCount;
    const inBin = valid.filter((f) => f.probability >= from && (i === binCount - 1 ? f.probability <= to : f.probability < to));
    if (inBin.length === 0) continue;
    bins.push({
      from, to, count: inBin.length,
      meanForecast: inBin.reduce((s, f) => s + f.probability, 0) / inBin.length,
      observedRate: inBin.reduce((s, f) => s + f.outcome, 0) / inBin.length,
    });
  }
  const rounded = Number(brier.toFixed(6));
  const verdict = rounded < 0.25 ? "better_than_coin_flip" : rounded > 0.25 ? "worse_than_coin_flip" : "same_as_coin_flip";
  return { count: valid.length, brier: rounded, coinFlipBrier: 0.25, bins, verdict };
}
