import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchMarketAssetBySymbol } from "./marketData";
import { explainConversationTurn } from "./ollamaClient";
import { buildRuleBasedAnalysis } from "./analysisService";
import { createConversationSession } from "./conversationContext";
import type { AssetAnalysis, MarketAsset } from "@/types";

function realHistory() {
  return [
    { date: "2026-01-01", price: 100, open: 100, high: 101, low: 99, close: 100 },
    { date: "2026-01-02", price: 102, open: 100, high: 103, low: 99, close: 102 },
    { date: "2026-01-03", price: 101, open: 102, high: 103, low: 100, close: 101 },
  ];
}

function stubMarketFetch(handler: (url: string) => unknown) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const body = handler(url) as { status?: number; json: unknown } | undefined;
    if (!body || (body.status && body.status >= 400)) {
      return { ok: false, status: body?.status ?? 500, json: async () => ({}) } as Response;
    }
    return { ok: true, status: 200, json: async () => body.json } as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("market data source metadata", () => {
  it("marks a successful live response with the real provider", async () => {
    stubMarketFetch(() => ({
      json: { assets: [{ symbol: "NVDA", name: "NVIDIA", price: 123.4, changePercent: 1.2, history: realHistory() }] },
    }));

    const asset = await fetchMarketAssetBySymbol("NVDA");
    expect(asset?.price).toBe(123.4);
    expect(asset?.dataSource).toBe("yahoo_finance");
  });

  it("marks the asset as mock when the API fails and the fallback is used", async () => {
    stubMarketFetch(() => ({ status: 502, json: {} }));

    const asset = await fetchMarketAssetBySymbol("NVDA");
    expect(asset).not.toBeNull();
    expect(asset?.dataSource).toBe("mock");
  });

  it("marks the asset as mock when the request throws", async () => {
    const fetchMock = vi.fn(async () => { throw new Error("network down"); });
    vi.stubGlobal("fetch", fetchMock);

    const asset = await fetchMarketAssetBySymbol("NVDA");
    expect(asset?.dataSource).toBe("mock");
  });

  it("marks the asset as mock when the provider returns no usable history", async () => {
    stubMarketFetch(() => ({
      json: { assets: [{ symbol: "NVDA", name: "NVIDIA", price: 123.4, changePercent: 1.2 }] },
    }));

    const asset = await fetchMarketAssetBySymbol("NVDA");
    expect(asset?.dataSource).toBe("mock");
  });
});

describe("Ollama conversation narration and mock warning", () => {
  function resolutionFor(text: string) {
    const session = createConversationSession();
    const resolution = session.processTurn(text);
    expect(resolution.status).toBe("resolved");
    return resolution;
  }

  function mockAsset(symbol: string): AssetAnalysis {
    const market: MarketAsset = {
      symbol,
      name: symbol,
      price: 100,
      changePercent: 1,
      history: realHistory(),
      dataSource: "mock",
    };
    return { symbol, price: 100, changePercent: 1, volatilityPct: 1, rsi: 50, dataSource: market.dataSource! };
  }

  function liveAsset(symbol: string): AssetAnalysis {
    return { symbol, price: 100, changePercent: 1, volatilityPct: 1, rsi: 50, dataSource: "yahoo_finance" };
  }

  function stubOllama(captured: { body?: string }) {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      captured.body = String(init?.body ?? "");
      return { ok: true, status: 200, json: async () => ({ response: "נראה שהשאלה שלך עוסקת ב-NVDA." }) } as Response;
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("warns explicitly when the market data is simulated", async () => {
    const captured: { body?: string } = {};
    stubOllama(captured);
    const result = buildRuleBasedAnalysis("What is NVDA's RSI?", "en");

    const narration = await explainConversationTurn(result, resolutionFor("What is NVDA's RSI?"), [mockAsset("NVDA")]);

    expect(narration).not.toBeNull();
    expect(captured.body).toContain("SIMULATED");
    expect(captured.body).toContain("Never present these prices, RSI, or volatility values as current real market data");
    // The AI never receives mock values without their source metadata.
    const promptAssets = JSON.parse(captured.body!).prompt.match(/Market analysis supplied by the market-data layer: (\[.*\])\./)?.[1];
    expect(promptAssets).toBeTruthy();
    for (const asset of JSON.parse(promptAssets!)) {
      expect(asset.dataSource).toBe("mock");
    }
  });

  it("does not warn when the market data is real", async () => {
    const captured: { body?: string } = {};
    stubOllama(captured);
    const result = buildRuleBasedAnalysis("What is NVDA's RSI?", "en");

    await explainConversationTurn(result, resolutionFor("What is NVDA's RSI?"), [liveAsset("NVDA")]);

    expect(captured.body).not.toContain("SIMULATED");
    expect(captured.body).toContain("yahoo_finance");
  });

  it("keeps one conversation response under one meaning instead of duplicating it", async () => {
    const captured: { body?: string } = {};
    stubOllama(captured);
    const result = buildRuleBasedAnalysis("What is NVDA's RSI?", "en");
    const originalProfileSummary = result.aiNarration.profileSummary;
    const originalPortfolioSummary = result.aiNarration.portfolioSummary;

    const narration = await explainConversationTurn(result, resolutionFor("What is NVDA's RSI?"), [liveAsset("NVDA")]);

    expect(narration?.source).toBe("ollama");
    expect(narration?.conversationSummary).toBe("נראה שהשאלה שלך עוסקת ב-NVDA.");
    // The profile and portfolio summaries keep their original
    // rule-based meaning; the conversation text is not duplicated
    // into either of them.
    expect(narration?.profileSummary).toBe(originalProfileSummary);
    expect(narration?.portfolioSummary).toBe(originalPortfolioSummary);
    expect(narration?.profileSummary).not.toBe(narration?.conversationSummary);
    expect(narration?.portfolioSummary).not.toBe(narration?.conversationSummary);
  });
});
