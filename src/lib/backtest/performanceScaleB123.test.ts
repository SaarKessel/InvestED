import { describe, expect, it } from "vitest";
import { computePerformance } from "./performance";

const rows: Array<[number, number, number]> = [];
for (const rise of [0.01, 0.03, 0.08]) for (const fall of [-0.01, -0.03, -0.06]) for (const periods of [24, 36, 60]) rows.push([rise, fall, periods]);
const history = (up: number, down: number, n: number) => {
  let price = 100;
  return Array.from({ length: n + 1 }, (_, i) => {
    if (i) price *= 1 + (i % 2 ? up : down);
    return { date: `${2020 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, "0")}-01`, close: price };
  });
};
describe("[sweep] B123 performance scale invariance and identical benchmark", () => {
  it.each(rows)("rise %s fall %s periods %s", (up, down, n) => {
    const h = history(up, down, n);
    const a = computePerformance(h, { minReturns: 12 });
    const b = computePerformance([...h].reverse().map((p) => ({ ...p, close: p.close * 2 })), { minReturns: 12 });
    expect(b).toEqual(a);
    const r = computePerformance(h, { benchmark: h, minReturns: 12 });
    expect(r.status).toBe("computed");
    if (r.status !== "computed" || r.value.benchmark.status !== "computed") throw new Error("expected benchmark comparison");
    const bench = r.value.benchmark.value;
    expect(bench.beta).toEqual({ status: "computed", value: 1 });
    expect(bench.excessReturnPct).toBe(0);
    expect(bench.alphaPct).toEqual({ status: "computed", value: 0 });
    expect(bench.trackingErrorPct.status).toBe("unavailable");
    expect(bench.informationRatio.status).toBe("unavailable");
    expect(r.value.historicalOnly).toBe(true);
  });
});
describe("[hand] B123 short-history annualization refusal", () => {
  it("a large short-term gain does not become a projected annual return", () => {
    const r = computePerformance([{ date: "2026-01-01", close: 100 }, { date: "2026-01-02", close: 200 }]);
    expect(r.status).toBe("computed");
    if (r.status === "computed") {
      expect(r.value.totalReturnPct).toBe(100);
      expect(r.value.cagrPct.status).toBe("unavailable");
      expect(r.value.sharpeRatio.status).toBe("unavailable");
    }
  });
});
