// Added after mutation testing. Expected values computed independently in Python
// (statistics.NormalDist for the normal quantile; plain loops for DCF and
// covariance; brute-force simplex search for the minimum-variance weights).
import { describe, expect, it } from "vitest";
import { computeDcf, dcfSensitivity } from "./dcf";
import { normInv, periodReturns } from "./risk";
import { alignedReturns, covarianceMatrix, minVarianceReport, projectSimplex } from "./portfolio";

describe("DCF sensitivity grid and equity bridge", () => {
  const base = { baseCashFlow: 100, growthPct: 5, discountPct: 10, terminalGrowthPct: 2, years: 5 };
  it("grid cell (discount+dr, terminal+dt) has the independently computed enterprise value", () => {
    const exp: Record<string, number> = {
      "-1,-1": 1494.812455884148, "-1,0": 1656.26781932927, "-1,1": 1871.5416372560987,
      "0,-1": 1325.1400177583496, "0,0": 1446.2118899836075, "0,1": 1601.875725701796,
      "1,-1": 1189.5158687007142, "1,0": 1282.9298905839285, "1,1": 1399.697417937946,
    };
    const grid = dcfSensitivity(base, 1);
    expect(grid).toHaveLength(9);
    for (const c of grid) expect(c.enterpriseValue).toBeCloseTo(exp[`${c.discountPct - 10},${c.terminalGrowthPct - 2}`], 6);
    expect(grid.map((c) => [c.discountPct, c.terminalGrowthPct])).toEqual([[9, 1], [9, 2], [9, 3], [10, 1], [10, 2], [10, 3], [11, 1], [11, 2], [11, 3]]);
  });
  it("equity value, per-share and terminal share", () => {
    const o = computeDcf({ ...base, netDebt: 200, shares: 10 });
    expect(o.ok).toBe(true);
    if (!o.ok) return;
    expect(o.result.presentValueOfCashFlows).toBeCloseTo(435.81208359463767, 8);
    expect(o.result.presentValueOfTerminal).toBeCloseTo(1010.3998063889699, 8);
    expect(o.result.equityValue).toBeCloseTo(1246.2118899836075, 8);
    expect(o.result.perShare).toBeCloseTo(124.62118899836075, 8);
    expect(o.result.terminalShareOfValuePct).toBeCloseTo(69.86526755774511, 8);
  });
  it("equity needs a finite net debt; per-share needs positive shares", () => {
    const noDebt = computeDcf(base);
    expect(noDebt.ok && noDebt.result.equityValue).toBeNull();
    expect(noDebt.ok && noDebt.result.perShare).toBeNull();
    const nanDebt = computeDcf({ ...base, netDebt: NaN, shares: 10 });
    expect(nanDebt.ok && nanDebt.result.equityValue).toBeNull();
    const zeroSh = computeDcf({ ...base, netDebt: 200, shares: 0 });
    expect(zeroSh.ok && zeroSh.result.perShare).toBeNull();
    expect(zeroSh.ok && zeroSh.result.equityValue).toBeCloseTo(1246.2118899836075, 8);
    const noSh = computeDcf({ ...base, netDebt: 200 });
    expect(noSh.ok && noSh.result.perShare).toBeNull();
    const nanSh = computeDcf({ ...base, netDebt: 200, shares: NaN });
    expect(nanSh.ok && nanSh.result.perShare).toBeNull();
    const zeroDebt = computeDcf({ ...base, netDebt: 0, shares: 10 });
    expect(zeroDebt.ok && zeroDebt.result.equityValue).toBeCloseTo(1446.2118899836075, 8);
  });
  it("discount rate boundaries", () => {
    expect(computeDcf({ ...base, discountPct: 0, terminalGrowthPct: -1 }).ok).toBe(false);
    expect(computeDcf({ ...base, discountPct: 100 }).ok).toBe(true);
    expect(computeDcf({ ...base, discountPct: 100.01 }).ok).toBe(false);
    expect(computeDcf({ ...base, discountPct: 0.01, terminalGrowthPct: 0 }).ok).toBe(true);
  });
});

describe("normal quantile (Acklam) against Python's NormalDist", () => {
  const exp: [number, number][] = [
    [0.001, -3.090232306167813], [0.01, -2.3263478740408408], [0.02425, -1.9729610513118845], [0.02426, -1.9727855514678603],
    [0.5, 0], [0.97574, 1.9727855514678616], [0.97575, 1.9729610513118847], [0.99, 2.3263478740408408], [0.999, 3.090232306167813],
  ];
  for (const [p, z] of exp) it(`p=${p}`, () => expect(normInv(p)).toBeCloseTo(z, 6));
  it("is NaN outside (0,1)", () => { for (const p of [0, 1, -0.1, 1.1, NaN]) expect(normInv(p)).toBeNaN(); });
});

