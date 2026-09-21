// Phase 4 AI integration: asset market queries flow through
// ConversationContext → MarketDataService → unified MarketAsset →
// the AI context, with provenance attached. Follow-ups ("What about
// AMD?") resolve through the same service.
import { describe, expect, it, vi } from "vitest";

import { processAIMessage, type AIConversationDependencies } from "../aiConversationService";
import { createConversationSession } from "../conversationContext";
import { createTtlCache } from "./cache";
import { createMarketDataService, type CachedQuote } from "./marketDataService";
import { createProviderRouter } from "./router";
import type { CandleDatum, MarketAsset } from "@/types";
import type { MarketDataProvider, NormalizedQuote } from "./providers/types";

const QUOTES: Record<string, { price: number; changePercent: number }> = {
  NVDA: { price: 131.88, changePercent: 1.21 },
  AMD: { price: 162.4, changePercent: -0.83 },
};

function historyFor(base: number): CandleDatum[] {
  return Array.from({ length: 20 }, (_, i) => {
    const price = base * (1 + (i - 10) * 0.002);
    return {
      date: `2026-09-${String(i + 1).padStart(2, "0")}`,
      price,
      open: price,
      high: price * 1.01,
      low: price * 0.99,
      close: price,
    };
  });
}

function serviceBackedDependencies(now: () => number) {
  const provider: MarketDataProvider & { getQuote: ReturnType<typeof vi.fn> } = {
    id: "yahoo_finance",
    getQuote: vi.fn(async (symbol: string): Promise<NormalizedQuote> => {
      const data = QUOTES[symbol];
      if (!data) throw new Error(`unexpected symbol ${symbol}`);
      return {
        symbol,
        name: symbol === "NVDA" ? "NVIDIA Corporation" : "Advanced Micro Devices",
        assetType: "stock",
        price: data.price,
        previousClose: data.price - 1,
        change: 1,
        changePercent: data.changePercent,
        currency: "USD",
        volume: 1000000,
        marketStatus: "closed",
        dataSource: "yahoo_finance",
        timestamp: "2026-09-21T11:58:00Z",
      };
    }),
    getHistory: vi.fn(async (symbol: string) => historyFor(QUOTES[symbol].price)),
  };
  const service = createMarketDataService({
    router: createProviderRouter([provider]),
    quoteCache: createTtlCache<CachedQuote>({ ttlMs: 60_000, now }),
    historyCache: createTtlCache<CandleDatum[]>({ ttlMs: 6 * 60 * 60 * 1000, now }),
    now,
  });
  const deps: AIConversationDependencies = {
    fetchAsset: async (symbol): Promise<MarketAsset | null> => {
      try {
        return await service.getAsset(symbol);
      } catch {
        return null;
      }
    },
    enhance: vi.fn(async () => null),
  };
  return { deps, provider };
}

describe("AI market queries through MarketDataService", () => {
  const now = () => Date.parse("2026-09-21T12:00:00Z");

  it("a market query resolves the asset and attaches real market context", async () => {
    const session = createConversationSession();
    const { deps, provider } = serviceBackedDependencies(now);

    const turn = await processAIMessage(session, "What is NVDA doing today?", "en", deps);

    expect(turn.result).not.toBeNull();
    expect(provider.getQuote).toHaveBeenCalledWith("NVDA");
    expect(turn.assetAnalyses).toHaveLength(1);
    expect(turn.assetAnalyses[0]).toMatchObject({
      symbol: "NVDA",
      price: 131.88,
      changePercent: 1.21,
      dataSource: "yahoo_finance",
      isMock: false,
      timestamp: "2026-09-21T11:58:00Z",
      freshness: "current",
      currency: "USD",
      marketStatus: "closed",
    });
    expect(turn.assetAnalyses[0].rsi).not.toBeNull();
    expect(turn.result?.conversation?.currentAsset).toBe("NVDA");
  });

  it("NVDA → 'What about AMD?' resolves AMD through the same service", async () => {
    const session = createConversationSession();
    const { deps, provider } = serviceBackedDependencies(now);

    await processAIMessage(session, "What is NVDA doing today?", "en", deps);
    const turn = await processAIMessage(session, "What about AMD?", "en", deps);

    expect(provider.getQuote).toHaveBeenCalledWith("AMD");
    expect(turn.resolution.currentAsset).toBe("AMD");
    expect(turn.assetAnalyses.map((a) => a.symbol)).toEqual(["AMD"]);
    expect(turn.assetAnalyses[0]).toMatchObject({
      price: 162.4,
      dataSource: "yahoo_finance",
      isMock: false,
    });
  });

  it("simulated fallback data reaches the AI labeled as mock, never as real", async () => {
    const session = createConversationSession();
    const mockAsset: MarketAsset = {
      symbol: "NVDA",
      name: "NVDA",
      price: 100,
      changePercent: 1,
      history: historyFor(100),
      dataSource: "mock",
      isMock: true,
      timestamp: null,
      freshness: "simulated",
    };
    const deps: AIConversationDependencies = {
      fetchAsset: async () => mockAsset,
      enhance: vi.fn(async () => null),
    };

    const turn = await processAIMessage(session, "What is NVDA doing today?", "en", deps);

    expect(turn.assetAnalyses[0]).toMatchObject({
      dataSource: "mock",
      isMock: true,
      freshness: "simulated",
    });
  });
});
