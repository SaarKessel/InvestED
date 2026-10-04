import { describe, expect, it } from "vitest";
import { atrPercent, bollinger, candleBody, computeFactors, momentum12m1, priceToSma, rangePosition, rateOfChange, shortTermReversal, volumeRatio } from "./factors";

const day = (i: number) => new Date(Date.UTC(2020, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
type C = { date: string; open: number; high: number; low: number; close: number; volume?: number | null };
const mk = (n: number, f: (i: number) => Partial<C> & { close: number }): C[] =>
  Array.from({ length: n }, (_, i) => { const x = f(i); return { date: day(i), open: x.close, high: x.close + 1, low: x.close - 1, ...x }; });
const v = (m: { status: string; value?: unknown }) => { if (m.status !== "computed") throw new Error("na:" + JSON.stringify(m)); return m.value as number; };

describe("factors boundaries (B191)", () => {
  it("rateOfChange: exact window n+1, uses close n ago, sorts unsorted input, drops bad closes", () => {
    const h = mk(21, (i) => ({ close: 100 + i }));
    expect(v(rateOfChange(h, 20))).toBe(0.2);
    expect(rateOfChange(h.slice(1), 20)).toEqual({ status: "unavailable", reason: "Need 21 observations (have 20)" });
    expect(v(rateOfChange([...h].reverse(), 20))).toBe(0.2);
    const dirty = [...h, { date: day(30), open: 1, high: 1, low: 1, close: 0 }, { date: day(31), open: 1, high: 1, low: 1, close: NaN }, { date: day(32), open: 1, high: 1, low: 1, close: -5 }];
    expect(v(rateOfChange(dirty, 20))).toBe(0.2);
    expect(v(rateOfChange(h, 1))).toBe(Number((120 / 119 - 1).toFixed(4)));
  });
  it("momentum12m1: 253 bars needed, 252 to 21 ago skipping last month", () => {
    const h = mk(253, (i) => ({ close: 100 + i }));
    expect(v(momentum12m1(h))).toBe(Number((h[231].close / h[0].close - 1).toFixed(4)));
    expect(momentum12m1(h.slice(1)).status).toBe("unavailable");
    expect(momentum12m1(h.slice(1))).toEqual({ status: "unavailable", reason: "Need 253 observations (have 252)" });
  });
  it("shortTermReversal: default n=5, negated, passes unavailable through", () => {
    const h = mk(10, (i) => ({ close: 100 + i * 2 }));
    expect(v(shortTermReversal(h))).toBe(-Number((118 / 108 - 1).toFixed(4)));
    expect(v(shortTermReversal(h, 2))).toBe(-Number((118 / 114 - 1).toFixed(4)));
    expect(shortTermReversal(h.slice(5)).status).toBe("unavailable");
    expect(shortTermReversal(h.slice(5))).toEqual({ status: "unavailable", reason: "Need 6 observations (have 5)" });
    expect(Object.is(v(shortTermReversal(mk(10, () => ({ close: 5 })))), 0) || v(shortTermReversal(mk(10, () => ({ close: 5 })))) === 0).toBe(true);
  });
  it("priceToSma: exact n window (not n+1), last n only", () => {
    const h = mk(20, (i) => ({ close: i < 10 ? 1000 : 10 }));
    expect(v(priceToSma(h, 10))).toBe(0);
    expect(v(priceToSma(mk(5, (i) => ({ close: [10, 20, 30, 40, 50][i] })), 5))).toBe(Number((50 / 30 - 1).toFixed(4)));
    expect(priceToSma(mk(19, () => ({ close: 5 })))).toEqual({ status: "unavailable", reason: "Need 20 observations (have 19)" });
    expect(v(priceToSma(mk(20, () => ({ close: 5 }))))).toBe(0);
  });
  it("bollinger: population sd, exact bands, flat -> percentB null, boundary n", () => {
    const h = mk(5, (i) => ({ close: [2, 4, 4, 4, 5][i] }));
    const b = bollinger(h, 5, 2);
    if (b.status !== "computed") throw new Error("na");
    const mid = 19 / 5, sd = Math.sqrt(([2, 4, 4, 4, 5].reduce((s, x) => s + (x - mid) ** 2, 0)) / 5);
    expect(b.value.middle).toBeCloseTo(mid, 4);
    expect(b.value.upper).toBeCloseTo(mid + 2 * sd, 4);
    expect(b.value.lower).toBeCloseTo(mid - 2 * sd, 4);
    expect(b.value.percentB).toBeCloseTo((5 - (mid - 2 * sd)) / (4 * sd), 4);
    expect(b.value.bandwidth).toBeCloseTo((4 * sd) / mid, 4);
    const k1 = bollinger(h, 5, 1);
    if (k1.status === "computed") expect(k1.value.upper).toBeCloseTo(mid + sd, 4);
    const flat = bollinger(mk(20, () => ({ close: 7 })));
    if (flat.status !== "computed") throw new Error("na");
    expect(flat.value.percentB).toBeNull();
    expect(flat.value.bandwidth).toBe(0);
    expect(bollinger(mk(19, () => ({ close: 7 })))).toEqual({ status: "unavailable", reason: "Need 20 observations (have 19)" });
  });
  it("rangePosition: last n only, OHLC validity per window, zero range, exact value", () => {
    const h = mk(14, (i) => ({ close: 10 + i, high: 10 + i + 1, low: 10 + i - 1 }));
    expect(v(rangePosition(h))).toBe(Number(((23 - 9) / (24 - 9)).toFixed(4)));
    const old = [{ date: day(-1), open: NaN, high: NaN, low: NaN, close: 5 }, ...h];
    expect(v(rangePosition(old))).toBe(Number(((23 - 9) / (24 - 9)).toFixed(4))); // bad OHLC outside window ignored
    expect(rangePosition(mk(13, () => ({ close: 5 })))).toEqual({ status: "unavailable", reason: "Need 14 observations (have 13)" });
    const noOhlc = mk(14, (i) => ({ close: 5, open: i === 13 ? NaN : 5 }));
    expect(rangePosition(noOhlc)).toEqual({ status: "unavailable", reason: "Complete open/high/low data is not available" });
    for (const bad of [{ high: 0 }, { low: 0 }, { open: 0 }, { high: 3, low: 4 }]) {
      const x = mk(14, (i) => (i === 5 ? { close: 5, ...bad } : { close: 5 }));
      expect(rangePosition(x).status).toBe("unavailable");
    }
    expect(rangePosition(mk(14, () => ({ close: 5, high: 5, low: 5 })))).toEqual({ status: "unavailable", reason: "Zero price range" });
    // high === low on a bar is still valid OHLC
    expect(rangePosition(mk(14, (i) => ({ close: 5 + i, high: 5 + i, low: 5 + i }))).status).toBe("computed");
  });
  it("atrPercent: n+1 window, true range uses prev close, exact value", () => {
    const h = mk(15, () => ({ close: 100, high: 101, low: 99 }));
    expect(v(atrPercent(h))).toBe(0.02);
    const gap = mk(15, (i) => (i === 14 ? { close: 120, open: 120, high: 121, low: 119 } : { close: 100, high: 101, low: 99 }));
    // last bar TR = max(2, |121-100|, |119-100|) = 21 ; others 2
    expect(v(atrPercent(gap))).toBe(Number(((13 * 2 + 21) / 14 / 120).toFixed(4)));
    const gapDown = mk(15, (i) => (i === 14 ? { close: 80, open: 80, high: 81, low: 79 } : { close: 100, high: 101, low: 99 }));
    expect(v(atrPercent(gapDown))).toBe(Number(((13 * 2 + 21) / 14 / 80).toFixed(4)));
    expect(atrPercent(h.slice(1))).toEqual({ status: "unavailable", reason: "Need 15 observations (have 14)" });
    const badFirst = mk(15, (i) => (i === 0 ? { close: 100, open: NaN } : { close: 100, high: 101, low: 99 }));
    expect(atrPercent(badFirst).status).toBe("unavailable");
  });
  it("candleBody: last candle only, exact, empty and bad OHLC unavailable", () => {
    expect(v(candleBody([{ date: day(0), open: 10, high: 13, low: 9, close: 12 }]))).toBe(0.2);
    expect(v(candleBody([{ date: day(0), open: 10, high: 13, low: 9, close: 8 }]))).toBe(-0.2);
    expect(candleBody([]).status).toBe("unavailable");
    expect(candleBody([{ date: day(0), open: 10, high: 13, low: 9, close: 12 }, { date: day(1), open: 0, high: 1, low: 1, close: 12 }]).status).toBe("unavailable");
    expect(candleBody([{ date: day(0), open: 10, high: 13, low: 9, close: 12 }, { date: day(1), open: NaN, high: 13, low: 9, close: 12 }]).status).toBe("unavailable");
  });
  it("volumeRatio: last vs average of previous n, n+1 window, volume validity", () => {
    const h = mk(21, (i) => ({ close: 10, volume: i === 20 ? 300 : 100 }));
    expect(v(volumeRatio(h))).toBe(3);
    expect(volumeRatio(h.slice(1))).toEqual({ status: "unavailable", reason: "Need 21 observations (have 20)" });
    for (const bad of [0, null, undefined, NaN, -1]) {
      const x = mk(21, (i) => ({ close: 10, volume: i === 7 ? (bad as number) : 100 }));
      expect(volumeRatio(x)).toEqual({ status: "unavailable", reason: "Volume data is not available" });
    }
    // older-than-window bad volume is ignored
    const old = mk(22, (i) => ({ close: 10, volume: i === 0 ? 0 : i === 21 ? 200 : 100 }));
    expect(v(volumeRatio(old))).toBe(2);
  });
  it("computeFactors wires each factor with its default period", () => {
    const h = mk(300, (i) => ({ close: 100 + i * 0.5 + Math.sin(i) * 2, volume: 100 + i }));
    const f = computeFactors(h);
    expect(f.historicalOnly).toBe(true);
    expect(f.rateOfChange20).toEqual(rateOfChange(h, 20));
    expect(f.momentum12m1).toEqual(momentum12m1(h));
    expect(f.shortTermReversal5).toEqual(shortTermReversal(h, 5));
    expect(f.priceToSma20).toEqual(priceToSma(h, 20));
    expect(f.bollinger20).toEqual(bollinger(h, 20, 2));
    expect(f.rangePosition14).toEqual(rangePosition(h, 14));
    expect(f.atrPercent14).toEqual(atrPercent(h, 14));
    expect(f.candleBody).toEqual(candleBody(h));
    expect(f.volumeRatio20).toEqual(volumeRatio(h, 20));
    expect(f.rateOfChange20).not.toEqual(rateOfChange(h, 19));
  });
});
