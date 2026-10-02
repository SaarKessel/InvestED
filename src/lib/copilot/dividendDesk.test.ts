import { describe, expect, it } from "vitest";
import { loadDividends, parseDividendRequest, summarizeDividends } from "./dividendDesk";
import { parseYahooDividends, cleanSymbol } from "@/lib/api/dividendHandler";
import { planQuestion } from "./planner";

const NOW = new Date("2026-10-02T12:00:00Z");
const q = (dates: string[], amt = 0.26) => dates.map((date) => ({ date, amount: amt }));
const base = { name: "Apple Inc.", currency: "USD", price: 200, priceAsOf: "2026-10-01" };

describe("parseDividendRequest", () => {
  it("English history and expected", () => {
    expect(parseDividendRequest("how much dividend did AAPL pay")).toEqual({ symbol: "AAPL", shares: null, focus: "history" });
    expect(parseDividendRequest("how much dividend will I receive from KO with 100 shares")).toMatchObject({ symbol: "KO", shares: 100, focus: "expected" });
  });
  it("Hebrew, by name and by ticker", () => {
    expect(parseDividendRequest("כמה דיבידנד חילקה אפל")).toMatchObject({ symbol: "AAPL", focus: "history" });
    expect(parseDividendRequest("כמה דיבידנד אני אמור לקבל מ-MSFT")).toMatchObject({ symbol: "MSFT", focus: "expected" });
  });
  it("ignores non-dividend questions and questions without a symbol", () => {
    expect(parseDividendRequest("what is the price of AAPL")).toBeNull();
    expect(parseDividendRequest("what is a dividend")).toBeNull();
  });
});

describe("summarizeDividends", () => {
  it("sums trailing 12 months, yield and a quarterly estimate", () => {
    const r = summarizeDividends({ symbol: "AAPL", shares: 100, focus: "expected" }, { ...base, dividends: q(["2025-08-15", "2025-11-07", "2026-02-09", "2026-05-11", "2026-08-10"]) }, NOW);
    expect(r.trailing12mCount).toBe(4);
    expect(r.trailing12mPerShare).toBe(1.04);
    expect(r.trailingYieldPct).toBe(0.52);
    expect(r.estimate?.perYear).toBe(4);
    expect(r.estimate?.annualPerShare).toBe(1.04);
    expect((r.estimate?.nextDateApprox ?? "") > "2026-10-02").toBe(true);
    expect(r.stopped).toBe(false);
  });
  it("withholds the estimate when payments look stopped", () => {
    const r = summarizeDividends({ symbol: "X", shares: null, focus: "expected" }, { ...base, dividends: q(["2023-01-10", "2023-04-10", "2023-07-10", "2023-10-10"]) }, NOW);
    expect(r.estimate).toBeNull();
    expect(r.stopped).toBe(true);
    expect(r.trailing12mCount).toBe(0);
  });
  it("no dividends at all gives an empty, honest result", () => {
    const r = summarizeDividends({ symbol: "TSLA", shares: null, focus: "history" }, { ...base, dividends: [] }, NOW);
    expect(r.payments).toHaveLength(0);
    expect(r.estimate).toBeNull();
    expect(r.trailingYieldPct).toBeNull();
  });
  it("no price means no yield, never a guess", () => {
    const r = summarizeDividends({ symbol: "A", shares: null, focus: "history" }, { ...base, price: null, dividends: q(["2026-02-09", "2026-05-11", "2026-08-10"]) }, NOW);
    expect(r.trailingYieldPct).toBeNull();
    expect(r.estimate?.yieldPct).toBeNull();
  });
});

describe("loadDividends", () => {
  const ok = (body: unknown) => (async () => ({ ok: true, json: async () => body })) as unknown as typeof fetch;
  it("maps the server payload", async () => {
    const r = await loadDividends({ symbol: "AAPL", shares: null, focus: "history" }, ok({ data: { ...base, dividends: q(["2026-05-11", "2026-08-10"]) } }), NOW);
    expect(r?.payments).toHaveLength(2);
  });
  it("returns null on failure or bad shape", async () => {
    expect(await loadDividends({ symbol: "A", shares: null, focus: "history" }, (async () => ({ ok: false })) as unknown as typeof fetch, NOW)).toBeNull();
    expect(await loadDividends({ symbol: "A", shares: null, focus: "history" }, ok({ data: {} }), NOW)).toBeNull();
    expect(await loadDividends({ symbol: "A", shares: null, focus: "history" }, (async () => { throw new Error("x"); }) as unknown as typeof fetch, NOW)).toBeNull();
  });
});

describe("/api/dividends parsing", () => {
  const yahoo = { chart: { result: [{ meta: { currency: "USD", regularMarketPrice: 333.4, regularMarketTime: 1790952640, longName: "Apple Inc." }, events: { dividends: { "1778506200": { amount: 0.27, date: 1778506200 }, "1770647400": { amount: 0.26, date: 1770647400 }, "1": { amount: 0, date: 1 } } } }] } };
  it("sorts, drops zero amounts, keeps real ones", () => {
    const p = parseYahooDividends(yahoo, "AAPL")!;
    expect(p.dividends.map((d) => d.amount)).toEqual([0.26, 0.27]);
    expect(p.price).toBe(333.4);
    expect(p.name).toBe("Apple Inc.");
  });
  it("no dividend events gives an empty list; bad shape gives null", () => {
    expect(parseYahooDividends({ chart: { result: [{ meta: { currency: "USD" } }] } }, "TSLA")!.dividends).toEqual([]);
    expect(parseYahooDividends({}, "X")).toBeNull();
  });
  it("validates symbols", () => { expect(cleanSymbol("aapl")).toBe("AAPL"); expect(cleanSymbol("BRK-B")).toBe("BRK-B"); expect(cleanSymbol("../x")).toBeNull(); });
});

describe("dividends route", () => {
  it("routes to the dividends tool", () => {
    const p = planQuestion("כמה דיבידנד חילקה אפל");
    expect(p.route).toBe("dividends");
    expect(p.tools).toEqual(["dividends"]);
    expect(planQuestion("how much dividend did KO pay?").route).toBe("dividends");
  });
  it("leaves other questions alone", () => { expect(planQuestion("what is a dividend").route).not.toBe("dividends"); });
});
