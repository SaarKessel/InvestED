import { describe, expect, it } from "vitest";
import { annual, buildLenses, parseCompanyFacts, type PersonaFacts, type YearValue } from "./personaLens";

const yv = (vals: number[], start = 2021): YearValue[] => vals.map((val, i) => ({ fy: start + i, end: `${start + i}-12-31`, val }));
const base: PersonaFacts = {
  cik: "1", name: "Test Co", sharesOutstanding: 100,
  equity: yv([800, 900, 1000, 1000, 1000]), netIncome: yv([100, 120, 140, 160, 200]), revenue: yv([1000, 1000, 1000, 1000, 1000]), epsDiluted: yv([1, 1.2, 1.4, 1.6, 2]),
  liabilities: yv([500, 500, 500, 500, 600]), currentAssets: yv([900, 900, 900, 900, 1500]), currentLiabilities: yv([400, 400, 400, 400, 500]), longTermDebt: yv([100, 100, 100, 100, 100]),
};
const pick = (lens: ReturnType<typeof buildLenses>["lenses"], persona: string, id: string) => lens.find((l) => l.persona === persona)!.criteria.find((c) => c.id === id)!;

describe("persona lens", () => {
  it("computes transparent pass/fail from facts and price", () => {
    const { derived, lenses } = buildLenses(base, 10);
    expect(derived.roe).toBeCloseTo(20); expect(derived.netMargin).toBeCloseTo(20); expect(derived.pe).toBeCloseTo(5); expect(derived.pb).toBeCloseTo(1); expect(derived.currentRatio).toBeCloseTo(3);
    expect(pick(lenses, "buffett", "roe").status).toBe("pass");
    expect(pick(lenses, "buffett", "steady").status).toBe("pass");
    expect(pick(lenses, "buffett", "debt").status).toBe("pass");
    expect(pick(lenses, "graham", "pe").status).toBe("pass");
    expect(pick(lenses, "graham", "pepb").status).toBe("pass");
    expect(pick(lenses, "graham", "netnet").status).toBe("fail"); // (1500-600)/100 = 9; 2/3 of it = 6; price 10 is above
    expect(derived.epsCagr3y).toBeCloseTo((Math.pow(2 / 1.2, 1 / 3) - 1) * 100, 5);
    expect(pick(lenses, "lynch", "peg").status).toBe("pass");
  });
  it("net-net passes when price is below two thirds of net current value", () => {
    expect(pick(buildLenses(base, 5).lenses, "graham", "netnet").status).toBe("pass");
  });
  it("shows unavailable, never fills in, when inputs are missing", () => {
    const thin: PersonaFacts = { ...base, epsDiluted: [], sharesOutstanding: null, netIncome: yv([100, 120]), longTermDebt: [] };
    const { lenses } = buildLenses(thin, null);
    expect(pick(lenses, "graham", "pe").status).toBe("unavailable");
    expect(pick(lenses, "graham", "pb").status).toBe("unavailable");
    expect(pick(lenses, "graham", "netnet").status).toBe("unavailable");
    expect(pick(lenses, "lynch", "peg").status).toBe("unavailable");
    expect(pick(lenses, "buffett", "steady").status).toBe("unavailable");
    expect(pick(lenses, "buffett", "debt").status).toBe("pass"); // no debt filed counts as zero years only when earnings are positive
  });
  it("loss-making company fails the earnings tests and has no P/E", () => {
    const loss: PersonaFacts = { ...base, netIncome: yv([-5, -5, -5, -5, -5]), epsDiluted: yv([-1, -1, -1, -1, -1]) };
    const { derived, lenses } = buildLenses(loss, 10);
    expect(derived.pe).toBeNull();
    expect(pick(lenses, "buffett", "steady").status).toBe("fail");
    expect(pick(lenses, "buffett", "debt").status).toBe("unavailable");
  });
  it("moat and margin of safety are judgment items, not scored", () => {
    const l = buildLenses(base, 10).lenses[0];
    expect(l.criteria.filter((c) => c.status === "judgment").map((c) => c.id)).toEqual(["moat", "mos"]);
    expect(l.checked).toBe(l.criteria.filter((c) => c.status === "pass" || c.status === "fail").length);
  });
  it("annual keeps the latest row per year", () => {
    expect(annual([{ fy: 2020, end: "2020-06-30", val: 1 }, { fy: 2020, end: "2020-12-31", val: 2 }])).toEqual([{ fy: 2020, end: "2020-12-31", val: 2 }]);
  });
  it("parses SEC companyfacts, 10-K full-year rows only, keyed by period end", () => {
    const f = (end: string, val: number, extra = {}) => ({ end, val, fy: 2025, fp: "FY", form: "10-K", ...extra });
    const json = { entityName: "X Corp", facts: { "us-gaap": {
      StockholdersEquity: { units: { USD: [f("2024-12-31", 50), f("2025-12-31", 60), f("2025-06-30", 99, { fp: "Q2", form: "10-Q" })] } },
      NetIncomeLoss: { units: { USD: [f("2025-12-31", 10)] } },
      CommonStockSharesOutstanding: { units: { shares: [f("2025-12-31", 7)] } },
    } } };
    const p = parseCompanyFacts(json, "1")!;
    expect(p.equity.map((x) => x.val)).toEqual([50, 60]); expect(p.sharesOutstanding).toBe(7); expect(p.name).toBe("X Corp");
    expect(parseCompanyFacts({}, "1")).toBeNull();
    expect(parseCompanyFacts({ facts: { "us-gaap": {} } }, "1")).toBeNull();
  });
});
