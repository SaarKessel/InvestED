import { afterEach, describe, expect, it, vi } from "vitest";

import { createTtlCache } from "./cache";
import { createMarketDataService, type CachedQuote } from "./marketDataService";
import { createProviderRouter } from "./router";
import { resolveAssetSymbol } from "./symbolResolution";
import { SymbolNotFoundError } from "./errors";
import { fetchMarketAssetBySymbol, fetchMarketAssets } from "../marketData";
import type { CandleDatum } from "@/types";
import type { MarketDataProvider, MarketProviderId, NormalizedQuote } from "./providers/types";

function history(days: number): CandleDatum[] {
  return Array.from({ length: days }, (_, i) => ({
    date: `2026-09-${String(i + 1).padStart(2, "0")}`,
    price: 100 + i,
    open: 100 + i,
    high: 101 + i,
    low: 99 + i,
    close: 100 + i,
  }));
}

function providerQuote(providerId: MarketProviderId, symbol: string, timestamp: string): NormalizedQuote {
  return {
    symbol,
    name: symbol, // like Alpha Vantage: no company name from the provider
    assetType: "unknown",
    price: 131.88,
    previousClose: 130.3,
    change: 1.58,
    changePercent: 1.21,
    currency: "USD",
    volume: 12345678,
    marketStatus: "unknown",
    dataSource: providerId,
    timestamp,
  };
}

function setup(options: { now: () => number; timestamp: string }) {
  const provider: MarketDataProvider & { getQuote: ReturnType<typeof vi.fn>; getHistory: ReturnType<typeof vi.fn> } = {
    id: "yahoo_finance",
    getQuote: vi.fn(async (symbol: string) => providerQuote("yahoo_finance", symbol, options.timestamp)),
    getHistory: vi.fn(async () => history(30)),
  };
  const service = createMarketDataService({
    router: createProviderRouter([provider]),
    quoteCache: createTtlCache<CachedQuote>({ ttlMs: 60_000, now: options.now }),
    historyCache: createTtlCache<CandleDatum[]>({ ttlMs: 6 * 60 * 60 * 1000, now: options.now }),
    now: options.now,
  });
  return { service, provider };
}

describe("MarketDataService", () => {
  it("returns a unified asset with truthful provenance and freshness", async () => {
    let t = Date.parse("2026-09-21T12:00:00Z");
    const { service } = setup({ now: () => t, timestamp: "2026-09-21T11:58:00Z" });

    const asset = await service.getAsset("NVDA");

    expect(asset).toMatchObject({
      symbol: "NVDA",
      price: 131.88,
      previousClose: 130.3,
      change: 1.58,
      changePercent: 1.21,
      currency: "USD",
      volume: 12345678,
      marketStatus: "unknown",
      dataSource: "yahoo_finance",
      timestamp: "2026-09-21T11:58:00Z",
      freshness: "current",
      isMock: false,
    });
    expect(asset.history).toHaveLength(30);
    t += 1;
  });

  it("fills the known-assets name when the provider supplies none", async () => {
    const t = Date.parse("2026-09-21T12:00:00Z");
    const { service } = setup({ now: () => t, timestamp: "2026-09-21T11:59:00Z" });

    const asset = await service.getAsset("Vanguard Total Stock Market ETF");

    expect(asset.symbol).toBe("VTI");
    expect(asset.name).toBe("Vanguard Total Stock Market ETF");
    expect(asset.assetType).toBe("etf");
  });

  it("serves repeat requests from cache without another provider call", async () => {
    let t = Date.parse("2026-09-21T12:00:00Z");
    const { service, provider } = setup({ now: () => t, timestamp: "2026-09-21T11:59:00Z" });

    await service.getAsset("NVDA");
    t += 30_000;
    await service.getAsset("NVDA");

    expect(provider.getQuote).toHaveBeenCalledTimes(1);
    expect(provider.getHistory).toHaveBeenCalledTimes(1);
  });

  it("refreshes quotes on the short TTL but keeps history on the long TTL", async () => {
    let t = Date.parse("2026-09-21T12:00:00Z");
    const { service, provider } = setup({ now: () => t, timestamp: "2026-09-21T11:00:00Z" });

    await service.getAsset("NVDA");
    t += 120_000; // quote TTL (60s) expired, history TTL (6h) intact
    await service.getAsset("NVDA");

    expect(provider.getQuote).toHaveBeenCalledTimes(2);
    expect(provider.getHistory).toHaveBeenCalledTimes(1);
  });

  it("rejects unresolvable input without calling any provider", async () => {
    const t = Date.parse("2026-09-21T12:00:00Z");
    const { service, provider } = setup({ now: () => t, timestamp: "2026-09-21T11:59:00Z" });

    await expect(service.getAsset("some unknown company name")).rejects.toBeInstanceOf(SymbolNotFoundError);
    expect(provider.getQuote).not.toHaveBeenCalled();
  });
});

