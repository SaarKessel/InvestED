import { describe, expect, it, vi } from "vitest";
import { loadMacro, parseMacroRequest } from "./macroDesk";
import { planQuestion } from "./planner";

describe("parseMacroRequest", () => {
  it("recognizes the ECB rate in English and Hebrew", () => {
    expect(parseMacroRequest("what is the ECB interest rate")).toEqual({ kind: "ecb_rate" });
    expect(parseMacroRequest("מה ריבית הבנק המרכזי האירופי")).toEqual({ kind: "ecb_rate" });
  });
  it("needs IMF plus an indicator plus a country", () => {
    expect(parseMacroRequest("IMF inflation Israel")).toMatchObject({ kind: "imf", indicator: "PCPIPCH", country: "ISR" });
    expect(parseMacroRequest("צמיחה בארה\"ב לפי קרן המטבע")).toMatchObject({ kind: "imf", indicator: "NGDP_RPCH", country: "USA" });
    expect(parseMacroRequest("IMF inflation")).toBeNull();
    expect(parseMacroRequest("inflation in Israel")).toBeNull(); // stays with the World Bank desk
    expect(parseMacroRequest("ECB")).toBeNull();
    expect(parseMacroRequest("x".repeat(200) + " IMF inflation Israel")).toBeNull();
  });
});

describe("loadMacro", () => {
  it("returns null when the source fails; nothing is invented", async () => {
    expect(await loadMacro({ kind: "ecb_rate" }, vi.fn().mockResolvedValue({ ok: false }) as never)).toBeNull();
    expect(await loadMacro({ kind: "imf", indicator: "LUR", country: "ISR", countryName: { en: "Israel", he: "ישראל" } }, vi.fn().mockRejectedValue(new Error("x")) as never)).toBeNull();
  });
  it("loads IMF points with a retrieval date", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ values: { LUR: { ISR: { "2025": 3, "2026": 3.1 } } } }) });
    const r = await loadMacro({ kind: "imf", indicator: "LUR", country: "ISR", countryName: { en: "Israel", he: "ישראל" } }, f as never, new Date("2026-10-02T00:00:00Z"));
    expect(r?.kind === "imf" && r.retrievedOn).toBe("2026-10-02");
    expect(r?.kind === "imf" && r.points.map((p) => p.projected)).toEqual([false, true]);
  });
});

describe("planner", () => {
  it("routes to the macro tool, before the World Bank desk", () => {
    const p = planQuestion("IMF inflation Israel");
    expect(p.route).toBe("macro");
    expect(p.tools).toEqual(["macro"]);
    expect(planQuestion("inflation in Israel").route).toBe("wb");
  });
});
