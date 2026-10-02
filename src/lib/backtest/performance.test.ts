import { describe, expect, it } from "vitest";

import {
  cleanSeries,
  computePerformance,
  computeTrainTestPerformance,
  detectPeriodsPerYear,
  maxDrawdown,
  splitTrainTest,
  type BenchmarkComparison,
  type PerformanceReport,
} from "./performance";

function dailySeries(closes: number[], start = "2024-01-01") {
  const out: { date: string; close: number }[] = [];
  const d = new Date(`${start}T00:00:00Z`);
  for (const close of closes) {
    out.push({ date: d.toISOString().slice(0, 10), close });
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function monthlySeries(closes: number[]) {
  return closes.map((close, i) => ({ date: `${2020 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}-01`, close }));
}

const report = (m: ReturnType<typeof computePerformance>): PerformanceReport => {
  if (m.status !== "computed") throw new Error(m.reason);
  return m.value;
};

describe("cleanSeries", () => {
  it("drops invalid and duplicate points and counts them, never fills", () => {
    const { points, quality } = cleanSeries([
      { date: "2024-01-03", close: 12 },
      { date: "2024-01-01", close: 10 },
      { date: "2024-01-02", close: Number.NaN },
      { date: "2024-01-04", close: 0 },
      { date: "2024-01-03", close: 13 },
    ]);
    expect(points.map((p) => p.date)).toEqual(["2024-01-01", "2024-01-03"]);
    expect(quality).toMatchObject({ inputPoints: 5, usedPoints: 2, droppedInvalidPrice: 2, droppedDuplicateDate: 1 });
  });
});

describe("detectPeriodsPerYear", () => {
  it.each([[1, 252], [3, 252], [7, 52], [30, 12], [90, null], [null, null]])("%s days -> %s", (gap, ppy) => {
    expect(detectPeriodsPerYear(gap as number | null)).toBe(ppy);
  });
});

describe("maxDrawdown", () => {
  it("finds the worst peak-to-trough and recovery", () => {
    const m = maxDrawdown(dailySeries([100, 120, 90, 110, 130]));
    expect(m).toEqual({ status: "computed", value: { maxDrawdownPct: -25, peakDate: "2024-01-02", troughDate: "2024-01-03", recovered: true } });
  });
  it("reports not recovered", () => {
    const m = maxDrawdown(dailySeries([100, 50, 60]));
    expect(m.status === "computed" && m.value.recovered).toBe(false);
  });
  it("is 0 for a rising series", () => {
    const m = maxDrawdown(dailySeries([1, 2, 3]));
    expect(m.status === "computed" && m.value.maxDrawdownPct === 0).toBe(true);
  });
});

describe("computePerformance", () => {
  it("is unavailable, not zero, with too little data", () => {
    const m = computePerformance(dailySeries([100]));
    expect(m.status).toBe("unavailable");
  });

  it("labels ratio metrics unavailable when there are too few returns", () => {
    const r = report(computePerformance(dailySeries([100, 101, 102])));
    expect(r.sharpeRatio.status).toBe("unavailable");
    expect(r.annualizedVolatilityPct.status).toBe("unavailable");
    expect(r.totalReturnPct).toBe(2);
    expect(r.cagrPct.status).toBe("unavailable"); // under a year
  });

  it("computes Sharpe on a known monthly series (sample std, rf = 0 assumed)", () => {
    // monthly returns alternate +10% / -5%
    const closes = [100];
    for (let i = 0; i < 24; i++) closes.push(closes[i] * (i % 2 === 0 ? 1.1 : 0.95));
    const r = report(computePerformance(monthlySeries(closes), { minReturns: 12 }));
    const rets = closes.slice(1).map((c, i) => c / closes[i] - 1);
    const m = rets.reduce((a, b) => a + b, 0) / rets.length;
    const sd = Math.sqrt(rets.reduce((s, v) => s + (v - m) ** 2, 0) / (rets.length - 1));
    expect(r.sharpeRatio).toEqual({ status: "computed", value: Number(((m / sd) * Math.sqrt(12)).toFixed(2)) });
    expect(r.annualizedVolatilityPct).toEqual({ status: "computed", value: Number((sd * Math.sqrt(12) * 100).toFixed(2)) });
    expect(r.assumptions).toEqual({ riskFreeAnnualPct: 0, riskFreeSource: "assumed_zero" });
    expect(r.historicalOnly).toBe(true);
  });

  it("a provided risk-free rate lowers Sharpe and is reported as provided", () => {
    const closes = [100];
    for (let i = 0; i < 24; i++) closes.push(closes[i] * (i % 2 === 0 ? 1.1 : 0.95));
    const base = report(computePerformance(monthlySeries(closes), { minReturns: 12 }));
    const rf = report(computePerformance(monthlySeries(closes), { minReturns: 12, riskFreeAnnualPct: 4 }));
    expect(rf.assumptions.riskFreeSource).toBe("provided");
    expect((rf.sharpeRatio as { value: number }).value).toBeLessThan((base.sharpeRatio as { value: number }).value);
  });

  it("zero volatility is unavailable, not infinite", () => {
    const closes = Array.from({ length: 30 }, () => 100);
    const r = report(computePerformance(dailySeries(closes)));
    expect(r.sharpeRatio).toEqual({ status: "unavailable", reason: "Zero volatility" });
  });

  it("CAGR needs at least a year", () => {
    const r = report(computePerformance(monthlySeries([100, ...Array.from({ length: 24 }, (_, i) => 100 * 1.01 ** (i + 1))]), { minReturns: 12 }));
    expect(r.cagrPct.status).toBe("computed");
    expect(r.calmarRatio.status).toBe("unavailable"); // never drew down
  });
});

describe("benchmark comparison", () => {
  const base = monthlySeries([100, ...Array.from({ length: 35 }, (_, i) => 100 * 1.02 ** (i + 1) * (i % 3 === 0 ? 0.99 : 1))]);
  it("beta of an asset that is 2x the benchmark returns is ~2 and excess is aligned", () => {
    const bRets = Array.from({ length: 36 }, (_, i) => (i % 2 ? 0.03 : -0.01));
    const benchCloses = [100];
    const assetCloses = [100];
    bRets.forEach((r, i) => {
      benchCloses.push(benchCloses[i] * (1 + r));
      assetCloses.push(assetCloses[i] * (1 + 2 * r));
    });
    const r = report(computePerformance(monthlySeries(assetCloses), { benchmark: monthlySeries(benchCloses), minReturns: 12 }));
    expect(r.benchmark.status).toBe("computed");
    const b = (r.benchmark as { value: BenchmarkComparison }).value;
    expect(b.beta).toEqual({ status: "computed", value: 2 });
    expect(b.overlapPoints).toBe(37);
    expect(b.excessReturnPct).toBeCloseTo(b.assetReturnPct - b.benchmarkReturnPct, 1);
    expect(b.alphaPct.status).toBe("computed");
  });

  it("identical asset and benchmark: beta 1, tracking error unavailable", () => {
    const r = report(computePerformance(base, { benchmark: base, minReturns: 12 }));
    const b = (r.benchmark as { value: BenchmarkComparison }).value;
    expect(b.beta).toEqual({ status: "computed", value: 1 });
    expect(b.excessReturnPct).toBe(0);
    expect(b.trackingErrorPct.status).toBe("unavailable");
  });

  it("refuses to compare when the benchmark overlaps under 80% of dates (no filling)", () => {
    const sparse = base.filter((_, i) => i % 2 === 0);
    const r = report(computePerformance(base, { benchmark: sparse, minReturns: 12 }));
    expect(r.benchmark.status).toBe("unavailable");
  });

  it("no benchmark means unavailable with a reason", () => {
    expect(report(computePerformance(base)).benchmark).toEqual({ status: "unavailable", reason: "No benchmark supplied" });
  });
});

describe("train/test split", () => {
  const series = dailySeries(Array.from({ length: 100 }, (_, i) => 100 + i));
  it("splits chronologically with no overlap", () => {
    const s = splitTrainTest(series, 0.7);
    if (s.status !== "computed") throw new Error("expected computed");
    expect(s.value.train).toHaveLength(70);
    expect(s.value.test).toHaveLength(30);
    expect(s.value.train.at(-1)!.date < s.value.test[0].date).toBe(true);
    expect(s.value.splitDate).toBe(s.value.test[0].date);
  });
  it("is unavailable when a window would be too small", () => {
    expect(splitTrainTest(dailySeries([1, 2, 3, 4, 5, 6]), 0.7).status).toBe("unavailable");
  });
  it("rejects invalid fractions", () => {
    expect(splitTrainTest(series, 1).status).toBe("unavailable");
    expect(splitTrainTest(series, 0).status).toBe("unavailable");
  });
  it("reports in-sample and out-of-sample separately", () => {
    const m = computeTrainTestPerformance(series, { trainFraction: 0.6, minReturns: 10 });
    if (m.status !== "computed") throw new Error("expected computed");
    expect(m.value.inSample.status).toBe("computed");
    expect(m.value.outOfSample.status).toBe("computed");
  });
});
