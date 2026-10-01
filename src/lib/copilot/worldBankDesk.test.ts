import { describe, expect, it } from "vitest";
import { loadWb, parseWbRequest } from "./worldBankDesk";
describe("worldBankDesk", () => {
  it("needs an indicator and a country", () => {
    expect(parseWbRequest("inflation in Israel")).toMatchObject({ indicator: "inflation", country: "ISR" });
    expect(parseWbRequest("אבטלה בארה\"ב")).toMatchObject({ indicator: "unemployment", country: "USA" });
    expect(parseWbRequest("GDP growth of Japan")).toMatchObject({ indicator: "gdp_growth", country: "JPN" });
    expect(parseWbRequest("what is inflation")).toBeNull();
    expect(parseWbRequest("Israel")).toBeNull();
  });
  it("loads, sorts by year, handles failure", async () => {
    const ok = (async () => ({ ok: true, json: async () => [{ lastupdated: "2026-07-13" }, [{ date: "2025", value: 3 }, { date: "2024", value: 3.1 }, { date: "2023", value: null }]] })) as unknown as typeof fetch;
    const r = await loadWb({ indicator: "inflation", country: "ISR", countryName: { en: "Israel", he: "ישראל" } }, ok);
    expect(r?.points.map((p) => p.year)).toEqual(["2024", "2025"]);
    const bad = (async () => { throw new Error("x"); }) as unknown as typeof fetch;
    expect(await loadWb({ indicator: "inflation", country: "ISR", countryName: { en: "", he: "" } }, bad)).toBeNull();
  });
});
