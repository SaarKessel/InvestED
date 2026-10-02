import { describe, expect, it, vi } from "vitest";
import { loadEcbRate, loadImf, parseEcbRate, parseImf } from "./official";
import handler from "../api/imfHandler";

const ecb = { dataSets: [{ series: { "0:0:0:0:0:0": { observations: { "0": [2.4, 0], "1": [2.15, 0], "2": [null, 0] } } } }], structure: { dimensions: { observation: [{ values: [{ id: "2025-04-23" }, { id: "2025-06-11" }, { id: "2026-06-17" }] }] } } };

describe("ECB", () => {
  it("parses dated rates, skips null observations, sorts", () => {
    const r = parseEcbRate(ecb);
    expect(r?.series).toEqual([{ date: "2025-04-23", ratePct: 2.4 }, { date: "2025-06-11", ratePct: 2.15 }]);
    expect(r?.latest.date).toBe("2025-06-11");
  });
  it("rejects malformed or multi-series payloads", () => {
    expect(parseEcbRate({})).toBeNull();
    expect(parseEcbRate({ dataSets: [{ series: { a: {}, b: {} } }], structure: { dimensions: { observation: [{ values: [] }] } } })).toBeNull();
    expect(parseEcbRate({ ...ecb, dataSets: [{ series: { a: { observations: { "0": ["x"] } } } }] })).toBeNull();
  });
  it("loadEcbRate returns null on errors", async () => {
    expect(await loadEcbRate(vi.fn().mockResolvedValue({ ok: false }) as never)).toBeNull();
    expect(await loadEcbRate(vi.fn().mockRejectedValue(new Error("x")) as never)).toBeNull();
    expect((await loadEcbRate(vi.fn().mockResolvedValue({ ok: true, json: async () => ecb }) as never))?.latest.ratePct).toBe(2.15);
  });
});

const imf = { values: { NGDP_RPCH: { ISR: { "2023": 2, "2024": 1, "2025": 2.9, "2026": 3.5, "2027": "n/a" } } } };
describe("IMF", () => {
  it("flags years after the last reported year as projections and drops non-numbers", () => {
    const p = parseImf(imf, "NGDP_RPCH", "ISR", 2025);
    expect(p?.map((x) => [x.year, x.projected])).toEqual([[2023, false], [2024, false], [2025, false], [2026, true]]);
  });
  it("returns null for missing country or indicator, and keeps only the latest N", () => {
    expect(parseImf(imf, "NGDP_RPCH", "USA", 2025)).toBeNull();
    expect(parseImf(imf, "LUR", "ISR", 2025)).toBeNull();
    expect(parseImf(imf, "NGDP_RPCH", "ISR", 2025, 2)?.map((x) => x.year)).toEqual([2025, 2026]);
  });
  it("loadImf marks the current year onward as projected", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => imf });
    const p = await loadImf("NGDP_RPCH", "ISR", f as never, new Date("2026-10-02T00:00:00Z"));
    expect(p?.find((x) => x.year === 2025)?.projected).toBe(false);
    expect(p?.find((x) => x.year === 2026)?.projected).toBe(true);
    expect(f).toHaveBeenCalledWith("/api/imf-weo?indicator=NGDP_RPCH&country=ISR");
  });
});

function call(query: Record<string, string>, fetcher: typeof fetch) {
  let out: { code: number; json: unknown } = { code: 0, json: null };
  const res = { setHeader() {}, status: (c: number) => ({ json: (j: unknown) => { out = { code: c, json: j }; } }) };
  return handler({ query }, res, fetcher).then(() => out);
}
describe("imf handler", () => {
  it("rejects anything outside the allowlist without calling upstream", async () => {
    const f = vi.fn();
    expect((await call({ indicator: "../x", country: "ISR" }, f as never)).code).toBe(400);
    expect((await call({ indicator: "LUR", country: "XXX" }, f as never)).code).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });
  it("forwards only the requested country and sends a contact User-Agent", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ values: { LUR: { ISR: { "2024": 3 }, USA: { "2024": 4 } } } }) });
    const r = await call({ indicator: "LUR", country: "ISR" }, f as never);
    expect(r).toEqual({ code: 200, json: { values: { LUR: { ISR: { "2024": 3 } } } } });
    expect(String((f.mock.calls[0][1] as { headers: Record<string, string> }).headers["User-Agent"])).toContain("@");
  });
  it("502 on upstream failure or missing country", async () => {
    expect((await call({ indicator: "LUR", country: "ISR" }, vi.fn().mockResolvedValue({ ok: false }) as never)).code).toBe(502);
    expect((await call({ indicator: "LUR", country: "ISR" }, vi.fn().mockResolvedValue({ ok: true, json: async () => ({ values: {} }) }) as never)).code).toBe(502);
    expect((await call({ indicator: "LUR", country: "ISR" }, vi.fn().mockRejectedValue(new Error("x")) as never)).code).toBe(502);
  });
});
