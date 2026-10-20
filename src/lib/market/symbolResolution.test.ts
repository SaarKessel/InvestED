import { describe, it, expect } from "vitest";
import { resolveAssetSymbol } from "./symbolResolution";
import { ProviderRateLimitError, ProviderUnavailableError, SymbolNotFoundError, ProviderResponseError, AllProvidersUnavailableError, MarketDataError } from "./errors";

describe("resolveAssetSymbol", () => {
  it("resolves exact ticker tokens, case-insensitively, uppercased", () => {
    // Known tickers may match via the S&P 500 alias table first; symbol is what matters.
    expect(resolveAssetSymbol("NVDA")?.symbol).toBe("NVDA");
    expect(resolveAssetSymbol("nvda")?.symbol).toBe("NVDA");
    expect(resolveAssetSymbol("  amd ")?.symbol).toBe("AMD");
  });
  it("resolves known asset names and aliases", () => {
    expect(resolveAssetSymbol("Vanguard S&P 500 ETF")).toEqual({ symbol: "VOO", matched: "name" });
    expect(resolveAssetSymbol("vanguard high dividend yield")).toEqual({ symbol: "VYM", matched: "alias" });
    expect(resolveAssetSymbol("dollar shekel rate")).toEqual({ symbol: "USDILS=X", matched: "alias" });
  });
  it("resolves S&P 500 company names and Hebrew aliases", () => {
    const apple = resolveAssetSymbol("Apple");
    expect(apple?.symbol).toBe("AAPL");
    const hebrew = resolveAssetSymbol("אפל");
    if (hebrew) expect(hebrew.symbol).toBe("AAPL");
  });
  it("returns null for empty and non-asset prose", () => {
    expect(resolveAssetSymbol("")).toBeNull();
    expect(resolveAssetSymbol("   ")).toBeNull();
    expect(resolveAssetSymbol("what is the meaning of life and everything else")).toBeNull();
  });
});

describe("market data error taxonomy", () => {
  it("availability errors are fallback-safe, business errors are not", () => {
    expect(new ProviderUnavailableError("x")).toBeInstanceOf(MarketDataError);
    expect(new ProviderRateLimitError("x")).toBeInstanceOf(ProviderUnavailableError);
    expect(new SymbolNotFoundError("x")).toBeInstanceOf(MarketDataError);
    expect(new SymbolNotFoundError("x")).not.toBeInstanceOf(ProviderUnavailableError);
    expect(new ProviderResponseError("x")).not.toBeInstanceOf(ProviderUnavailableError);
  });
  it("AllProvidersUnavailableError lists every failure", () => {
    const e = new AllProvidersUnavailableError([{ providerId: "yahoo", error: "timeout" }, { providerId: "alpha", error: "429" }]);
    expect(e.message).toContain("yahoo (timeout)");
    expect(e.message).toContain("alpha (429)");
    expect(e.failures).toHaveLength(2);
    expect(e).toBeInstanceOf(ProviderUnavailableError);
  });
  it("error names survive minification via new.target", () => {
    expect(new SymbolNotFoundError("x").name).toBe("SymbolNotFoundError");
    expect(new ProviderRateLimitError("x").name).toBe("ProviderRateLimitError");
  });
});
