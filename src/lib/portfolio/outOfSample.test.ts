import { describe, expect, it } from "vitest";
import { alignReturns, covMatrix, maxSharpeWeights, minVarianceWeights, portfolioStats, projectSimplex, runOutOfSample } from "./outOfSample";

// deterministic pseudo-random series
function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
function series(n: number, drift: number, vol: number, seed: number, startDate = "2020-01-01") {
  const r = rng(seed); let p = 100; const out: { date: string; close: number }[] = [];
  const d = new Date(`${startDate}T00:00:00Z`);
  for (let i = 0; i < n; i++) { p *= 1 + drift + (r() - 0.5) * 2 * vol; out.push({ date: d.toISOString().slice(0, 10), close: p }); d.setUTCDate(d.getUTCDate() + 1); }
  return out;
}

describe("math", () => {
  it("projects onto the simplex", () => {
    const w = projectSimplex([0.9, 0.9, -0.5]);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1); expect(Math.min(...w)).toBeGreaterThanOrEqual(0);
    expect(projectSimplex([0.2, 0.3])[0] + projectSimplex([0.2, 0.3])[1]).toBeCloseTo(1);
  });
  it("min variance puts most weight on the quiet independent asset", () => {
    const quiet = series(600, 0.0003, 0.002, 1).map((c) => c), loud = series(600, 0.0003, 0.02, 2);
    const a = alignReturns([quiet, loud]);
    const w = minVarianceWeights(covMatrix(a.returns));
    expect(w[0]).toBeGreaterThan(0.9); expect(w.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 5);
  });
  it("max Sharpe favors the asset with the clearly better return per risk", () => {
    const good = series(600, 0.002, 0.005, 3), flat = series(600, 0, 0.005, 4);
    const a = alignReturns([good, flat]);
    const mu = a.returns.map((r) => r.reduce((x, y) => x + y, 0) / r.length);
    const w = maxSharpeWeights(mu, covMatrix(a.returns));
    expect(w[0]).toBeGreaterThan(0.7); expect(w.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 5); expect(Math.min(...w)).toBeGreaterThanOrEqual(0);
  });
  it("aligns on common dates only and does not invent returns", () => {
    const a = alignReturns([[{ date: "2026-01-01", close: 1 }, { date: "2026-01-02", close: 2 }, { date: "2026-01-03", close: 4 }], [{ date: "2026-01-01", close: 1 }, { date: "2026-01-03", close: 3 }]]);
    expect(a.dates).toEqual(["2026-01-03"]); expect(a.returns[0][0]).toBeCloseTo(3); expect(a.returns[1][0]).toBeCloseTo(2);
  });
  it("stats on a known path", () => {
    const s = portfolioStats([0.01, -0.01, 0.01, 0.01], ["a", "b", "c", "d", "e"]);
    expect(s.totalReturnPct).toBeCloseTo((1.01 * 0.99 * 1.01 * 1.01 - 1) * 100); expect(s.maxDrawdownPct).toBeCloseTo(-1);
  });
});

describe("runOutOfSample", () => {
  const spy = series(900, 0.0004, 0.008, 9);
  it("learns weights on train only and reports both windows", () => {
    const r = runOutOfSample(["A", "B", "C"], [series(900, 0.0005, 0.01, 5), series(900, 0.0003, 0.007, 6), series(900, 0.0004, 0.012, 7)], spy);
    expect(r.ok).toBe(true); if (!r.ok) return;
    const x = r.result;
    expect(x.trainDays + x.testDays).toBe(899); expect(x.trainDays / 899).toBeCloseTo(0.7, 1);
    expect(x.rows.map((q) => q.name)).toEqual(["min_variance", "max_sharpe", "equal_weight", "spy"]);
    expect(x.rows[0].weights!.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 5);
    expect(new Date(x.splitDate) > new Date(x.from)).toBe(true);
  });
  it("refuses instead of guessing", () => {
    expect(runOutOfSample(["A"], [series(900, 0, 0.01, 1)], spy)).toEqual({ ok: false, reason: "too_few_assets" });
    expect(runOutOfSample(["A", "B"], [series(900, 0, 0.01, 1), series(900, 0, 0.01, 2)], null)).toEqual({ ok: false, reason: "spy_missing" });
    expect(runOutOfSample(["A", "B"], [series(200, 0, 0.01, 1), series(200, 0, 0.01, 2)], series(200, 0, 0.01, 3))).toEqual({ ok: false, reason: "too_little_history" });
    expect(runOutOfSample(["A", "B", "C", "D", "E", "F"], Array(6).fill(series(900, 0, 0.01, 1)), spy)).toEqual({ ok: false, reason: "too_many_assets" });
  });
  it("is deterministic", () => {
    const s = [series(900, 0.0005, 0.01, 5), series(900, 0.0003, 0.007, 6)];
    expect(JSON.stringify(runOutOfSample(["A", "B"], s, spy))).toBe(JSON.stringify(runOutOfSample(["A", "B"], s, spy)));
  });
});
