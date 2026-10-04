import { describe, expect, it } from "vitest";
import { cleanCloses, computeRisk, maxDrawdown, MIN_BETA_OVERLAP, MIN_DAYS, TRADING_DAYS } from "./riskMetrics";

const day = (i: number) => new Date(Date.UTC(2020, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
const series = (n: number, f: (i: number) => number) => Array.from({ length: n }, (_, i) => ({ date: day(i), close: f(i) }));

describe("riskMetrics boundaries (B191)", () => {
  it("constants", () => { expect([MIN_DAYS, MIN_BETA_OVERLAP, TRADING_DAYS]).toEqual([30, 60, 252]); });
  it("cleanCloses: dedupes by date (last wins), truncates to 10 chars, sorts, drops bad rows", () => {
    const c = cleanCloses([
      { date: "2020-01-03T10:00:00Z", close: 3 }, { date: "2020-01-01", close: 1 }, { date: "2020-01-01", close: 5 },
      { date: "2020-01-02", close: 0 }, { date: "2020-01-02", close: -1 }, { date: "2020-01-04", close: NaN }, { date: "2020-01-05", close: Infinity },
      { date: 5 as unknown as string, close: 2 }, null as unknown as { date: string; close: number },
    ]);
    expect(c).toEqual([{ date: "2020-01-01", close: 5 }, { date: "2020-01-03", close: 3 }]);
  });
  it("maxDrawdown: needs 2 points, reports peak/trough dates, flat series is 0 at first date", () => {
    expect(maxDrawdown([{ date: "a", close: 1 }])).toBeNull();
    expect(maxDrawdown([])).toBeNull();
    const d = maxDrawdown([{ date: "a", close: 100 }, { date: "b", close: 120 }, { date: "c", close: 60 }, { date: "d", close: 130 }, { date: "e", close: 117 }])!;
    expect(d).toEqual({ value: -0.5, peakDate: "b", troughDate: "c" });
    expect(maxDrawdown([{ date: "a", close: 5 }, { date: "b", close: 5 }])).toEqual({ value: 0, peakDate: "a", troughDate: "a" });
    expect(maxDrawdown([{ date: "a", close: 5 }, { date: "b", close: 6 }])!.value).toBe(0);
    // first of equal drawdowns wins (strict <)
    const t = maxDrawdown([{ date: "a", close: 10 }, { date: "b", close: 5 }, { date: "c", close: 10 }, { date: "d", close: 5 }])!;
    expect(t.troughDate).toBe("b");
    // equal to peak does not move the peak
    const e = maxDrawdown([{ date: "a", close: 10 }, { date: "b", close: 10 }, { date: "c", close: 5 }])!;
    expect(e.peakDate).toBe("a");
  });
  it("MIN_DAYS boundary: 29 closes unavailable, 30 available", () => {
    const r29 = computeRisk(series(29, (i) => 100 + i));
    expect(r29.volatility).toBeNull();
    expect(r29.maxDrawdown).toBeNull();
    expect(r29.missing).toEqual({ volatility: "too_few_days", drawdown: "too_few_days", beta: "no_benchmark" });
    const r30 = computeRisk(series(30, (i) => 100 + (i % 2)));
    expect(r30.volatility).not.toBeNull();
    expect(r30.maxDrawdown).not.toBeNull();
    expect(r30.missing.volatility).toBeUndefined();
    expect(r30.missing.drawdown).toBeUndefined();
  });
  it("volatility is annualised sample stdev with sqrt(252)", () => {
    const a = series(31, (i) => 100 * (i % 2 ? 1.01 : 1));
    const rs = a.slice(1).map((x, i) => x.close / a[i].close - 1);
    const m = rs.reduce((s, x) => s + x, 0) / rs.length;
    const sd = Math.sqrt(rs.reduce((s, x) => s + (x - m) ** 2, 0) / (rs.length - 1));
    expect(computeRisk(a).volatility).toBeCloseTo(sd * Math.sqrt(252), 12);
  });
  it("empty / single asset: from, to, periodReturn", () => {
    const e = computeRisk([]);
    expect([e.days, e.from, e.to, e.periodReturn]).toEqual([0, null, null, null]);
    const one = computeRisk([{ date: "2020-01-01", close: 5 }]);
    expect([one.from, one.to, one.periodReturn]).toEqual(["2020-01-01", "2020-01-01", null]);
    const two = computeRisk([{ date: "2020-01-01", close: 5 }, { date: "2020-01-02", close: 6 }]);
    expect(two.periodReturn).toBeCloseTo(0.2, 12);
    expect(two.to).toBe("2020-01-02");
  });
  it("beta: benchmark of 1 point / none / overlap boundary 59 vs 60 / flat benchmark / exact value", () => {
    const wob = (i: number) => 100 + Math.sin(i) * 3 + i * 0.1;
    const asset = series(100, wob);
    expect(computeRisk(asset, []).missing.beta).toBe("no_benchmark");
    expect(computeRisk(asset, [{ date: day(0), close: 1 }]).missing.beta).toBe("no_benchmark");
    expect(computeRisk(asset, series(2, wob)).missing.beta).toBe("too_few_overlap");
    const b60 = computeRisk(asset, series(61, wob)); // 60 overlapping returns
    expect(b60.betaDays).toBe(60);
    expect(b60.missing.beta).toBeUndefined();
    expect(b60.beta).toBeCloseTo(1, 9);
    const b59 = computeRisk(asset, series(60, wob));
    expect(b59.betaDays).toBe(59);
    expect(b59.missing.beta).toBe("too_few_overlap");
    expect(b59.beta).toBeNull();
    const flat = computeRisk(asset, series(100, () => 50));
    expect(flat.missing.beta).toBe("flat_benchmark");
    expect(flat.beta).toBeNull();
    // asset = 2x benchmark returns -> beta 2 (daily return scaling)
    const bench = series(100, (i) => 100 * Math.exp(Math.sin(i / 3) * 0.01 * i / 10 + i * 0.001));
    const rets = bench.slice(1).map((x, i) => x.close / bench[i].close - 1);
    let lvl = 100; const a2 = [{ date: day(0), close: lvl }];
    rets.forEach((r, i) => { lvl *= 1 + 2 * r; a2.push({ date: day(i + 1), close: lvl }); });
    expect(computeRisk(a2, bench).beta).toBeCloseTo(2, 9);
    // negative co-movement gives negative beta (sign of covariance)
    lvl = 100; const a3 = [{ date: day(0), close: lvl }];
    rets.forEach((r, i) => { lvl *= 1 - r; a3.push({ date: day(i + 1), close: lvl }); });
    expect(computeRisk(a3, bench).beta!).toBeLessThan(0);
  });
  it("beta matches dates only (misaligned dates do not pair)", () => {
    const asset = series(100, (i) => 100 + Math.sin(i) * 3);
    const shifted = Array.from({ length: 100 }, (_, i) => ({ date: day(i + 200), close: 100 + Math.sin(i) * 3 }));
    const r = computeRisk(asset, shifted);
    expect(r.betaDays).toBe(0);
    expect(r.missing.beta).toBe("too_few_overlap");
  });
});
