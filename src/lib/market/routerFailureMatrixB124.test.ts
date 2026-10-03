import { describe, expect, it, vi } from "vitest";
import { createProviderRouter } from "./router";
import { AllProvidersUnavailableError, ProviderRateLimitError, ProviderResponseError, ProviderUnavailableError, SymbolNotFoundError } from "./errors";
import type { MarketDataProvider } from "./providers/types";

const failures = [new ProviderUnavailableError("network"), new ProviderRateLimitError("quota"), new ProviderResponseError("bad payload"), new SymbolNotFoundError("missing"), new Error("unexpected")];
const rows = failures.flatMap((error, index) => (["quote", "history"] as const).map((operation) => [index, error, operation] as const));

describe("[sweep] B124 router fallback preserves error taxonomy", () => {
  it.each(rows)("error case %s %s operation %s", async (_index, error, operation) => {
    const first = { id: "alpha_vantage", getQuote: vi.fn(async () => { throw error; }), getHistory: vi.fn(async () => { throw error; }) } as MarketDataProvider;
    const value = operation === "quote" ? { symbol: "AAPL", price: 100 } : [{ date: "2026-01-01", close: 100 }];
    const second = { id: "yahoo_finance", getQuote: vi.fn(async () => value), getHistory: vi.fn(async () => value) } as unknown as MarketDataProvider;
    const router = createProviderRouter([first, second]);
    const call = operation === "quote" ? router.getQuote("AAPL") : router.getHistory("AAPL", "5y");
    if (error instanceof ProviderUnavailableError) {
      await expect(call).resolves.toEqual({ value, providerId: "yahoo_finance", failedProviders: [{ providerId: "alpha_vantage", error: error.message }] });
      expect(operation === "quote" ? second.getQuote : second.getHistory).toHaveBeenCalledTimes(1);
    } else {
      await expect(call).rejects.toBe(error);
      expect(second.getQuote).not.toHaveBeenCalled(); expect(second.getHistory).not.toHaveBeenCalled();
    }
    expect(operation === "quote" ? first.getQuote : first.getHistory).toHaveBeenCalledTimes(1);
  });
});

describe("[hand] B124 complete provider outage", () => {
  it("aggregates ordered availability failures without changing their source", async () => {
    const provider = (id: "yahoo_finance" | "alpha_vantage", message: string): MarketDataProvider => ({ id, getQuote: async () => { throw new ProviderUnavailableError(message); }, getHistory: async () => { throw new ProviderUnavailableError(message); } });
    const router = createProviderRouter([provider("yahoo_finance", "first"), provider("alpha_vantage", "second")]);
    try { await router.getQuote("AAPL"); throw new Error("expected failure"); }
    catch (e) {
      expect(e).toBeInstanceOf(AllProvidersUnavailableError);
      expect((e as AllProvidersUnavailableError).failures).toEqual([{ providerId: "yahoo_finance", error: "first" }, { providerId: "alpha_vantage", error: "second" }]);
    }
  });
  it("does not call history while serving a quote", async () => {
    const p = { id: "yahoo_finance", getQuote: vi.fn(async () => ({ symbol: "AAPL" })), getHistory: vi.fn() } as unknown as MarketDataProvider;
    await createProviderRouter([p]).getQuote("AAPL");
    expect(p.getHistory).not.toHaveBeenCalled();
  });
});
