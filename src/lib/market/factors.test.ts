import { describe, expect, it } from "vitest";

import {
  atrPercent,
  bollinger,
  candleBody,
  computeFactors,
  momentum12m1,
  priceToSma,
  rangePosition,
  rateOfChange,
  shortTermReversal,
  volumeRatio,
} from "./factors";

const day = (i: number) => new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10);
const flat = (closes: number[]) => closes.map((close, i) => ({ date: day(i), open: close, high: close, low: close, close }));
const val = (m: { status: string; value?: number }) => (m.status === "computed" ? m.value : "unavailable");

describe("factors", () => {
  it("rate of change", () => {
    expect(val(rateOfChange(flat([100, 110, 121]), 2))).toBe(0.21);
    expect(rateOfChange(flat([100, 110]), 2)).toMatchObject({ status: "unavailable" });
  });

  it("sorts unordered input by date", () => {
    expect(val(rateOfChange(flat([100, 110, 121]).reverse(), 1))).toBe(0.1);
  });

  it("ignores non-positive or non-finite closes instead of filling them", () => {
    const h = flat([100, 0, Number.NaN, 110]);
    expect(val(rateOfChange(h, 1))).toBe(0.1);
  });

  it("reversal is the negative n-period return", () => {
    expect(val(shortTermReversal(flat([100, 100, 100, 100, 100, 110]), 5))).toBe(-0.1);
  });

  it("price to SMA", () => {
    expect(val(priceToSma(flat([10, 10, 10, 10, 20]), 5))).toBeCloseTo(20 / 12 - 1, 4);
  });

  it("12-1 momentum needs 253 points and skips the latest month", () => {
    const closes = Array.from({ length: 253 }, (_, i) => 100 + i);
    // close[len-22] = 100+231, close[len-253] = 100
    expect(val(momentum12m1(flat(closes)))).toBeCloseTo(231 / 100, 3);
    expect(momentum12m1(flat(closes.slice(1)))).toMatchObject({ status: "unavailable" });
  });

  it("bollinger bands use population std", () => {
    const m = bollinger(flat([2, 4, 4, 4, 5, 5, 7, 9]), 8, 2);
    if (m.status !== "computed") throw new Error("expected computed");
    expect(m.value.middle).toBe(5);
    expect(m.value.upper).toBe(9); // sd = 2
    expect(m.value.lower).toBe(1);
    expect(m.value.percentB).toBe(1); // last close 9 sits on the upper band
    expect(m.value.bandwidth).toBe(1.6);
  });

  it("range position (stochastic %K)", () => {
    const h = [
      { date: day(0), open: 10, high: 12, low: 8, close: 10 },
      { date: day(1), open: 10, high: 14, low: 9, close: 13 },
    ];
    expect(val(rangePosition(h, 2))).toBeCloseTo((13 - 8) / (14 - 8), 4);
  });

  it("OHLC factors are unavailable, not zero, for close-only data", () => {
    const closeOnly = Array.from({ length: 30 }, (_, i) => ({ date: day(i), open: Number.NaN, high: Number.NaN, low: Number.NaN, close: 100 + i }));
    expect(rangePosition(closeOnly)).toMatchObject({ status: "unavailable" });
    expect(atrPercent(closeOnly)).toMatchObject({ status: "unavailable" });
    expect(candleBody(closeOnly)).toMatchObject({ status: "unavailable" });
  });

  it("ATR% uses true range", () => {
    const h = [
      { date: day(0), open: 10, high: 10, low: 10, close: 10 },
      { date: day(1), open: 10, high: 12, low: 9, close: 11 }, // TR 3
      { date: day(2), open: 11, high: 15, low: 11, close: 14 }, // TR max(4,4,0)=4
    ];
    expect(val(atrPercent(h, 2))).toBeCloseTo(3.5 / 14, 4);
  });

  it("candle body", () => {
    expect(val(candleBody([{ date: day(0), open: 100, high: 112, low: 99, close: 110 }]))).toBe(0.1);
  });

  it("volume ratio needs real volume", () => {
    const h = Array.from({ length: 21 }, (_, i) => ({ date: day(i), open: 1, high: 1, low: 1, close: 1, volume: i === 20 ? 300 : 100 }));
    expect(val(volumeRatio(h, 20))).toBe(3);
    expect(volumeRatio(flat(Array.from({ length: 25 }, () => 1)), 20)).toMatchObject({ status: "unavailable" });
  });

  it("snapshot is entirely unavailable for an empty history", () => {
    const s = computeFactors([]);
    for (const [key, metric] of Object.entries(s)) {
      if (key === "historicalOnly") continue;
      expect((metric as { status: string }).status).toBe("unavailable");
    }
    expect(s.historicalOnly).toBe(true);
  });
});