describe("bounded symbol/asset resolution", () => {
  it("resolves ticker variants to the same asset", () => {
    expect(resolveAssetSymbol("NVDA")?.symbol).toBe("NVDA");
    expect(resolveAssetSymbol("nvda")?.symbol).toBe("NVDA");
  });

  it("resolves company names in English and Hebrew", () => {
    expect(resolveAssetSymbol("Nvidia")?.symbol).toBe("NVDA");
    expect(resolveAssetSymbol("אנבידיה")?.symbol).toBe("NVDA");
    expect(resolveAssetSymbol("אפל")?.symbol).toBe("AAPL");
  });

  it("resolves supported ETF names", () => {
    expect(resolveAssetSymbol("VTI")?.symbol).toBe("VTI");
    expect(resolveAssetSymbol("Vanguard Total Stock Market ETF")?.symbol).toBe("VTI");
    expect(resolveAssetSymbol("Vanguard Total Bond Market ETF")?.symbol).toBe("BND");
  });

  it("returns null for input outside the supported universe", () => {
    expect(resolveAssetSymbol("some unknown company name")).toBeNull();
    expect(resolveAssetSymbol("")).toBeNull();
  });
});

describe("client service truthfulness (mock never looks real)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubApi(handler: (url: string) => { status?: number; body: unknown }) {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const { status = 200, body } = handler(String(input));
      return { ok: status < 400, status, json: async () => body } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("labels API-served real data with its provider and provenance", async () => {
    stubApi(() => ({
      body: {
        assets: [{
          symbol: "NVDA",
          name: "NVIDIA Corporation",
          assetType: "stock",
          price: 131.88,
          previousClose: 130.3,
          change: 1.58,
          changePercent: 1.21,
          currency: "USD",
          volume: 12345678,
          marketStatus: "closed",
          history: history(30),
          dataSource: "alpha_vantage",
          timestamp: "2026-09-21T11:58:00Z",
          freshness: "current",
        }],
      },
    }));

    const asset = await fetchMarketAssetBySymbol("NVDA");

    expect(asset).toMatchObject({
      symbol: "NVDA",
      dataSource: "alpha_vantage",
      isMock: false,
      freshness: "current",
      currency: "USD",
      marketStatus: "closed",
    });
  });

  it("labels the development fallback as simulated mock", async () => {
    stubApi(() => ({ status: 502, body: {} }));

    const asset = await fetchMarketAssetBySymbol("NVDA");

    expect(asset).toMatchObject({ dataSource: "mock", isMock: true, freshness: "simulated" });
  });

  it("drops unavailable assets instead of replacing them with silent mock", async () => {
    stubApi(() => ({
      body: {
        assets: [
          { symbol: "NOPE", name: "NOPE", price: null, history: [], dataSource: null, isMock: false, freshness: "unavailable", error: "symbol_not_found" },
          { symbol: "VOO", name: "Vanguard S&P 500 ETF", price: 512, changePercent: 0.5, history: history(30), dataSource: "yahoo_finance", timestamp: "2026-09-21T11:58:00Z" },
        ],
      },
    }));

    const result = await fetchMarketAssets([]);

    expect(result.assets.map((a) => a.symbol)).toEqual(["VOO"]);
    expect(result.isLive).toBe(true);
  });

  it("falls back to labeled mock only when every asset is unavailable", async () => {
    stubApi(() => ({
      body: {
        assets: [
          { symbol: "VOO", price: null, history: [], freshness: "unavailable", error: "providers_unavailable" },
        ],
      },
    }));

    const result = await fetchMarketAssets([]);

    expect(result.isLive).toBe(false);
    for (const asset of result.assets) {
      expect(asset.isMock).toBe(true);
      expect(asset.freshness).toBe("simulated");
    }
  });
});
