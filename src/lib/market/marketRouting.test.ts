import { describe, expect, it, vi } from "vitest";

import { AllProvidersUnavailableError, ProviderRateLimitError, ProviderUnavailableError, SymbolNotFoundError } from "./errors";
import { classifyMarket, createProviderHealth, providerPreferenceFor } from "./marketRouting";
import type { MarketDataProvider, MarketProviderId, NormalizedQuote } from "./providers/types";
import { createProviderRouter } from "./router";

function provider(id: MarketProviderId, error?: Error): MarketDataProvider & { getQuote: ReturnType<typeof vi.fn> } {
  return {
    id,
    getQuote: vi.fn(async (symbol: string) => {
      if (error) throw error;
      return { symbol, name: symbol, assetType: "stock", price: 1, previousClose: 1, change: 0, changePercent: 0, currency: "USD", volume: 1, marketStatus: "unknown", dataSource: id, timestamp: null } as NormalizedQuote;
    }),
    getHistory: vi.fn(async () => []),
  };
}

describe("classifyMarket", () => {
  it.each([
    ["NVDA", "us_equity"],
    ["nvda", "us_equity"],
    ["BRK-B", "us_equity_class"],
    ["BRK.B", "us_equity_class"],
    ["TEVA.TA", "tase"],
    ["BTC-USD", "crypto"],
    ["ETH-USDT", "crypto"],
    ["EURUSD=X", "fx"],
    ["GC=F", "futures"],
    ["^GSPC", "index"],
    ["SAP.DE", "exchange_suffix"],
    ["", "unknown"],
    ["TOOLONGSYMBOLXX", "unknown"],
  ])("%s -> %s", (symbol, kind) => {
    expect(classifyMarket(symbol)).toBe(kind);
  });
});

describe("provider preference", () => {
  it("tries the keyed official API before Yahoo for plain US tickers", () => {
    expect(providerPreferenceFor("AAPL")).toEqual(["alpha_vantage", "yahoo_finance"]);
  });
  it("never sends non-US-ticker markets to Alpha Vantage", () => {
    for (const s of ["TEVA.TA", "BTC-USD", "^GSPC", "EURUSD=X", "GC=F", "BRK-B"]) {
      expect(providerPreferenceFor(s)).toEqual(["yahoo_finance"]);
    }
  });
});

describe("routing policy in the router", () => {
  it("skips Alpha Vantage for a TASE symbol", async () => {
    const av = provider("alpha_vantage");
    const yf = provider("yahoo_finance");
    const router = createProviderRouter([av, yf], {});
    const result = await router.getQuote("TEVA.TA");
    expect(result.providerId).toBe("yahoo_finance");
    expect(av.getQuote).not.toHaveBeenCalled();
  });

  it("reorders by policy regardless of configured order", async () => {
    const av = provider("alpha_vantage");
    const yf = provider("yahoo_finance");
    const router = createProviderRouter([yf, av], {});
    expect((await router.getQuote("AAPL")).providerId).toBe("alpha_vantage");
  });

  it("fails with symbol-not-found when no configured provider serves the market", async () => {
    const router = createProviderRouter([provider("alpha_vantage")], {});
    await expect(router.getQuote("BTC-USD")).rejects.toBeInstanceOf(SymbolNotFoundError);
  });

  it("skips a provider in cooldown and reports it", async () => {
    let t = 0;
    const health = createProviderHealth({ now: () => t, failureCooldownMs: 1000 });
    const av = provider("alpha_vantage", new ProviderUnavailableError("HTTP 503"));
    const yf = provider("yahoo_finance");
    const router = createProviderRouter([av, yf], { health });

    expect((await router.getQuote("AAPL")).providerId).toBe("yahoo_finance");
    expect(av.getQuote).toHaveBeenCalledTimes(1);

    const second = await router.getQuote("AAPL");
    expect(second.providerId).toBe("yahoo_finance");
    expect(av.getQuote).toHaveBeenCalledTimes(1);
    expect(second.failedProviders[0]).toMatchObject({ providerId: "alpha_vantage", error: expect.stringContaining("cooling down") });

    t = 1001;
    await router.getQuote("AAPL");
    expect(av.getQuote).toHaveBeenCalledTimes(2);
  });

  it("uses a longer cooldown after a rate limit", () => {
    let t = 0;
    const health = createProviderHealth({ now: () => t, failureCooldownMs: 10, rateLimitCooldownMs: 500 });
    health.recordFailure("alpha_vantage", new ProviderRateLimitError("429"));
    t = 100;
    expect(health.isCoolingDown("alpha_vantage")).toBe(true);
    expect(health.cooldownRemainingMs("alpha_vantage")).toBe(400);
    t = 501;
    expect(health.isCoolingDown("alpha_vantage")).toBe(false);
  });

  it("a success clears the cooldown", () => {
    const health = createProviderHealth({ now: () => 0 });
    health.recordFailure("yahoo_finance", new ProviderUnavailableError("x"));
    health.recordSuccess("yahoo_finance");
    expect(health.isCoolingDown("yahoo_finance")).toBe(false);
  });

  it("throws AllProvidersUnavailable when the only provider is cooling down", async () => {
    const health = createProviderHealth({ now: () => 0 });
    health.recordFailure("yahoo_finance", new ProviderUnavailableError("x"));
    const yf = provider("yahoo_finance");
    const router = createProviderRouter([yf], { health });
    await expect(router.getQuote("^GSPC")).rejects.toBeInstanceOf(AllProvidersUnavailableError);
    expect(yf.getQuote).not.toHaveBeenCalled();
  });
});
