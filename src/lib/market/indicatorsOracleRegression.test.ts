// Added after mutation testing: market/indicators.ts had only smoke assertions.
// Expected values were computed independently (Python, textbook formulas):
//  - volatility: population stdev of simple returns, in percent
//  - RSI: simple (Cutler) averages of gains/losses over the last `period` changes
//  - EMA: seeded with the SMA of the first `period` values, k = 2/(period+1)
//  - MACD: EMA(fast)-EMA(slow); signal = EMA of the MACD series seeded the same way
import { describe, expect, it } from "vitest";
import { calculateEma, calculateMacd, calculateRsi, calculateSma, calculateVolatility } from "./indicators";

const h = (values: number[]) => values.map((close, i) => ({ date: `d${i}`, open: close, high: close, low: close, close, price: close, volume: 1 }));
const r4 = (x: number) => Number(x.toFixed(4));
const A = h(Array.from({ length: 60 }, (_, i) => r4(100 + 10 * Math.sin(i / 4) + 0.3 * i)));
const B = h(Array.from({ length: 45 }, (_, i) => r4(100 + 8 * Math.sin(i / 3))));

describe("market indicators against independent computations", () => {
  it("volatility", () => {
    expect(calculateVolatility(A)).toBe(1.6);
    expect(calculateVolatility(B)).toBe(1.84);
    expect(calculateVolatility(h([100]))).toBe(0);
    expect(calculateVolatility(h([100, 110]))).toBe(0); // one return, zero spread
    expect(calculateVolatility(h([100, 110, 99]))).toBe(10); // returns +10% and -10%
  });
  it("RSI", () => {
    expect(calculateRsi(A)).toBe(95.26);
    expect(calculateRsi(B)).toBe(77.33);
    expect(calculateRsi(B, 5)).toBe(81.73);
    expect(calculateRsi(h(Array.from({ length: 15 }, (_, i) => 100 - i)))).toBe(0);
    expect(calculateRsi(h(Array(14).fill(5)))).toBeNull(); // needs period+1 points
    expect(calculateRsi(h(Array(15).fill(5)))).toBe(50);
  });
  it("SMA", () => {
    expect(calculateSma(A, 20)).toBe(114.39);
    expect(calculateSma(A, 5)).toBe(126.43);
    expect(calculateSma(B, 7)).toBe(105.65);
    expect(calculateSma(h([1, 2, 3]), 3)).toBe(2);
    expect(calculateSma(h([1, 2, 3]), 4)).toBeNull();
    expect(calculateSma(h([1, 2, 3]), 0)).toBeNull();
    expect(calculateSma(h([1, 2, 3]), -1)).toBeNull();
  });
  it("EMA", () => {
    expect(calculateEma(A, 10)).toBe(122.55);
    expect(calculateEma(A, 20)).toBe(118.26);
    expect(calculateEma(B, 7)).toBe(105.17);
    expect(calculateEma(h([1, 2, 3]), 3)).toBe(2);
    expect(calculateEma(h([1, 2, 3]), 4)).toBeNull();
    expect(calculateEma(h([1, 2, 3]), 0)).toBeNull();
  });
  it("MACD", () => {
    expect(calculateMacd(A)).toEqual({ macd: 4.77, signal: 3.31, histogram: 1.46 });
    expect(calculateMacd(B)).toEqual({ macd: 1.84, signal: 0.61, histogram: 1.24 });
    expect(calculateMacd(A, 5, 10, 4)).toEqual({ macd: 2.96, signal: 3.38, histogram: -0.42 });
    // length boundary: slow + signal - 1 = 34 points
    expect(calculateMacd(h(Array.from({ length: 33 }, (_, i) => 100 + i)))).toBeNull();
    expect(calculateMacd(h(Array.from({ length: 34 }, (_, i) => 100 + (i % 5))))).not.toBeNull();
  });
});
