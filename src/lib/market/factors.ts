// ---------------------------------------------------------------------------
// InvestED - Classic price factors
//
// A small set of textbook price/volume factors, computed from real
// historical candles only. Every factor returns a Metric: either a
// computed value or "unavailable" with a reason. Insufficient history is
// never zero-filled or padded.
//
// Factor selection follows the alpha-factor idea in Vibe-Trading
// (https://github.com/HKUDS/Vibe-Trading, MIT License) and the candlestick
// factors of Microsoft Qlib's Alpha158 (https://github.com/microsoft/qlib,
// Apache License 2.0, see its NOTICE). The formulas are standard and were
// re-written from their definitions; no source code is copied.
//
// Educational descriptions of past price behavior, not signals or advice.
// ---------------------------------------------------------------------------

import type { CandleDatum } from "../../types/index.js";
import type { Metric } from "../backtest/performance.js";

type Candle = Pick<CandleDatum, "date" | "open" | "high" | "low" | "close"> & { volume?: number | null };

const ok = (value: number): Metric => ({ status: "computed", value: Number(value.toFixed(4)) });
const na = (reason: string): Metric => ({ status: "unavailable", reason });
const need = (have: number, want: number): Metric | null =>
  have < want ? na(`Need ${want} observations (have ${have})`) : null;

function valid(history: ReadonlyArray<Candle>): Candle[] {
  return [...history]
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((c) => Number.isFinite(c.close) && c.close > 0);
}

const hasOhlc = (c: Candle) =>
  [c.open, c.high, c.low].every((v) => Number.isFinite(v) && v > 0) && c.high >= c.low;

/** Rate of change over `n` periods: close / close[n ago] - 1. */
export function rateOfChange(history: ReadonlyArray<Candle>, n: number): Metric {
  const h = valid(history);
  return need(h.length, n + 1) ?? ok(h[h.length - 1].close / h[h.length - 1 - n].close - 1);
}

/** 12-1 momentum: return from 252 to 21 periods ago, skipping the latest month. Daily data only. */
export function momentum12m1(history: ReadonlyArray<Candle>): Metric {
  const h = valid(history);
  return need(h.length, 253) ?? ok(h[h.length - 22].close / h[h.length - 253].close - 1);
}

/** Short-term reversal: negative of the `n`-period return (default 5). */
export function shortTermReversal(history: ReadonlyArray<Candle>, n = 5): Metric {
  const r = rateOfChange(history, n);
  return r.status === "computed" ? ok(-r.value) : r;
}

/** Close relative to its n-period simple moving average: close / SMA - 1. */
export function priceToSma(history: ReadonlyArray<Candle>, n = 20): Metric {
  const h = valid(history);
  const short = need(h.length, n);
  if (short) return short;
  const sma = h.slice(-n).reduce((s, c) => s + c.close, 0) / n;
  return ok(h[h.length - 1].close / sma - 1);
}

export interface Bollinger {
  middle: number;
  upper: number;
  lower: number;
  /** Where the close sits in the band: 0 = lower band, 1 = upper band. */
  percentB: number | null;
  bandwidth: number;
}

/** Bollinger bands with population standard deviation (Bollinger's convention). */
export function bollinger(history: ReadonlyArray<Candle>, n = 20, k = 2): Metric<Bollinger> {
  const h = valid(history);
  if (h.length < n) return { status: "unavailable", reason: `Need ${n} observations (have ${h.length})` };
  const closes = h.slice(-n).map((c) => c.close);
  const mid = closes.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(closes.reduce((s, v) => s + (v - mid) ** 2, 0) / n);
  const upper = mid + k * sd;
  const lower = mid - k * sd;
  const last = closes[closes.length - 1];
  return {
    status: "computed",
    value: {
      middle: Number(mid.toFixed(4)),
      upper: Number(upper.toFixed(4)),
      lower: Number(lower.toFixed(4)),
      percentB: upper > lower ? Number(((last - lower) / (upper - lower)).toFixed(4)) : null,
      bandwidth: Number(((upper - lower) / mid).toFixed(4)),
    },
  };
}

/** Stochastic %K / Qlib-style RSV: (close - lowest low) / (highest high - lowest low) over n periods. Needs OHLC. */
export function rangePosition(history: ReadonlyArray<Candle>, n = 14): Metric {
  const h = valid(history);
  const short = need(h.length, n);
  if (short) return short;
  const window = h.slice(-n);
  if (!window.every(hasOhlc)) return na("Complete open/high/low data is not available");
  const hi = Math.max(...window.map((c) => c.high));
  const lo = Math.min(...window.map((c) => c.low));
  if (hi === lo) return na("Zero price range");
  return ok((window[window.length - 1].close - lo) / (hi - lo));
}

/** Average true range over n periods as a fraction of the latest close. Needs OHLC. */
export function atrPercent(history: ReadonlyArray<Candle>, n = 14): Metric {
  const h = valid(history);
  const short = need(h.length, n + 1);
  if (short) return short;
  const window = h.slice(-(n + 1));
  if (!window.every(hasOhlc)) return na("Complete open/high/low data is not available");
  let sum = 0;
  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1].close;
    sum += Math.max(window[i].high - window[i].low, Math.abs(window[i].high - prev), Math.abs(window[i].low - prev));
  }
  return ok(sum / n / window[window.length - 1].close);
}

/** Qlib "KMID": the latest candle body, (close - open) / open. Needs OHLC. */
export function candleBody(history: ReadonlyArray<Candle>): Metric {
  const h = valid(history);
  const last = h[h.length - 1];
  if (!last || !hasOhlc(last)) return na("Complete open/high/low data is not available");
  return ok((last.close - last.open) / last.open);
}

/** Latest volume relative to the trailing n-period average volume. */
export function volumeRatio(history: ReadonlyArray<Candle>, n = 20): Metric {
  const h = valid(history);
  const short = need(h.length, n + 1);
  if (short) return short;
  const window = h.slice(-(n + 1));
  if (!window.every((c) => Number.isFinite(c.volume) && (c.volume as number) > 0)) return na("Volume data is not available");
  const avg = window.slice(0, n).reduce((s, c) => s + (c.volume as number), 0) / n;
  return ok((window[n].volume as number) / avg);
}

export interface FactorSnapshot {
  rateOfChange20: Metric;
  momentum12m1: Metric;
  shortTermReversal5: Metric;
  priceToSma20: Metric;
  bollinger20: Metric<Bollinger>;
  rangePosition14: Metric;
  atrPercent14: Metric;
  candleBody: Metric;
  volumeRatio20: Metric;
  historicalOnly: true;
}

export function computeFactors(history: ReadonlyArray<Candle>): FactorSnapshot {
  return {
    rateOfChange20: rateOfChange(history, 20),
    momentum12m1: momentum12m1(history),
    shortTermReversal5: shortTermReversal(history, 5),
    priceToSma20: priceToSma(history, 20),
    bollinger20: bollinger(history, 20),
    rangePosition14: rangePosition(history, 14),
    atrPercent14: atrPercent(history, 14),
    candleBody: candleBody(history),
    volumeRatio20: volumeRatio(history, 20),
    historicalOnly: true,
  };
}
