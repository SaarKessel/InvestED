/* eslint-disable @typescript-eslint/no-explicit-any */
// Independent (Python) recomputation of the headline performance metrics.
import { describe, expect, it } from "vitest";
import { computePerformance, detectPeriodsPerYear } from "./performance";

const date = (i: number) => new Date(Date.UTC(2020, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
const n = 400;
const a = Array.from({ length: n }, (_, i) => ({ date: date(i), close: Number((100 + 10 * Math.sin(i / 9) + 0.12 * i + 3 * Math.cos(i / 2.3)).toFixed(4)) }));
const b = Array.from({ length: n }, (_, i) => ({ date: date(i), close: Number((300 + 15 * Math.sin(i / 11) + 0.2 * i + Math.cos(i)).toFixed(4)) }));
const v = <T,>(m: { status: string; value?: T }) => { expect(m.status).toBe("computed"); return m.value as T; };

describe("computePerformance vs independent computation", () => {
  const r = computePerformance(a, { benchmark: b });
  const p = v(r as any) as any;
  it("return, CAGR, volatility, Sharpe, Sortino, drawdown, Calmar", () => {
    expect(p.totalReturnPct).toBe(44.67);
    expect(v(p.cagrPct)).toBe(40.22);
    expect(v(p.annualizedVolatilityPct)).toBe(15.63);
    expect(v(p.sharpeRatio)).toBe(1.57);
    expect(v(p.sortinoRatio)).toBe(2.41);
    expect((v(p.maxDrawdown) as any).maxDrawdownPct).toBe(-18.54);
    expect(v(p.calmarRatio)).toBe(2.17);
    expect(v(p.periodsPerYear)).toBe(252);
    expect(p.assumptions).toEqual({ riskFreeAnnualPct: 0, riskFreeSource: "assumed_zero" });
  });
  it("risk-free rate lowers Sharpe/Sortino exactly as computed independently (3% annual)", () => {
    const q = v(computePerformance(a, { riskFreeAnnualPct: 3 }) as any) as any;
    expect(v(q.sharpeRatio)).toBe(1.38);
    expect(v(q.sortinoRatio)).toBe(2.1);
    expect(q.assumptions.riskFreeSource).toBe("provided");
  });
  it("benchmark: beta, alpha, tracking error, information ratio, excess return", () => {
    const bm = v(p.benchmark) as any;
    expect(bm.assetReturnPct).toBe(44.67);
    expect(bm.benchmarkReturnPct).toBe(20.92);
    expect(bm.excessReturnPct).toBe(23.75);
    expect(v(bm.beta)).toBe(0.096);
    expect(v(bm.alphaPct)).toBe(23.38);
    expect(v(bm.trackingErrorPct)).toBe(16.4);
    expect(v(bm.informationRatio)).toBe(0.76);
    expect(bm.overlapPoints).toBe(400);
  });
  it("annualising frequency thresholds", () => {
    expect(detectPeriodsPerYear(4)).toBe(252); expect(detectPeriodsPerYear(4.01)).toBe(52);
    expect(detectPeriodsPerYear(9)).toBe(52); expect(detectPeriodsPerYear(9.01)).toBe(12);
    expect(detectPeriodsPerYear(35)).toBe(12); expect(detectPeriodsPerYear(35.01)).toBeNull();
    expect(detectPeriodsPerYear(null)).toBeNull();
  });
  it("CAGR withheld under one year; ratios withheld under the minimum returns", () => {
    const short = v(computePerformance(a.slice(0, 200)) as any) as any;
    expect(short.cagrPct.status).toBe("unavailable");
    expect(v(short.annualizedVolatilityPct)).toBeTypeOf("number");
    const few = v(computePerformance(a.slice(0, 21)) as any) as any; // 20 returns: enough
    expect(few.sharpeRatio.status).toBe("computed");
    const fewer = v(computePerformance(a.slice(0, 20)) as any) as any; // 19 returns
    expect(fewer.sharpeRatio.status).toBe("unavailable");
  });
  it("benchmark overlap below 80% is rejected", () => {
    const part = b.filter((_, i) => i % 5 !== 0 || i < 40).slice(0, 300); // ~ well under 400*0.8 after alignment
    const bm = (v(computePerformance(a, { benchmark: part }) as any) as any).benchmark;
    expect(bm.status).toBe("unavailable");
  });
});
