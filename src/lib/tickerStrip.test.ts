import { describe, expect, it } from "vitest";
import { parseTickerQuotes, shouldShowTicker, tickerPhase, type TickerQuote } from "./tickerStrip";
const d = (iso: string) => new Date(iso);
const q = (ts: string): TickerQuote[] => [{ symbol: "SPY", price: 1, changePercent: 0.5, timestamp: ts }];
describe("tickerStrip", () => {
  it("phases follow New York time (EDT in October)", () => {
    expect(tickerPhase(d("2026-10-01T12:00:00Z"))).toBe("closed"); // 08:00 ET
    expect(tickerPhase(d("2026-10-01T14:00:00Z"))).toBe("open"); // 10:00 ET
    expect(tickerPhase(d("2026-10-01T21:00:00Z"))).toBe("after"); // 17:00 ET
    expect(tickerPhase(d("2026-10-02T00:30:00Z"))).toBe("closed"); // 20:30 ET
    expect(tickerPhase(d("2026-10-03T15:00:00Z"))).toBe("closed"); // Saturday
  });
  it("follows daylight saving: January is EST", () => { expect(tickerPhase(d("2026-01-15T14:15:00Z"))).toBe("closed"); expect(tickerPhase(d("2026-01-15T14:30:00Z"))).toBe("open"); });
  it("parses only real quotes", () => {
    const body = { assets: [{ symbol: "A", price: 2, changePercent: 1, timestamp: "2026-10-01T14:00:00Z", isMock: false }, { symbol: "B", price: null, changePercent: 1, timestamp: "x" }, { symbol: "C", price: 3, changePercent: 1, timestamp: "2026-10-01T14:00:00Z", isMock: true }] };
    expect(parseTickerQuotes(body).map((x) => x.symbol)).toEqual(["A"]); expect(parseTickerQuotes(null)).toEqual([]);
  });
  it("shows during the open session only with fresh data from today", () => {
    expect(shouldShowTicker(d("2026-10-01T14:10:00Z"), q("2026-10-01T14:05:00Z"))).toBe(true);
    expect(shouldShowTicker(d("2026-10-01T14:10:00Z"), q("2026-10-01T13:00:00Z"))).toBe(false); // stale during open
    expect(shouldShowTicker(d("2026-10-01T14:10:00Z"), q("2026-09-30T20:00:00Z"))).toBe(false); // holiday-like: yesterday data
  });
  it("keeps showing after-market with today's close, hides when closed, preview overrides", () => {
    expect(shouldShowTicker(d("2026-10-01T21:00:00Z"), q("2026-10-01T20:00:00Z"))).toBe(true);
    expect(shouldShowTicker(d("2026-10-02T01:00:00Z"), q("2026-10-01T20:00:00Z"))).toBe(false);
    expect(shouldShowTicker(d("2026-10-01T12:00:00Z"), q("2026-09-30T20:00:00Z"), true)).toBe(true);
    expect(shouldShowTicker(d("2026-10-01T14:10:00Z"), [])).toBe(false);
  });
});
