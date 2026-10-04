import { describe, expect, it } from "vitest";
import { wbSections } from "./depth";
import type { WbResult, WbIndicator } from "./worldBankDesk";
const rows = (["basic", "junior", "senior", "professional"] as const).flatMap((level) => (["inflation", "gdp_growth", "unemployment", "gdp"] as WbIndicator[]).flatMap((indicator) => [0, 1, 3].map((count) => [level, indicator, count] as const)));
describe("[sweep] B177 World Bank depth uses available annual points and explicit data limits", () => {
  it.each(rows)("level %s indicator %s point count %s", (level, indicator, count) => {
    const result: WbResult = { indicator, country: "ISR", countryName: { en: "Israel", he: "ישראל" }, points: Array.from({ length: count }, (_, i) => ({ year: String(2023 + i), value: indicator === "gdp" ? (i + 1) * 1e11 : i + 1 })), lastUpdated: "2026-10-03" };
    const snapshot = JSON.stringify(result);
    const sections = wbSections(level, result);
    const expected = level === "basic" || !count ? [] : ["wbmeaning", ...(level !== "junior" && count > 1 ? ["wbrange"] : []), ...(level === "professional" ? ["wblimits"] : [])];
    expect(sections.map((s) => s.id)).toEqual(expected);
    for (const section of sections) {
      expect(section.title.he).toMatch(/[א-ת]/);
      expect(section.lines.length).toBeGreaterThan(0);
      expect(section.trust).toBe(section.id === "wbrange" ? "CALCULATION" : "DATA");
    }
    expect(JSON.stringify(result)).toBe(snapshot);
  });
});
describe("[hand] B177 no annual points cannot invent a country series", () => {
  it("keeps professional depth empty when the data series is absent", () => {
    expect(wbSections("professional", { indicator: "gdp", country: "ISR", countryName: { en: "Israel", he: "ישראל" }, points: [], lastUpdated: "" })).toEqual([]);
  });
});
