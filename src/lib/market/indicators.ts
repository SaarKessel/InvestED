// Pure deterministic technical calculations. Providers only retrieve/normalize data.
import type { CandleDatum } from "../../types/index";

const closes = (history: CandleDatum[]) => history.map((point) => point.close || point.price).filter(Number.isFinite);
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

export function calculateVolatility(history: CandleDatum[]): number {
  const values = closes(history);
  if (values.length < 2) return 0;
  const returns = values.slice(1).map((value, index) => values[index] > 0 ? (value - values[index]) / values[index] : 0);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return round(Math.sqrt(variance) * 100);
}

export function calculateRsi(history: CandleDatum[], period = 14): number | null {
  const values = closes(history);
  if (values.length < period + 1) return null;
  const changes = values.slice(-(period + 1)).slice(1).map((value, index) => value - values.slice(-(period + 1))[index]);
  const gains = changes.reduce((sum, value) => sum + Math.max(value, 0), 0) / period;
  const losses = changes.reduce((sum, value) => sum + Math.max(-value, 0), 0) / period;
  if (losses === 0) return gains === 0 ? 50 : 100;
  return round(100 - 100 / (1 + gains / losses));
}

export function calculateSma(history: CandleDatum[], period: number): number | null {
  const values = closes(history);
  if (period <= 0 || values.length < period) return null;
  return round(values.slice(-period).reduce((sum, value) => sum + value, 0) / period);
}

export function calculateEma(history: CandleDatum[], period: number): number | null {
  const values = closes(history);
  if (period <= 0 || values.length < period) return null;
  const multiplier = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (const value of values.slice(period)) ema = value * multiplier + ema * (1 - multiplier);
  return round(ema);
}

export interface MacdResult { macd: number; signal: number; histogram: number }
export function calculateMacd(history: CandleDatum[], fast = 12, slow = 26, signalPeriod = 9): MacdResult | null {
  const values = closes(history);
  if (values.length < slow + signalPeriod - 1) return null;
  const emaSeries = (period: number) => {
    const multiplier = 2 / (period + 1); let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const output: Array<number | null> = Array(period - 1).fill(null); output.push(ema);
    for (const value of values.slice(period)) { ema = value * multiplier + ema * (1 - multiplier); output.push(ema); }
    return output;
  };
  const fastSeries = emaSeries(fast), slowSeries = emaSeries(slow);
  const macdSeries = values.map((_, index) => fastSeries[index] !== null && slowSeries[index] !== null ? fastSeries[index]! - slowSeries[index]! : null).filter((v): v is number => v !== null);
  if (macdSeries.length < signalPeriod) return null;
  const multiplier = 2 / (signalPeriod + 1); let signal = macdSeries.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
  for (const value of macdSeries.slice(signalPeriod)) signal = value * multiplier + signal * (1 - multiplier);
  const macd = macdSeries.at(-1)!;
  return { macd: round(macd), signal: round(signal), histogram: round(macd - signal) };
}
