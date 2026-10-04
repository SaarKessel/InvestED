import { describe, expect, it } from "vitest";
import { computePerformance, detectPeriodsPerYear, maxDrawdown, splitTrainTest, computeTrainTestPerformance, type PerformanceReport } from "./performance";

const day = (i: number) => new Date(Date.UTC(2020, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
const mk = (n: number, f: (i: number) => number, step = 1) => Array.from({ length: n }, (_, i) => ({ date: day(i * step), close: f(i) }));
const rep = (m: ReturnType<typeof computePerformance>): PerformanceReport => { if (m.status !== "computed") throw new Error("na"); return m.value; };
const val = (m: { status: string; value?: number }) => { if (m.status !== "computed") throw new Error("na"); return m.value as number; };
const asset = (i: number) => 100 * Math.exp(0.002 * i + Math.sin(i / 2) * 0.05);
const bench = (i: number) => 100 * Math.exp(0.001 * i + Math.cos(i / 3) * 0.03);

describe("performance metrics arms (B191)", () => {
  it("detectPeriodsPerYear boundaries", () => {
    expect([4, 4.01, 9, 9.01, 35, 35.01].map(detectPeriodsPerYear)).toEqual([252, 52, 52, 12, 12, null]);
    expect(detectPeriodsPerYear(null)).toBeNull();
  });
  it("calmar = cagr / |maxDD| with 2dp, unavailable when no drawdown or <1y", () => {
    const h = mk(800, asset);
    const r = rep(computePerformance(h));
    const dd = r.maxDrawdown.status === "computed" ? r.maxDrawdown.value.maxDrawdownPct : 0;
    expect(dd).toBeLessThan(0);
    expect(val(r.calmarRatio)).toBeCloseTo(val(r.cagrPct) / Math.abs(dd), 1);
    expect(val(r.calmarRatio)).toBe(Number((val(r.cagrPct) / Math.abs(dd)).toFixed(2)));
    const up = rep(computePerformance(mk(800, (i) => 100 + i)));
    expect(up.calmarRatio.status).toBe("unavailable");
    const short = rep(computePerformance(mk(100, asset)));
    expect(short.cagrPct.status).toBe("unavailable");
    expect(short.calmarRatio.status).toBe("unavailable");
  });
  it("cagr needs >= 1 year: 365 days is short, 366 days is computed", () => {
    expect(rep(computePerformance(mk(366, asset))).cagrPct.status).toBe("unavailable");
    expect(rep(computePerformance(mk(368, asset))).cagrPct.status).toBe("computed");
  });
  it("benchmark ratios: exact tracking error, IR, beta, alpha", () => {
    const n = 120, a = mk(n, asset), b = mk(n, bench);
    const rf = 3;
    const r = rep(computePerformance(a, { benchmark: b, riskFreeAnnualPct: rf }));
    if (r.benchmark.status !== "computed") throw new Error("na");
    const c = r.benchmark.value;
    const ret = (s: { close: number }[]) => s.slice(1).map((x, i) => x.close / s[i].close - 1);
    const ar = ret(a), br = ret(b);
    const mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
    const sd = (x: number[]) => { const m = mean(x); return Math.sqrt(x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1)); };
    const act = ar.map((v, i) => v - br[i]);
    const ppy = 252;
    expect(c.overlapPoints).toBe(n);
    expect(val(c.trackingErrorPct)).toBeCloseTo(sd(act) * Math.sqrt(ppy) * 100, 2);
    expect(val(c.informationRatio)).toBeCloseTo((mean(act) / sd(act)) * Math.sqrt(ppy), 2);
    const ma = mean(ar), mb = mean(br);
    const cov = ar.reduce((s, v, i) => s + (v - ma) * (br[i] - mb), 0) / (ar.length - 1);
    const beta = cov / (sd(br) ** 2);
    expect(val(c.beta)).toBeCloseTo(beta, 3);
    const rfp = Math.pow(1.03, 1 / ppy) - 1;
    expect(val(c.alphaPct)).toBeCloseTo(((ma - rfp) - beta * (mb - rfp)) * ppy * 100, 1);
    expect(c.assetReturnPct).toBeCloseTo((a[n - 1].close / a[0].close - 1) * 100, 2);
    expect(c.benchmarkReturnPct).toBeCloseTo((b[n - 1].close / b[0].close - 1) * 100, 2);
    expect(c.excessReturnPct).toBeCloseTo(c.assetReturnPct - c.benchmarkReturnPct, 1);
  });
  it("short benchmark (sell-side): negative-correlated benchmark gives negative beta and alpha formula holds", () => {
    const n = 100, a = mk(n, asset);
    const b = mk(n, (i) => 100 * 100 / asset(i));
    const r = rep(computePerformance(a, { benchmark: b }));
    if (r.benchmark.status !== "computed") throw new Error("na");
    expect(val(r.benchmark.value.beta)).toBeLessThan(-0.5);
  });
  it("identical benchmark: zero tracking error -> IR/TE unavailable, beta 1, alpha 0", () => {
    const a = mk(60, asset);
    const r = rep(computePerformance(a, { benchmark: a }));
    if (r.benchmark.status !== "computed") throw new Error("na");
    const c = r.benchmark.value;
    expect(c.trackingErrorPct).toEqual({ status: "unavailable", reason: "Asset and benchmark returns are identical" });
    expect(c.informationRatio.status).toBe("unavailable");
    expect(val(c.beta)).toBe(1);
    expect(Math.abs(val(c.alphaPct))).toBe(0);
  });
  it("flat benchmark: beta and alpha unavailable", () => {
    const r = rep(computePerformance(mk(60, asset), { benchmark: mk(60, () => 50) }));
    if (r.benchmark.status !== "computed") throw new Error("na");
    expect(r.benchmark.value.beta.status).toBe("unavailable");
    expect(r.benchmark.value.alphaPct).toEqual({ status: "unavailable", reason: "Needs beta" });
    expect(r.benchmark.value.trackingErrorPct.status).toBe("computed");
  });
  it("overlap gates: <2 overlapping dates, 80% boundary, minReturns boundary, irregular spacing", () => {
    const a = mk(50, asset);
    const none = rep(computePerformance(a, { benchmark: mk(5, bench, 1).map((p) => ({ ...p, date: day(500 + Number(p.date.slice(-2))) })) }));
    expect(none.benchmark.status).toBe("unavailable");
    const oneOverlap = rep(computePerformance(a, { benchmark: [{ date: day(0), close: 100 }] }));
    expect(oneOverlap.benchmark.status).toBe("unavailable");
    // 40 of 50 = exactly 80% -> allowed; 39 of 50 -> blocked
    const b40 = rep(computePerformance(a, { benchmark: mk(40, bench) }));
    expect(b40.benchmark.status).toBe("computed");
    const b39 = rep(computePerformance(a, { benchmark: mk(39, bench) }));
    expect(b39.benchmark.status).toBe("unavailable");
    if (b39.benchmark.status === "unavailable") expect(b39.benchmark.reason).toMatch(/39 of 50/);
    // minReturns: 21 points => 20 returns computed, 20 points => 19 returns unavailable
    const m21 = rep(computePerformance(mk(21, asset), { benchmark: mk(21, bench) }));
    if (m21.benchmark.status !== "computed") throw new Error("na");
    expect(m21.benchmark.value.beta.status).toBe("computed");
    const m20 = rep(computePerformance(mk(20, asset), { benchmark: mk(20, bench) }));
    if (m20.benchmark.status !== "computed") throw new Error("na");
    expect(m20.benchmark.value.beta.status).toBe("unavailable");
    expect(m20.benchmark.value.alphaPct.status).toBe("unavailable");
    expect(m20.benchmark.value.excessReturnPct).toBeCloseTo(m20.benchmark.value.assetReturnPct - m20.benchmark.value.benchmarkReturnPct, 1);
    // irregular spacing
    const irr = rep(computePerformance(mk(40, asset, 100), { benchmark: mk(40, bench, 100) }));
    if (irr.benchmark.status !== "computed") throw new Error("na");
    expect(irr.benchmark.value.beta).toEqual({ status: "unavailable", reason: "Observation spacing is irregular" });
    expect(irr.benchmark.value.informationRatio.status).toBe("unavailable");
  });
  it("rf assumption reporting and sharpe sensitivity", () => {
    const h = mk(120, asset);
    const d = rep(computePerformance(h));
    expect(d.assumptions).toEqual({ riskFreeAnnualPct: 0, riskFreeSource: "assumed_zero" });
    const p = rep(computePerformance(h, { riskFreeAnnualPct: 0 }));
    expect(p.assumptions.riskFreeSource).toBe("provided");
    const hi = rep(computePerformance(h, { riskFreeAnnualPct: 5 }));
    expect(val(hi.sharpeRatio)).toBeLessThan(val(d.sharpeRatio));
    expect(val(hi.sortinoRatio)).toBeLessThan(val(d.sortinoRatio));
  });
  it("maxDrawdown recovered flag and split/trainTest guards", () => {
    const p = (xs: number[]) => xs.map((c, i) => ({ date: day(i), close: c }));
    const rec = maxDrawdown(p([10, 20, 10, 20]));
    const notRec = maxDrawdown(p([10, 20, 10, 19]));
    if (rec.status !== "computed" || notRec.status !== "computed") throw new Error("na");
    expect(rec.value.recovered).toBe(true);
    expect(notRec.value.recovered).toBe(false);
    expect(maxDrawdown(p([10, 11])).status === "computed" && (maxDrawdown(p([10, 11])) as { value: { recovered: boolean } }).value.recovered).toBe(false);
    expect(splitTrainTest(mk(20, asset), 0).status).toBe("unavailable");
    expect(splitTrainTest(mk(20, asset), 1).status).toBe("unavailable");
    expect(splitTrainTest(mk(20, asset), 0.5).status).toBe("computed");
    expect(splitTrainTest(mk(19, asset), 0.5).status).toBe("unavailable");
    const tt = computeTrainTestPerformance(mk(50, asset), { trainFraction: 0.6 });
    if (tt.status !== "computed") throw new Error("na");
    expect(tt.value.splitDate).toBe(day(30));
  });
});
