import { describe, expect, it, vi } from "vitest";
import { loadEtf, parseEtfRequest } from "./etfDesk";
import { planQuestion } from "./planner";
import { runTool } from "@/lib/intelligence/tools";

const FUND = { fund: { seriesName: "VANGUARD 500 INDEX FUND", reportDate: "2026-06-30", filingDate: "2026-08-28", netAssetsUsd: 1.67e12, totalHoldingCount: 520, shownWeightPct: 18.4, sourceUrl: "https://www.sec.gov/x", holdings: [{ name: "NVIDIA Corp", title: "NVIDIA", cusip: "67066G104", isin: "", balance: 1, units: "NS", valueUsd: 1e11, weightPct: 7.514, assetCategory: "EC", payoffProfile: "Long" }] } };
const okFetch = () => vi.fn(async () => ({ ok: true, json: async () => FUND })) as unknown as typeof fetch;

describe("parseEtfRequest", () => {
  it.each([
    ["What are the holdings of VOO?", "VOO"],
    ["voo holdings", "VOO"],
    ["what's inside QQQ", "QQQ"],
    ["top holdings of SPY", "SPY"],
    ["מה יש בתוך VOO", "VOO"],
    ["החזקות של VTI", "VTI"],
    ["constituents of XLK", "XLK"],
  ])("%s", (q, t) => expect(parseEtfRequest(q)?.ticker).toBe(t));
  it.each(["What are the holdings of Apple?", "What does Berkshire hold? 13F", "holdings of the ETF", "VOO price", "x".repeat(150) + " holdings VOO", "what is an ETF"])("does not fire: %s", (q) => expect(parseEtfRequest(q)).toBeNull());
});

describe("loadEtf", () => {
  it("loads from the site's own endpoint", async () => {
    const f = okFetch();
    const r = await loadEtf({ ticker: "VOO" }, f);
    expect(r?.reportDate).toBe("2026-06-30");
    expect((f as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]).toBe("/api/sec-nport?ticker=VOO&top=10");
  });
  it("null for errors, empty and malformed payloads", async () => {
    expect(await loadEtf({ ticker: "SPY" }, (async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch)).toBeNull();
    expect(await loadEtf({ ticker: "X" }, (async () => { throw new Error("x"); }) as unknown as typeof fetch)).toBeNull();
    expect(await loadEtf({ ticker: "X" }, (async () => ({ ok: true, json: async () => ({ fund: { holdings: [], reportDate: "2026-06-30" } }) })) as unknown as typeof fetch)).toBeNull();
    expect(await loadEtf({ ticker: "X" }, (async () => ({ ok: true, json: async () => ({ fund: { holdings: [{ name: "A", valueUsd: 1, weightPct: 1 }], reportDate: "" } }) })) as unknown as typeof fetch)).toBeNull();
  });
});

describe("planner + tool", () => {
  it("routes ETF holdings questions to the etf tool and 13F questions stay on filings", () => {
    expect(planQuestion("What are the holdings of VOO?").route).toBe("etf");
    expect(planQuestion("מה יש בתוך VOO").route).toBe("etf");
    expect(planQuestion("What does Berkshire hold? 13F").route).toBe("filings");
  });
  it("runTool: live provenance dated by report date; unavailable on failure", async () => {
    vi.stubGlobal("fetch", okFetch());
    const ok = await runTool("etf", { ticker: "VOO" });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    const bad = await runTool("etf", { ticker: "SPY" });
    vi.unstubAllGlobals();
    expect(ok.ok && ok.result.provenance).toMatchObject({ state: "live", asOf: "2026-06-30" });
    expect(bad).toEqual({ ok: false, reason: "unavailable" });
  });
});
