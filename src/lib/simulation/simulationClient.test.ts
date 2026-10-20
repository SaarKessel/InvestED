// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchSimulationQuotes } from "./simulationClient";

const asset = (symbol: string, price: number | null) => ({ symbol, price, currency: "USD", dataSource: "yahoo", timestamp: "2026-10-20T10:00:00Z", freshness: "live", isMock: false });

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(async () => ({
    ok: true,
    json: async () => ({ assets: [asset("SPY", 500), asset("QQQ", 400)] }),
  })));
});
afterEach(() => vi.unstubAllGlobals());

describe("fetchSimulationQuotes", () => {
  it("maps returned assets by symbol and marks missing ones null", async () => {
    const out = await fetchSimulationQuotes(["SPY", "BAD", "QQQ"]);
    expect(out.SPY?.price).toBe(500);
    expect(out.QQQ?.price).toBe(400);
    expect(out.BAD).toBeNull();
  });
  it("treats non-finite or absent prices as unavailable", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, json: async () => ({ assets: [asset("SPY", null), { symbol: "QQQ", price: "x" }] }) });
    const out = await fetchSimulationQuotes(["SPY", "QQQ"]);
    expect(out.SPY).toBeNull();
    expect(out.QQQ).toBeNull();
  });
  it("chunks requests at 8 symbols", async () => {
    await fetchSimulationQuotes(Array.from({ length: 9 }, (_, i) => `S${i}`));
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
  });
  it("throws when the API answers an error status", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });
    await expect(fetchSimulationQuotes(["SPY"])).rejects.toThrow("500");
  });
});