describe("period returns", () => {
  it("skips non-positive and non-finite prices, keeps the pair rule", () => {
    expect(periodReturns([100, 110, 0, 50, 55])).toEqual([0.1 + 0, 55 / 50 - 1].map((x, i) => (i === 0 ? 110 / 100 - 1 : x)));
    expect(periodReturns([100, NaN, 100])).toEqual([]);
    expect(periodReturns([100])).toEqual([]);
    expect(periodReturns([100, 100])).toEqual([0]);
  });
});

describe("portfolio math", () => {
  const mk = (f: (i: number) => number, n = 70) => Array.from({ length: n }, (_, i) => ({ date: `2020-01-${String(i).padStart(3, "0")}`, close: Number(f(i).toFixed(4)) }));
  const A = mk((i) => 100 + 5 * Math.sin(i / 3) + 0.2 * i);
  const B = mk((i) => 50 + 3 * Math.cos(i / 4) - 0.05 * i);
  const C = mk((i) => 80 + 2 * Math.sin(i / 7 + 1));
  it("covariance matrix (sample, n-1) equals the independent matrix", () => {
    const a = alignedReturns({ A, B, C });
    expect(a.status).toBe("computed");
    if (a.status !== "computed") return;
    const cov = covarianceMatrix(a.value.returns);
    const exp = [[1.2488943726e-4, -1.9741702085e-6, 4.0268371759e-7], [-1.9741702085e-6, 1.2164012072e-4, -5.2806714457e-7], [4.0268371759e-7, -5.2806714457e-7, 5.799968544e-6]];
    exp.forEach((row, i) => row.forEach((v, j) => expect(cov[i][j] / v).toBeCloseTo(1, 6)));
  });
  it("minimum-variance weights and annualised vol match a brute-force search", () => {
    const r = minVarianceReport({ A, B, C }, 252);
    expect(r.status).toBe("computed");
    if (r.status !== "computed") return;
    expect(r.value.weights.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 9);
    expect(r.value.weights[0]).toBeCloseTo(0.0401, 3);
    expect(r.value.weights[1]).toBeCloseTo(0.048, 3);
    expect(r.value.weights[2]).toBeCloseTo(0.9119, 3);
    expect(r.value.equalWeightVolPct).toBeCloseTo(8.335257487974648, 6);
    expect(r.value.minVolPct).toBeCloseTo(3.647592825746519, 3);
    expect(r.value.periods).toBe(69);
    expect(r.value.dates).toBe(70);
    expect(r.value.dropped).toBe(0);
    const w52 = minVarianceReport({ A, B, C }, 52);
    expect(w52.status === "computed" && w52.value.equalWeightVolPct).toBeCloseTo(8.335257487974648 * Math.sqrt(52 / 252), 6);
  });
  it("common-date boundary: 61 dates computes, 60 does not; dropped counts the union minus common", () => {
    const cut = (s: typeof A, n: number) => s.slice(0, n);
    expect(alignedReturns({ A: cut(A, 61), B: cut(B, 61) }).status).toBe("computed");
    expect(alignedReturns({ A: cut(A, 60), B: cut(B, 60) }).status).toBe("unavailable");
    const r = alignedReturns({ A: A.slice(0, 65), B: B.slice(2, 70) });
    expect(r.status === "computed" && r.value.dates).toBe(63);
    expect(r.status === "computed" && r.value.dropped).toBe(70 - 63);
    expect(alignedReturns({ A }).status).toBe("unavailable");
  });
  it("non-positive or non-finite prices are dropped before alignment", () => {
    const bad = A.map((p, i) => (i === 10 ? { ...p, close: 0 } : i === 11 ? { ...p, close: NaN } : p));
    const r = alignedReturns({ A: bad, B });
    expect(r.status === "computed" && r.value.dates).toBe(68);
  });
  it("simplex projection", () => {
    const p = projectSimplex([0.5, 2, -1]);
    expect(p[0]).toBeCloseTo(0, 12); expect(p[1]).toBeCloseTo(1, 12); expect(p[2]).toBeCloseTo(0, 12);
    const q = projectSimplex([0.2, 0.2, 0.2]);
    q.forEach((x) => expect(x).toBeCloseTo(1 / 3, 12));
    const s = projectSimplex([3, 1, 2, 0.1]);
    expect(s.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(s[0]).toBeCloseTo(1, 12); // 3 dominates: 3 - theta=2 -> 1, others clipped
  });
});
