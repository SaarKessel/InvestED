import { describe, expect, it } from "vitest";
import { circuitBreaker, shouldShowHumility, trailingMisses, type ResolvedPrediction } from "./humility";

const masks = Array.from({ length: 256 }, (_, mask) => mask);
const history = (mask: number): ResolvedPrediction[] => Array.from({ length: 8 }, (_, i) => ({ resolvedAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`, hit: Boolean(mask & (1 << i)) }));

describe("[sweep] B107 humility streak independently enumerated histories", () => {
  it.each(masks)("history mask %s retains only the final consecutive misses", (mask) => {
    const input = history(mask);
    const lastHit = input.map((p) => p.hit).lastIndexOf(true);
    const expected = 7 - lastHit;
    expect(trailingMisses(input)).toBe(expected);
    expect(shouldShowHumility(input)).toBe(expected >= 3);
    expect(trailingMisses([...input].reverse())).toBe(expected);
    expect(trailingMisses([...input, { resolvedAt: "invalid-date", hit: true }])).toBe(expected);
    expect(input).toEqual(history(mask));
  });
});

const paths: number[][] = [];
for (const a of [80, 100, 120]) for (const b of [70, 100, 130]) for (const c of [60, 110, 140]) paths.push([100, a, b, c, 90]);
const cases: Array<[number[], number]> = paths.flatMap((path) => [5, 10, 20, 35, 70].map((limit): [number[], number] => [path, limit]));

describe("[sweep] B107 circuit breaker prefix-maximum oracle and scale invariance", () => {
  it.each(cases)("equity %j limit %s", (path, limit) => {
    const peaks = path.map((_v, i) => Math.max(...path.slice(0, i + 1)));
    const drawdowns = path.map((v, i) => (1 - v / peaks[i]) * 100);
    // Values are well away from ambiguous decimal threshold boundaries except exact 10/20/35% cases.
    const first = path.findIndex((v, i) => ((peaks[i] - v) * 100) >= limit * peaks[i]);
    const result = circuitBreaker(path, limit)!;
    expect(result.tripped).toBe(first !== -1);
    expect(result.trippedAtIndex).toBe(first === -1 ? null : first);
    expect(result.peak).toBe(first === -1 ? Math.max(...path) : peaks[first]);
    expect(result.drawdownPct).toBe(first === -1 ? null : Math.round(drawdowns[first] * 100) / 100);
    for (const scale of [0.5, 2, 10]) {
      const scaled = circuitBreaker(path.map((v) => v * scale), limit)!;
      expect(scaled.trippedAtIndex).toBe(result.trippedAtIndex);
      expect(scaled.drawdownPct).toBe(result.drawdownPct);
      expect(scaled.peak).toBe(result.peak! * scale);
    }
  });
});

describe("[hand] B107 chronology ties and first-breaker semantics", () => {
  it("same-date outcomes retain input order", () => {
    const date = "2026-01-01T00:00:00Z";
    expect(trailingMisses([{ resolvedAt: date, hit: true }, { resolvedAt: date, hit: false }])).toBe(1);
    expect(trailingMisses([{ resolvedAt: date, hit: false }, { resolvedAt: date, hit: true }])).toBe(0);
  });
  it("later recovery does not erase the first drawdown breach", () => {
    expect(circuitBreaker([100, 80, 200], 20)).toEqual({ tripped: true, trippedAtIndex: 1, drawdownPct: 20, peak: 100 });
  });
});
