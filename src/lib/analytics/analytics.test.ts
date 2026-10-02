import { describe, expect, it } from "vitest";
import { computeVar, normInv, periodReturns } from "./risk";
import { computeDcf, dcfSensitivity } from "./dcf";
import { alignedReturns, minVarianceReport, minVarianceWeights, projectSimplex, variance } from "./portfolio";

describe("normInv", () => {
  it("matches known quantiles", () => {
    expect(normInv(0.5)).toBeCloseTo(0, 9);
    expect(normInv(0.975)).toBeCloseTo(1.959964, 5);
    expect(normInv(0.05)).toBeCloseTo(-1.644854, 5);
    expect(normInv(0.001)).toBeCloseTo(-3.090232, 5);
    expect(normInv(0)).toBeNaN();
  });
});

describe("VaR", () => {
  const r = Array.from({ length: 100 }, (_, i) => (i - 50) / 1000); // -5.0% .. +4.9%
  it("historical VaR and ES on a known distribution", () => {
    const m = computeVar(r, 95);
    expect(m.status).toBe("computed");
    if (m.status !== "computed") return;
    expect(m.value.historicalVarPct).toBeCloseTo(4.6, 6); // 5th lowest of 100 => k=5 => -0.046
    expect(m.value.expectedShortfallPct).toBeCloseTo(4.8, 6); // mean of -5.0..-4.6
    expect(m.value.parametricVarPct.status).toBe("computed");
    expect(m.value.observations).toBe(100);
  });
  it("is unavailable with too few observations or bad confidence", () => {
    expect(computeVar(r.slice(0, 10)).status).toBe("unavailable");
    expect(computeVar(r, 100).status).toBe("unavailable");
  });
  it("zero variance has no parametric figure and no negative VaR", () => {
    const m = computeVar(Array(70).fill(0.01));
    expect(m.status === "computed" && m.value.parametricVarPct.status === "unavailable" && m.value.historicalVarPct === 0).toBe(true);
  });
  it("periodReturns skips invalid closes", () => {
    expect(periodReturns([100, 110, 0, 5])).toHaveLength(1);
  });
});

describe("DCF", () => {
  const base = { baseCashFlow: 100, growthPct: 0, discountPct: 10, terminalGrowthPct: 0, years: 1 };
  it("matches a hand calculation", () => {
    const o = computeDcf(base);
    expect(o.ok).toBe(true);
    if (!o.ok) return;
    expect(o.result.presentValueOfCashFlows).toBeCloseTo(100 / 1.1, 9);
    expect(o.result.presentValueOfTerminal).toBeCloseTo(100 / 0.1 / 1.1, 9);
    expect(o.result.enterpriseValue).toBeCloseTo(1000, 9);
    expect(o.result.equityValue).toBeNull();
    expect(o.result.perShare).toBeNull();
  });
  it("per share only with net debt and shares", () => {
    const o = computeDcf({ ...base, netDebt: 200, shares: 10 });
    expect(o.ok && o.result.equityValue).toBeCloseTo(800, 6);
    expect(o.ok && o.result.perShare).toBeCloseTo(80, 6);
    const p = computeDcf({ ...base, netDebt: 200 });
    expect(p.ok && p.result.perShare).toBeNull();
  });
  it("rejects invalid inputs", () => {
    expect(computeDcf({ ...base, terminalGrowthPct: 10 }).ok).toBe(false);
    expect(computeDcf({ ...base, baseCashFlow: -1 }).ok).toBe(false);
    expect(computeDcf({ ...base, years: 0 }).ok).toBe(false);
    expect(computeDcf({ ...base, years: 2.5 }).ok).toBe(false);
    expect(computeDcf({ ...base, discountPct: NaN }).ok).toBe(false);
  });
  it("sensitivity leaves invalid cells null", () => {
    const g = dcfSensitivity({ ...base, terminalGrowthPct: 9 }, 1);
    expect(g).toHaveLength(9);
    expect(g.some((c) => c.enterpriseValue === null)).toBe(true);
    expect(g.find((c) => c.discountPct === 10 && c.terminalGrowthPct === 9)?.enterpriseValue).not.toBeNull();
  });
});

describe("portfolio", () => {
  it("projects onto the simplex", () => {
    const p = projectSimplex([0.9, 0.9, -0.5]);
    expect(p.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 9);
    expect(p.every((x) => x >= 0)).toBe(true);
  });
  it("min variance matches the closed form for uncorrelated assets", () => {
    const cov = [[0.04, 0], [0, 0.01]];
    const w = minVarianceWeights(cov);
    expect(w[0]).toBeCloseTo(0.2, 4);
    expect(w[1]).toBeCloseTo(0.8, 4);
    expect(variance(w, cov)).toBeLessThan(variance([0.5, 0.5], cov));
  });
  const mk = (f: (i: number) => number, n = 80, skip = -1) => Array.from({ length: n }, (_, i) => ({ date: `d${String(i).padStart(3, "0")}`, close: f(i) })).filter((_, i) => i !== skip);
  it("aligns on common dates, drops others and says so", () => {
    const a = alignedReturns({ A: mk((i) => 100 + i + (i % 3)), B: mk((i) => 50 + i * 0.5 + (i % 5), 80, 10) });
    expect(a.status === "computed" && a.value.dropped).toBe(1);
    expect(a.status === "computed" && a.value.dates).toBe(79);
  });
  it("is unavailable for one asset or short overlap", () => {
    expect(alignedReturns({ A: mk((i) => 100 + i) }).status).toBe("unavailable");
    expect(alignedReturns({ A: mk((i) => 100 + i, 30), B: mk((i) => 100 + i, 30) }).status).toBe("unavailable");
  });
  it("report lowers volatility versus equal weight and is flagged in-sample", () => {
    const rep = minVarianceReport({ A: mk((i) => 100 * (1 + 0.02 * Math.sin(i))), B: mk((i) => 100 * (1 + 0.002 * Math.cos(i * 1.7))) }, 252);
    expect(rep.status).toBe("computed");
    if (rep.status !== "computed") return;
    expect(rep.value.inSample).toBe(true);
    expect(rep.value.minVolPct).toBeLessThanOrEqual(rep.value.equalWeightVolPct + 1e-9);
    expect(rep.value.weights.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 6);
    expect(rep.value.weights[1]).toBeGreaterThan(rep.value.weights[0]);
  });
});
