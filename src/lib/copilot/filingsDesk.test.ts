import { describe, expect, it, vi } from "vitest";
import { formatUsd, loadFilings, parseFilingsRequest } from "./filingsDesk";
import { planQuestion } from "./planner";
import { runTool } from "@/lib/intelligence/tools";

const FILING = {
  filing: {
    managerName: "BERKSHIRE HATHAWAY INC", reportDate: "2026-06-30", filingDate: "2026-08-14", form: "13F-HR",
    reportedTotalValueUsd: 299253556246, reportedEntryCount: 89, sourceUrl: "https://www.sec.gov/Archives/edgar/data/1067983/x/56757.xml",
    holdings: [{ issuer: "APPLE INC", titleOfClass: "COM", cusip: "037833100", valueUsd: 65950296923, shares: 227917808, shareType: "SH", weightPct: 22.04 }],
  },
};
const okFetch = () => vi.fn(async () => ({ ok: true, json: async () => FILING })) as unknown as typeof fetch;

describe("parseFilingsRequest", () => {
  it.each([
    ["What does Berkshire Hathaway hold? 13F", "0001067983"],
    ["Berkshire holdings", "0001067983"],
    ["show me the 13F of Bridgewater", "0001350694"],
    ["What does Burry own?", "0001649339"],
    ["מה יש בתיק של ברקשייר? החזקות", "0001067983"],
    ["במה מחזיק באפט", "0001067983"],
    ["13F holdings for CIK 1067983", "0001067983"],
  ])("%s", (q, cik) => expect(parseFilingsRequest(q)?.cik).toBe(cik));

  it.each([
    "What is a 13F filing?",
    "Should I buy Berkshire stock?",
    "מה זה 13F",
    "Berkshire Hathaway annual meeting date",
    "holdings of an unknown fund",
    "x".repeat(200) + " 13F berkshire",
  ])("does not fire for: %s", (q) => expect(parseFilingsRequest(q)).toBeNull());

  it("does not fire for a CIK without a holdings ask", () => expect(parseFilingsRequest("cik 1067983")).toBeNull());
});

describe("loadFilings", () => {
  const req = parseFilingsRequest("Berkshire 13F")!;
  it("returns the filing from the site's own endpoint", async () => {
    const f = okFetch();
    const r = await loadFilings(req, f);
    expect(r?.holdings[0].issuer).toBe("APPLE INC");
    expect((f as unknown as { mock: { calls: string[][] } }).mock.calls[0][0]).toBe("/api/sec-13f?cik=0001067983&top=10");
  });
  it("is null on HTTP errors, network errors and empty or malformed payloads, never partial", async () => {
    expect(await loadFilings(req, (async () => ({ ok: false, json: async () => ({}) })) as unknown as typeof fetch)).toBeNull();
    expect(await loadFilings(req, (async () => { throw new Error("x"); }) as unknown as typeof fetch)).toBeNull();
    expect(await loadFilings(req, (async () => ({ ok: true, json: async () => ({ filing: { holdings: [], reportDate: "2026-06-30" } }) })) as unknown as typeof fetch)).toBeNull();
    expect(await loadFilings(req, (async () => ({ ok: true, json: async () => ({ filing: { holdings: [{ issuer: "A", valueUsd: "x" }], reportDate: "2026-06-30" } }) })) as unknown as typeof fetch)).toBeNull();
  });
});

describe("formatUsd", () => {
  it("scales", () => {
    expect(formatUsd(65950296923)).toBe("$65.95B");
    expect(formatUsd(2_500_000)).toBe("$2.5M");
    expect(formatUsd(1234)).toBe("$1,234");
  });
});

describe("planner + tool", () => {
  it("routes to the filings tool with a DATA trace in both languages", () => {
    const p = planQuestion("What does Berkshire hold? 13F");
    expect(p.route).toBe("filings");
    expect(p.tools).toEqual(["filings"]);
    expect(p.trace.some((s) => s.trust === "DATA")).toBe(true);
    for (const s of p.trace) { expect(s.text.en.length).toBeGreaterThan(5); expect(s.text.he.length).toBeGreaterThan(5); }
  });
  it("runTool returns live provenance dated by the report date", async () => {
    vi.stubGlobal("fetch", okFetch());
    const out = await runTool("filings", parseFilingsRequest("Berkshire 13F"));
    vi.unstubAllGlobals();
    expect(out.ok).toBe(true);
    if (out.ok) { expect(out.result.provenance).toMatchObject({ state: "live", asOf: "2026-06-30" }); expect(out.result.trust).toBe("DATA"); }
  });
  it("runTool is unavailable when the endpoint fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    const out = await runTool("filings", parseFilingsRequest("Berkshire 13F"));
    vi.unstubAllGlobals();
    expect(out).toEqual({ ok: false, reason: "unavailable" });
  });
});
