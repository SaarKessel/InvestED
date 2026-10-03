import { describe, expect, it } from "vitest";
import { atrPercent, bollinger, candleBody, priceToSma, rangePosition, rateOfChange, shortTermReversal, volumeRatio } from "./factors";

const rows: Array<[number, number, number]> = [];
for (const start of [10, 100, 500]) for (const step of [-0.1, 0, 0.5, 2]) for (const n of [2, 5, 14, 20]) rows.push([start, step, n]);
const rounded = (v: number) => Number(v.toFixed(4));
const candles = (start: number, step: number, n: number) => Array.from({ length: n + 1 }, (_, i) => ({ date: new Date(Date.UTC(2025, 0, i + 1)).toISOString().slice(0, 10), open: start + step * i - 0.25, high: start + step * i + 1, low: start + step * i - 1, close: start + step * i, volume: 100 + i * 10 }));

describe("[sweep] B111 arithmetic-series price factor independent oracles", () => {
  it.each(rows)("start %s step %s periods %s", (start, step, n) => {
    const h = candles(start, step, n);
    const last = start + step * n;
    expect(rateOfChange(h, n)).toEqual({ status: "computed", value: rounded(last / start - 1) });
    expect(shortTermReversal(h, n)).toEqual({ status: "computed", value: rounded(-rounded(last / start - 1)) });
    const mean = start + step * (n + 1) / 2;
    expect(priceToSma(h, n)).toEqual({ status: "computed", value: rounded(last / mean - 1) });
    const sd = Math.abs(step) * Math.sqrt((n * n - 1) / 12);
    const bands = bollinger(h, n);
    expect(bands.status).toBe("computed");
    if (bands.status === "computed") {
      expect(bands.value.middle).toBe(rounded(mean));
      expect(bands.value.upper).toBe(rounded(mean + 2 * sd));
      expect(bands.value.lower).toBe(rounded(mean - 2 * sd));
      expect(bands.value.bandwidth).toBe(rounded(4 * sd / mean));
      expect(bands.value.percentB).toBe(sd === 0 ? null : rounded((last - mean + 2 * sd) / (4 * sd)));
    }
    const lo = Math.min(start + step, last) - 1;
    const hi = Math.max(start + step, last) + 1;
    expect(rangePosition(h, n)).toEqual({ status: "computed", value: rounded((last - lo) / (hi - lo)) });
    expect(atrPercent(h, n)).toEqual({ status: "computed", value: rounded(Math.max(2, Math.abs(step) + 1) / last) });
    expect(candleBody(h)).toEqual({ status: "computed", value: rounded(0.25 / (last - 0.25)) });
    expect(volumeRatio(h, n)).toEqual({ status: "computed", value: rounded((100 + 10 * n) / (100 + 5 * (n - 1))) });
  });
  it.each(rows)("order and monetary scale start %s step %s periods %s", (start, step, n) => {
    const h = candles(start, step, n);
    const shifted = h.map((c) => ({ ...c, open: c.open * 10, high: c.high * 10, low: c.low * 10, close: c.close * 10, volume: c.volume * 10 })).reverse();
    for (const factor of [rateOfChange, priceToSma, rangePosition, atrPercent, volumeRatio]) expect(factor(shifted, n)).toEqual(factor(h, n));
    expect(candleBody(shifted)).toEqual(candleBody(h));
    expect(h).toEqual(candles(start, step, n));
  });
});

describe("[hand] B111 factor unavailability is not zero", () => {
  it("flat price bands have a zero bandwidth but no defined percent-B", () => {
    expect(bollinger(candles(100, 0, 20), 20)).toMatchObject({ status: "computed", value: { bandwidth: 0, percentB: null } });
  });
  it("missing volume cannot be mistaken for a neutral volume ratio", () => {
    expect(volumeRatio(candles(100, 1, 20).map((c) => ({ ...c, volume: null })), 20).status).toBe("unavailable");
  });
});
