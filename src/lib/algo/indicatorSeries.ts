// Indicator SERIES (one value per bar) for the educational rule builder.
//
// Engine: trading-signals (MIT, bennycode/trading-signals, zero-dependency TS).
// The older src/lib/market/indicators.ts only returns the LAST value of an
// indicator for quotes and chat cards; it stays as is. Series are new,
// not a second copy of those functions. RSI here uses Wilder smoothing (the
// textbook definition), so it can differ slightly from the simple-average RSI
// in market/indicators.ts.
//
// Real history only: invalid closes are dropped by cleanSeries (never filled).
// A value is null until the indicator has enough bars to be stable.
// Educational simulation, not advice.

import { EMA, MACD, RSI, SMA } from "trading-signals";
import type { CandleDatum } from "../../types/index.js";
import { cleanSeries, type PricePoint } from "../backtest/performance.js";

export interface MacdPoint {
  macd: number;
  signal: number;
  histogram: number;
}

export interface Bars {
  points: PricePoint[];
  droppedPoints: number;
}

export function toBars(history: ReadonlyArray<Pick<CandleDatum, "date" | "close">>): Bars {
  const clean = cleanSeries(history);
  return { points: clean.points, droppedPoints: clean.quality.inputPoints - clean.quality.usedPoints };
}

function positive(period: number, name: string): void {
  if (!Number.isInteger(period) || period < 1) throw new RangeError(`${name} must be a whole number of at least 1`);
}

export function rsiSeries(points: PricePoint[], period = 14): Array<number | null> {
  positive(period, "RSI period");
  const rsi = new RSI(period);
  return points.map((p) => {
    rsi.add(p.close);
    return rsi.isStable ? Number(rsi.getResult()) : null;
  });
}

export function smaSeries(points: PricePoint[], period: number): Array<number | null> {
  positive(period, "SMA period");
  const sma = new SMA(period);
  return points.map((p) => {
    sma.add(p.close);
    return sma.isStable ? Number(sma.getResult()) : null;
  });
}

export function emaSeries(points: PricePoint[], period: number): Array<number | null> {
  positive(period, "EMA period");
  const ema = new EMA(period);
  return points.map((p) => {
    ema.add(p.close);
    return ema.isStable ? Number(ema.getResult()) : null;
  });
}

export function macdSeries(points: PricePoint[], fast = 12, slow = 26, signal = 9): Array<MacdPoint | null> {
  positive(fast, "MACD fast");
  positive(slow, "MACD slow");
  positive(signal, "MACD signal");
  if (fast >= slow) throw new RangeError("MACD fast period must be shorter than the slow period");
  const macd = new MACD(new EMA(fast), new EMA(slow), new EMA(signal));
  return points.map((p) => {
    macd.add(p.close);
    const r = macd.isStable ? macd.getResult() : null;
    return r ? { macd: Number(r.macd), signal: Number(r.signal), histogram: Number(r.histogram) } : null;
  });
}
