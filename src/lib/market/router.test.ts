import { describe, expect, it, vi } from "vitest";

import {
  AllProvidersUnavailableError,
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
  SymbolNotFoundError,
} from "./errors";
import { createProviderRouter } from "./router";
import type { MarketDataProvider, MarketProviderId, NormalizedQuote } from "./providers/types";

function quote(providerId: MarketProviderId, symbol: string): NormalizedQuote {
  return {
    symbol,
    name: symbol,
    assetType: "stock",
    price: 100,
    previousClose: 99,
    change: 1,
    changePercent: 1.01,
    currency: "USD",
    volume: 1000,
    marketStatus: "unknown",
    dataSource: providerId,
    timestamp: "2026-09-18",
  };
}

function fakeProvider(
  id: MarketProviderId,
  behavior: { quoteError?: Error; historyError?: Error }
): MarketDataProvider & { getQuote: ReturnType<typeof vi.fn>; getHistory: ReturnType<typeof vi.fn> } {
  return {
    id,
    getQuote: vi.fn(async (symbol: string) => {
      if (behavior.quoteError) throw behavior.quoteError;
      return quote(id, symbol);
    }),
    getHistory: vi.fn(async () => {
      if (behavior.historyError) throw behavior.historyError;
      return [{ date: "2026-09-18", price: 100, open: 100, high: 101, low: 99, close: 100 }];
    }),
  };
}

describe("provider router", () => {
  it("uses the preferred provider when it is available and never calls the fallback", async () => {
    const preferred = fakeProvider("alpha_vantage", {});
    const fallback = fakeProvider("yahoo_finance", {});
    const router = createProviderRouter([preferred, fallback]);

    const result = await router.getQuote("NVDA");

    expect(result.providerId).toBe("alpha_vantage");
    expect(result.value.dataSource).toBe("alpha_vantage");
    expect(preferred.getQuote).toHaveBeenCalledTimes(1);
    expect(fallback.getQuote).not.toHaveBeenCalled();
  });

  it("falls back when the preferred provider is unavailable", async () => {
    const preferred = fakeProvider("alpha_vantage", { quoteError: new ProviderUnavailableError("HTTP 503") });
    const fallback = fakeProvider("yahoo_finance", {});
    const router = createProviderRouter([preferred, fallback]);

    const result = await router.getQuote("NVDA");

    expect(result.providerId).toBe("yahoo_finance");
    expect(result.failedProviders).toHaveLength(1);
    expect(result.failedProviders[0].providerId).toBe("alpha_vantage");
  });

  it("falls back when the preferred provider is rate-limited", async () => {
    const preferred = fakeProvider("alpha_vantage", { quoteError: new ProviderRateLimitError("25/day reached") });
    const fallback = fakeProvider("yahoo_finance", {});
    const router = createProviderRouter([preferred, fallback]);

    const result = await router.getQuote("NVDA");
    expect(result.providerId).toBe("yahoo_finance");
  });

  it("falls back for history requests on network failure", async () => {
    const preferred = fakeProvider("alpha_vantage", { historyError: new ProviderUnavailableError("socket hang up") });
    const fallback = fakeProvider("yahoo_finance", {});
    const router = createProviderRouter([preferred, fallback]);

    const result = await router.getHistory("NVDA", "3mo");
    expect(result.providerId).toBe("yahoo_finance");
    expect(result.value).toHaveLength(1);
  });

  it("does NOT fall back on symbol-not-found (business error)", async () => {
    const preferred = fakeProvider("alpha_vantage", { quoteError: new SymbolNotFoundError("no such symbol") });
    const fallback = fakeProvider("yahoo_finance", {});
    const router = createProviderRouter([preferred, fallback]);

    await expect(router.getQuote("NOPE")).rejects.toBeInstanceOf(SymbolNotFoundError);
    expect(fallback.getQuote).not.toHaveBeenCalled();
  });

  it("does NOT fall back on malformed-payload errors (data error)", async () => {
    const preferred = fakeProvider("alpha_vantage", { quoteError: new ProviderResponseError("no usable price") });
    const fallback = fakeProvider("yahoo_finance", {});
    const router = createProviderRouter([preferred, fallback]);

    await expect(router.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderResponseError);
    expect(fallback.getQuote).not.toHaveBeenCalled();
  });

  it("reports all failures when every provider is unavailable", async () => {
    const preferred = fakeProvider("alpha_vantage", { quoteError: new ProviderRateLimitError("rate limited") });
    const fallback = fakeProvider("yahoo_finance", { quoteError: new ProviderUnavailableError("HTTP 502") });
    const router = createProviderRouter([preferred, fallback]);

    const error = await router.getQuote("NVDA").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AllProvidersUnavailableError);
    expect((error as AllProvidersUnavailableError).failures.map((f) => f.providerId)).toEqual([
      "alpha_vantage",
      "yahoo_finance",
    ]);
  });
});
