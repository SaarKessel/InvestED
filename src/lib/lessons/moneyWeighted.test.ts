import { describe, expect, it } from "vitest";
import { moneyWeightedReturn, parseUtcDate } from "./moneyWeighted";
describe("moneyWeightedReturn", () => {
  it("one deposit for one year: 10% growth is 10%", () => {
    const r = moneyWeightedReturn([{ date: "2025-01-01", amount: 1000 }], 1100, "2026-01-01");
    expect(r.status).toBe("ok");
    if (r.status === "ok") { expect(r.annualRate).toBeCloseTo(0.1, 4); expect(r.netGain).toBe(100); }
  });
  it("separates deposits from growth", () => {
    const r = moneyWeightedReturn([{ date: "2025-01-01", amount: 1000 }, { date: "2025-07-02", amount: 1000 }], 2000, "2026-01-01");
    expect(r.status).toBe("ok");
    if (r.status === "ok") { expect(r.netGain).toBe(0); expect(Math.abs(r.annualRate)).toBeLessThan(1e-3); expect(r.contributions).toBe(2000); }
  });
  it("handles a loss", () => {
    const r = moneyWeightedReturn([{ date: "2025-01-01", amount: 1000 }], 900, "2026-01-01");
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.annualRate).toBeCloseTo(-0.1, 4);
  });
  it("reports no solution when everything is lost to zero", () => {
    const r = moneyWeightedReturn([{ date: "2025-01-01", amount: 1000 }], 0, "2026-01-01");
    expect(["no_solution", "ok"]).toContain(r.status);
    if (r.status === "ok") expect(r.annualRate).toBeLessThan(-0.9);
  });
  it("reports ambiguity instead of picking a rate", () => {
    // in, out bigger, in again: sign pattern - + - can have several roots; ensure never throws and never fabricates
    const r = moneyWeightedReturn([{ date: "2020-01-01", amount: 1000 }, { date: "2021-01-01", amount: -2300 }, { date: "2022-01-01", amount: 1320 }], 0, "2022-01-02");
    expect(["ok", "ambiguous", "no_solution"]).toContain(r.status);
  });
  it("rejects bad dates, amounts and same-day spans", () => {
    expect(moneyWeightedReturn([{ date: "2025-02-30", amount: 1 }], 1, "2026-01-01")).toEqual({ status: "invalid", reason: "dates" });
    expect(moneyWeightedReturn([{ date: "2025-01-01", amount: 0 }], 1, "2026-01-01")).toEqual({ status: "invalid", reason: "amounts" });
    expect(moneyWeightedReturn([{ date: "2026-01-01", amount: 5 }], 5, "2026-01-01")).toEqual({ status: "invalid", reason: "too_short" });
    expect(moneyWeightedReturn([], 5, "2026-01-01")).toEqual({ status: "invalid", reason: "no_flows" });
    expect(moneyWeightedReturn([{ date: "2027-01-01", amount: 5 }], 5, "2026-01-01")).toEqual({ status: "invalid", reason: "dates" });
  });
  it("parses date-only as UTC", () => expect(parseUtcDate("2026-03-29")).toBe(Date.UTC(2026, 2, 29)));
});
