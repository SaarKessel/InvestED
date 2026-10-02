import { describe, expect, it } from "vitest";
import { cleanCloses, computeRisk, maxDrawdown, MIN_DAYS } from "./riskMetrics";

const day = (i: number) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
const series = (f: (i: number) => number, n = 100) => Array.from({ length: n }, (_, i) => ({ date: day(i), close: f(i) }));

describe("risk metrics", () => {
  it("drawdown finds the worst peak to trough fall", () => {
    const d = maxDrawdown(cleanCloses([{ date: "2025-01-01", close: 100 }, { date: "2025-01-02", close: 120 }, { date: "2025-01-03", close: 60 }, { date: "2025-01-04", close: 90 }]))!;
    expect(d.value).toBeCloseTo(-0.5, 10);
    expect(d.peakDate).toBe("2025-01-02");
    expect(d.troughDate).toBe("2025-01-03");
  });
  it("a steadily rising price has zero drawdown and zero volatility of a constant growth rate", () => {
    const m = computeRisk(cleanCloses(series((i) => 100 * 1.001 ** i)));
    expect(m.maxDrawdown!.value).toBe(0);
    expect(m.volatility!).toBeLessThan(1e-9);
  });
  it("volatility annualises the daily standard deviation by sqrt(252)", () => {
    const m = computeRisk(cleanCloses(series((i) => 100 * (i % 2 ? 1.01 : 1))));
    expect(m.volatility!).toBeGreaterThan(0.1);
    expect(m.volatility!).toBeLessThan(0.3);
  });
  it("beta of a series that moves twice as much as the benchmark is about 2, and of itself is 1", () => {
    const rets = Array.from({ length: 120 }, (_, i) => Math.sin(i / 3) * 0.01);
    let b = 100, a = 100;
    const bench = [{ date: day(0), close: b }], asset = [{ date: day(0), close: a }];
    rets.forEach((r, i) => { b *= 1 + r; a *= 1 + 2 * r; bench.push({ date: day(i + 1), close: b }); asset.push({ date: day(i + 1), close: a }); });
    expect(computeRisk(asset, bench).beta!).toBeCloseTo(2, 1);
    expect(computeRisk(bench, bench).beta!).toBeCloseTo(1, 10);
  });
  it("says why a metric is missing instead of guessing", () => {
    const few = computeRisk(cleanCloses(series((i) => 100 + i, MIN_DAYS - 1)));
    expect(few.volatility).toBeNull();
    expect(few.maxDrawdown).toBeNull();
    expect(few.missing.volatility).toBe("too_few_days");
    const full = series((i) => 100 + Math.sin(i), 100);
    expect(computeRisk(full).missing.beta).toBe("no_benchmark");
    expect(computeRisk(full, series(() => 50, 100)).missing.beta).toBe("flat_benchmark");
    expect(computeRisk(full, series((i) => 50 + i, 20)).missing.beta).toBe("too_few_overlap");
  });
  it("ignores bad rows and duplicate dates", () => {
    const c = cleanCloses([{ date: "2025-01-02", close: 2 }, { date: "2025-01-01", close: 1 }, { date: "2025-01-02", close: 3 }, { date: "x", close: NaN }, { date: "2025-01-03", close: -1 }]);
    expect(c).toEqual([{ date: "2025-01-01", close: 1 }, { date: "2025-01-02", close: 3 }]);
  });
});
