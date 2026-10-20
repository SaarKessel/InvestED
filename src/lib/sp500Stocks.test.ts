import { describe, it, expect } from "vitest";
import { SP500_STOCKS, detectStock } from "./sp500Stocks";

describe("SP500_STOCKS data", () => {
  it("symbols are unique and well-formed", () => {
    const symbols = SP500_STOCKS.map((s) => s.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
    for (const s of SP500_STOCKS) {
      expect(s.symbol).toMatch(/^[A-Z0-9.-]+$/);
      expect(s.name.trim()).not.toBe("");
      expect(s.hebrewName).toMatch(/[\u0590-\u05ff]/);
      expect(s.keywords.length).toBeGreaterThan(0);
      expect(s.keywords.map((k) => k.toLowerCase())).toContain(s.symbol.toLowerCase());
    }
  });
});
describe("detectStock", () => {
  it("matches English and Hebrew keywords case-insensitively", () => {
    expect(detectStock("what about Apple?")?.symbol).toBe("AAPL");
    expect(detectStock("מה עם אפל")?.symbol).toBe("AAPL");
    expect(detectStock("aapl")?.symbol).toBe("AAPL");
  });
  it("returns null for no match", () => {
    expect(detectStock("what is an ETF")).toBeNull();
    expect(detectStock("")).toBeNull();
  });
});
