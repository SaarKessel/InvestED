import { describe, expect, it, vi } from "vitest";
import { buildBriefFacts, fetchScenarioBrief, moveOver, validateBrief } from "./scenarioBrief";
import handler, { parseFacts } from "../api/researchBriefHandler";
import type { AssetResearch } from "./assetResearchEngine";

const hist = (n: number) => Array.from({ length: n }, (_, i) => ({ date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`, close: 100 + i })) as unknown as AssetResearch["history"];
const mkResearch = (n: number): AssetResearch => ({
  symbol: "NVDA", name: "NVIDIA", assetType: "stock",
  quote: { changeKnown: true, price: 150, previousClose: 148, change: 2, changePercent: 1.35, volume: 1, currency: "USD", marketStatus: "open" },
  provenance: { source: "yahoo" as never, timestamp: null, freshness: "live" as never, isMock: false },
  history: hist(n),
  indicators: { volatilityPct: { status: "available", value: 2.5 }, rsi14: { status: "available", value: 61.2 }, sma20: { status: "insufficient_history", value: null }, sma50: { status: "available", value: 140 }, ema20: { status: "available", value: 1 }, macd: { status: "unavailable", value: null } },
  fundamentals: { status: "unavailable", value: null }, news: { status: "unavailable", value: null }, profileRelevance: [], strategyRelevance: [], educationalSummary: [],
});

describe("facts", () => {
  it("computes moves and lists missing inputs instead of filling them", () => {
    expect(moveOver(hist(10), 5)).toBeCloseTo(((109 / 104) - 1) * 100, 6);
    expect(moveOver(hist(3), 5)).toBeNull();
    const f = buildBriefFacts(mkResearch(30), []);
    expect(f.lines.some((l) => l.includes("20 observations"))).toBe(true);
    expect(f.unavailable.join("|")).toMatch(/60 observations/);
    expect(f.unavailable.join("|")).toMatch(/SMA20/);
    expect(f.unavailable.join("|")).toMatch(/basic financials/);
    expect(f.unavailable.join("|")).toMatch(/news/);
    expect(f.lines.join("|")).not.toMatch(/SMA20 is/);
  });
  it("localizes committee evidence in Hebrew without changing its measured values", () => {
    const f = buildBriefFacts(mkResearch(30), [], "he");
    expect(f.lines).toContain("מחיר אחרון 150.00 USD.");
    expect(f.lines).toContain("שינוי יומי 1.35%.");
    expect(f.lines).toContain("מדד RSI (14): 61.20.");
    expect(f.lines).toContain("SMA50: 140.00 (המחיר מעל לממוצע).");
    expect(f.lines.join(" ")).not.toMatch(/Last price|Daily change|RSI\(14\) is|price is above/);
    expect(f.unavailable.join(" ")).toContain("נתונים פיננסיים בסיסיים");
  });
  it("includes headlines when present", () => {
    const f = buildBriefFacts(mkResearch(30), [{ title: "NVIDIA launches chip", publishedAt: "2026-09-30T10:00:00Z" }]);
    expect(f.lines.some((l) => l.includes("NVIDIA launches chip"))).toBe(true);
    expect(f.unavailable.join("|")).not.toMatch(/news/);
  });
});

describe("validateBrief", () => {
  const facts = buildBriefFacts(mkResearch(30), []);
  it("keeps grounded items and caps lengths", () => {
    const b = validateBrief({ positives: ["RSI(14) is 61.20, not extreme.", "a", "b", "c"], concerns: ["Basic financials are unavailable."], outlook: ["If the 5 observations trend continues, momentum may persist."] }, facts);
    expect(b?.positives.length).toBe(3);
    expect(b?.concerns).toHaveLength(1);
  });
  it("rejects forecasts, advice, invented numbers and tickers", () => {
    const b = validateBrief({
      positives: ["The price will rise next month.", "Analysts set a price target of 200.", "You should buy NVDA."],
      concerns: ["Revenue grew 45 percent.", "Competitor AMD is gaining."],
      outlook: ["יעד מחיר גבוה יותר", "This is strong buy."],
    }, facts);
    expect(b).toBeNull();
  });
  it("returns null for junk", () => { expect(validateBrief(null, facts)).toBeNull(); expect(validateBrief({ positives: "x" }, facts)).toBeNull(); });
});

describe("fetchScenarioBrief", () => {
  const facts = buildBriefFacts(mkResearch(30), []);
  it("null on fallback, error, throw", async () => {
    expect(await fetchScenarioBrief(facts, "en", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ fallback: true }) }))).toBeNull();
    expect(await fetchScenarioBrief(facts, "en", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }))).toBeNull();
    expect(await fetchScenarioBrief(facts, "en", vi.fn().mockRejectedValue(new Error("x")))).toBeNull();
  });
  it("returns validated brief", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ brief: { positives: ["RSI(14) is 61.20."], concerns: [], outlook: [] } }) });
    expect((await fetchScenarioBrief(facts, "en", f))?.positives).toEqual(["RSI(14) is 61.20."]);
  });
});

function call(body: unknown, method = "POST") {
  let out: { code: number; json: unknown } = { code: 0, json: null };
  const res = { setHeader() {}, status: (c: number) => ({ json: (j: unknown) => { out = { code: c, json: j }; } }) };
  return handler({ method, body, headers: { "x-forwarded-for": `ip${Math.random()}` } }, res).then(() => out);
}
describe("research-brief handler", () => {
  const facts = buildBriefFacts(mkResearch(30), []);
  it("validates payload and method", async () => {
    expect((await call({}, "GET")).code).toBe(405);
    expect((await call({ facts: { symbol: "", lines: [] } })).code).toBe(400);
    expect(parseFacts({ symbol: "A", name: "B", lines: ["x"] })).toEqual({ symbol: "A", name: "B", lines: ["x"], unavailable: [] });
  });
  it("falls back without key", async () => {
    const saved = process.env.GEMINI_API_KEY; delete process.env.GEMINI_API_KEY;
    const r = await call({ facts, language: "en" });
    if (saved) process.env.GEMINI_API_KEY = saved;
    expect(r.json).toEqual({ fallback: true, reason: "auth_not_configured" });
  });
  it("calls Gemini with structured output and validates the output", async () => {
    process.env.GEMINI_API_KEY = "k";
    const body = { candidates: [{ content: { parts: [{ text: JSON.stringify({ positives: ["RSI(14) is 61.20.", "The price will rise."], concerns: [], outlook: [] }) }] } }] };
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => body } as Response);
    const r = await call({ facts, language: "en" });
    const sent = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string);
    expect(sent.generationConfig.responseMimeType).toBe("application/json");
    expect(r.json).toEqual({ brief: { positives: ["RSI(14) is 61.20."], concerns: [], outlook: [] } });
    spy.mockRestore(); delete process.env.GEMINI_API_KEY;
  });
});
