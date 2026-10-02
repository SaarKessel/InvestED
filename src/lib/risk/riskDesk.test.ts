import { describe, expect, it } from "vitest";
import { formatRisk, knownTickers, loadRisk, parseRiskRequest, tickersIn } from "./riskDesk";
import type { MarketAsset } from "@/types";

const day = (i: number) => new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10);
const asset = (symbol: string, f: (i: number) => number, over: Partial<MarketAsset> = {}): MarketAsset => ({
  symbol, name: `${symbol} Inc`, price: 1, changePercent: 0, isMock: false, dataSource: "yahoo_finance", freshness: "current",
  history: Array.from({ length: 120 }, (_, i) => ({ date: day(i), open: f(i), high: f(i), low: f(i), close: f(i), volume: 0 })) as MarketAsset["history"], ...over,
});
const wave = (k: number) => (i: number) => 100 * (1 + k * Math.sin(i / 4) * 0.05);

describe("risk desk", () => {
  it("finds tickers and requires a risk word", () => {
    expect(tickersIn("risk of AAPL and ETF vs VOO")).toEqual(["AAPL", "VOO"]);
    expect(parseRiskRequest("volatility of AAPL")).toEqual(["AAPL"]);
    expect(parseRiskRequest("סיכון של AAPL")).toEqual(["AAPL"]);
    expect(parseRiskRequest("what is AAPL")).toBeNull();
    expect(parseRiskRequest("what is beta")).toBeNull();
  });
  it("computes from the loader, flags state, and marks missing data unavailable", async () => {
    const load = async (s: string) => (s === "SPY" ? asset("SPY", wave(1)) : s === "AAA" ? asset("AAA", wave(2), { freshness: "recent" }) : s === "MCK" ? asset("MCK", wave(1), { isMock: true, dataSource: "mock" }) : null);
    const r = await loadRisk(["AAA", "MCK", "ZZZ"], load);
    const a = r.items[0];
    expect(a.unavailable).toBeFalsy();
    if (a.unavailable) throw new Error();
    expect(a.state).toBe("cached");
    expect(a.metrics.beta!).toBeGreaterThan(1.5);
    expect(r.items[1].unavailable).toBe(true);
    expect(r.items[2].unavailable).toBe(true);
    const en = formatRisk(r, "en");
    expect(en).toContain("Volatility:");
    expect(en).toContain("Beta against SPY");
    expect(en).toContain("MCK: I have no real price data");
    expect(en).toContain("not investment advice");
  });
  it("live data is labeled live and Hebrew output has the same facts", async () => {
    const r = await loadRisk(["SPY"], async (s) => asset(s, wave(1)));
    const it = r.items[0];
    if (it.unavailable) throw new Error();
    expect(it.state).toBe("live");
    expect(it.metrics.missing.beta).toBeUndefined();
    const he = formatRisk(r, "he");
    expect(he).toContain("תנודתיות:");
    expect(he).toContain("מדד הייחוס עצמו");
    expect(he).toContain("אינו ייעוץ השקעות");
    expect(he).not.toMatch(/Volatility|Worst drop/);
  });
  it("benchmark failure leaves beta empty with a reason, other metrics still shown", async () => {
    const r = await loadRisk(["AAA"], async (s) => (s === "AAA" ? asset("AAA", wave(1)) : null));
    const it = r.items[0];
    if (it.unavailable) throw new Error();
    expect(it.metrics.beta).toBeNull();
    expect(it.metrics.volatility).not.toBeNull();
    expect(formatRisk(r, "en")).toContain("no benchmark data right now");
  });
  it("keeps only tickers in the stored symbol list", async () => {
    expect(await knownTickers(["AAPL", "ZZZQQ"])).toEqual(["AAPL"]);
  });
});
