import { describe, expect, it } from "vitest";
import { depthSections } from "./depth";
import type { FxResult } from "./fxDesk";
import type { WbResult } from "./worldBankDesk";

const fx: FxResult = { amount: 100, from: "USD", to: "ILS", rate: 3.5, date: "2026-10-01", result: 350 };
const wb: WbResult = { indicator: "inflation", country: "ISR", countryName: { en: "Israel", he: "ישראל" }, lastUpdated: "x", points: [{ year: "2020", value: 1 }, { year: "2021", value: 3 }, { year: "2022", value: 5 }] };

describe("depth for desk cards", () => {
  it("BASIC adds nothing", () => {
    expect(depthSections("basic", { fx })).toEqual([]);
    expect(depthSections("basic", { wb })).toEqual([]);
  });
  it("FX senior shows the inverse and a 1% what-if from the fixed numbers", () => {
    const s = depthSections("senior", { fx }).find((x) => x.id === "fxsens")!;
    expect(s.lines[0].en).toContain(`1 ILS = ${(1 / 3.5).toFixed(4)} USD`);
    expect(s.lines[1].en).toContain("346.5 ILS");
  });
  it("World Bank senior reports average, high and low with years", () => {
    const s = depthSections("senior", { wb }).find((x) => x.id === "wbrange")!;
    expect(s.lines[0].en).toBe("Average 3%. Highest 5% in 2022. Lowest 1% in 2020.");
  });
  it("professional adds limits for fx, wb, symbol and scenario", () => {
    expect(depthSections("professional", { fx }).some((x) => x.id === "fxlimits")).toBe(true);
    expect(depthSections("professional", { wb }).some((x) => x.id === "wblimits")).toBe(true);
    expect(depthSections("professional", { symbol: { symbol: "VOO", kind: "fund", name: "n", sector: null, size: null, issuer: null } }).some((x) => x.id === "symlimits")).toBe(true);
    expect(depthSections("professional", { scenario: [] }).some((x) => x.id === "sclimits")).toBe(true);
  });
  it("math card: junior and senior explain, professional states limits, BASIC and failures add nothing", () => {
    const m = { ok: true, expression: "2+3*4", value: 14, steps: [{ text: "x" }, { text: "y" }] } as never;
    expect(depthSections("basic", { math: m })).toEqual([]);
    expect(depthSections("junior", { math: m }).map((x) => x.id)).toEqual(["mathread"]);
    expect(depthSections("professional", { math: m }).map((x) => x.id)).toEqual(["mathread", "mathcheck", "mathlimits"]);
    expect(depthSections("professional", { math: { ok: false, expression: "", steps: [] } as never })).toEqual([]);
  });
});
