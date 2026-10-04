// Independent (Python) recomputation of volatility, beta and max drawdown.
import { describe, expect, it } from "vitest";
import { computeRisk, maxDrawdown, MIN_BETA_OVERLAP, MIN_DAYS } from "./riskMetrics";

const date = (i: number) => new Date(Date.UTC(2020, 0, 1) + i * 86_400_000).toISOString().slice(0, 10);
const n = 90;
const a = Array.from({ length: n }, (_, i) => ({ date: date(i), close: Number((100 + 8 * Math.sin(i / 5) + 0.15 * i + 2 * Math.cos(i / 2)).toFixed(4)) }));
const b = Array.from({ length: n }, (_, i) => ({ date: date(i), close: Number((200 + 10 * Math.sin(i / 6) + 0.1 * i).toFixed(4)) }));

describe("riskMetrics vs independent computation", () => {
  it("beta, annualised volatility, period return, drawdown dates", () => {
    const r = computeRisk(a, b);
    expect(r.beta).toBeCloseTo(0.12921118221018793, 10);
    expect(r.betaDays).toBe(89);
    expect(r.volatility).toBeCloseTo(0.19290489998384108, 10);
    expect(r.periodReturn).toBeCloseTo(0.060297058823529426, 12);
    expect(r.maxDrawdown!.value).toBeCloseTo(-0.14544399202980163, 12);
    expect(r.maxDrawdown!.peakDate).toBe("2020-02-09");
    expect(r.maxDrawdown!.troughDate).toBe("2020-02-26");
    expect(r.days).toBe(90);
    expect(r.from).toBe(date(0));
    expect(r.to).toBe(date(89));
  });
  it("beta of a series against itself is 1 and against 2x leveraged returns scales", () => {
    expect(computeRisk(a, a).beta).toBeCloseTo(1, 12);
  });
  it("thresholds: 30 days needed for vol/drawdown, 60 overlapping returns for beta", () => {
    expect(MIN_DAYS).toBe(30); expect(MIN_BETA_OVERLAP).toBe(60);
    expect(computeRisk(a.slice(0, 29)).volatility).toBeNull();
    expect(computeRisk(a.slice(0, 29)).maxDrawdown).toBeNull();
    expect(computeRisk(a.slice(0, 30)).volatility).not.toBeNull();
    expect(computeRisk(a.slice(0, 30)).maxDrawdown).not.toBeNull();
    expect(computeRisk(a.slice(0, 61), b.slice(0, 61)).beta).not.toBeNull(); // 60 return pairs
    const r = computeRisk(a.slice(0, 60), b.slice(0, 60));
    expect(r.beta).toBeNull(); expect(r.missing.beta).toBe("too_few_overlap"); expect(r.betaDays).toBe(59);
    expect(computeRisk(a).missing.beta).toBe("no_benchmark");
    const flat = b.map((p) => ({ ...p, close: 100 }));
    expect(computeRisk(a, flat).missing.beta).toBe("flat_benchmark");
  });
  it("maxDrawdown: simple known path and recovery", () => {
    const p = [100, 120, 90, 130, 117, 140].map((close, i) => ({ date: date(i), close }));
    const d = maxDrawdown(p)!;
    expect(d.value).toBeCloseTo(90 / 120 - 1, 12);
    expect(d.peakDate).toBe(date(1)); expect(d.troughDate).toBe(date(2));
    expect(maxDrawdown([{ date: "x", close: 5 }])).toBeNull();
    expect(maxDrawdown(p.slice(0, 2).map((x, i) => ({ ...x, close: [100, 110][i] })))!.value).toBe(0);
  });
});
