import { describe, expect, it } from "vitest";
import { emaSeries, macdSeries, rsiSeries, smaSeries, toBars } from "./indicatorSeries";

const pts = Array.from({ length: 40 }, (_, i) => ({ date: `2020-01-${String(i + 1).padStart(2, "0")}`, close: 100 + i + (i % 3) }));

describe("indicatorSeries guards (B191)", () => {
  it("rejects period < 1 and non-integer periods with the right name", () => {
    expect(() => smaSeries(pts, 0)).toThrow(RangeError);
    expect(() => smaSeries(pts, 0)).toThrow(/SMA period/);
    expect(() => emaSeries(pts, 0)).toThrow(/EMA period/);
    expect(() => rsiSeries(pts, 0)).toThrow(/RSI period/);
    expect(() => smaSeries(pts, -3)).toThrow(RangeError);
    expect(() => smaSeries(pts, 2.5)).toThrow(RangeError);
    expect(() => smaSeries(pts, NaN)).toThrow(RangeError);
    expect(() => macdSeries(pts, 0, 26, 9)).toThrow(/MACD fast/);
    expect(() => macdSeries(pts, 12, 0, 9)).toThrow(/MACD slow/);
    expect(() => macdSeries(pts, 12, 26, 0)).toThrow(/MACD signal/);
    expect(() => macdSeries(pts, 3.5, 26, 9)).toThrow(RangeError);
  });
  it("accepts period exactly 1", () => {
    expect(smaSeries(pts, 1)[0]).toBe(100);
    expect(emaSeries(pts, 1)[5]).toBe(pts[5].close);
    expect(() => rsiSeries(pts, 1)).not.toThrow();
    expect(() => macdSeries(pts, 1, 2, 1)).not.toThrow();
  });
  it("macd requires fast strictly shorter than slow", () => {
    expect(() => macdSeries(pts, 5, 5)).toThrow(/shorter/);
    expect(() => macdSeries(pts, 6, 5)).toThrow(/shorter/);
    expect(() => macdSeries(pts, 4, 5, 2)).not.toThrow();
  });
  it("series stay null until stable and match length", () => {
    const s = smaSeries(pts, 5);
    expect(s).toHaveLength(40);
    expect(s.slice(0, 4).every((v) => v === null)).toBe(true);
    expect(s[4]).toBe(pts.slice(0, 5).reduce((a, p) => a + p.close, 0) / 5);
    const m = macdSeries(pts);
    expect(m.findIndex((v) => v !== null)).toBeGreaterThan(24);
    const first = m.find((v) => v !== null)!;
    expect(first.histogram).toBeCloseTo(first.macd - first.signal, 9);
  });
  it("toBars counts dropped points", () => {
    const b = toBars([{ date: "2020-01-01", close: 1 }, { date: "2020-01-01", close: 2 }, { date: "2020-01-02", close: -1 }, { date: "2020-01-03", close: 3 }]);
    expect(b.points).toHaveLength(2);
    expect(b.droppedPoints).toBe(2);
  });
});
