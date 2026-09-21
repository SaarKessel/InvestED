import { describe, expect, it, vi } from "vitest";

import {
  createAlphaVantageProvider,
  normalizeAlphaVantageQuote,
  normalizeAlphaVantageTimeSeries,
} from "./providers/alphaVantage";
import {
  createYahooFinanceProvider,
  normalizeYahooChart,
} from "./providers/yahooFinance";
import {
  ProviderRateLimitError,
  ProviderResponseError,
  ProviderUnavailableError,
  SymbolNotFoundError,
} from "./errors";
import type { FetchLike } from "./providers/types";

function fetchReturning(status: number, body: unknown): FetchLike {
  return vi.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }));
}

const AV_GLOBAL_QUOTE = {
  "Global Quote": {
    "01. symbol": "NVDA",
    "02. open": "130.0000",
    "03. high": "132.0000",
    "04. low": "129.0000",
    "05. price": "131.8800",
    "06. volume": "12345678",
    "07. latest trading day": "2026-09-18",
    "08. previous close": "130.3000",
    "09. change": "1.5800",
    "10. change percent": "1.2125%",
  },
};

const AV_DAILY = {
  "Time Series (Daily)": {
    "2026-09-18": {
      "1. open": "130.0000",
      "2. high": "132.0000",
      "3. low": "129.0000",
      "4. close": "131.8800",
      "5. volume": "12345678",
    },
    "2026-09-17": {
      "1. open": "128.0000",
      "2. high": "131.0000",
      "3. low": "127.0000",
      "4. close": "130.3000",
      "5. volume": "9876543",
    },
  },
};

const REGULAR_MARKET_TIME = 1770000000;

const YAHOO_CHART = {
  chart: {
    result: [
      {
        meta: {
          symbol: "NVDA",
          longName: "NVIDIA Corporation",
          currency: "USD",
          regularMarketPrice: 131.88,
          chartPreviousClose: 130.3,
          regularMarketTime: REGULAR_MARKET_TIME,
          regularMarketVolume: 123456,
          marketState: "CLOSED",
          instrumentType: "EQUITY",
        },
        timestamp: [REGULAR_MARKET_TIME - 86400, REGULAR_MARKET_TIME],
        indicators: {
          quote: [
            {
              open: [129.5, 130],
              high: [131, 132],
              low: [128, 129],
              close: [130.3, 131.88],
              volume: [100, 200],
            },
          ],
        },
      },
    ],
    error: null,
  },
};

describe("Alpha Vantage provider normalization", () => {
  it("normalizes GLOBAL_QUOTE into the unified quote model", () => {
    const quote = normalizeAlphaVantageQuote(AV_GLOBAL_QUOTE, "NVDA");
    expect(quote).toMatchObject({
      symbol: "NVDA",
      price: 131.88,
      previousClose: 130.3,
      change: 1.58,
      changePercent: 1.21,
      volume: 12345678,
      currency: "USD",
      marketStatus: "unknown", // Alpha Vantage supplies no session field; never guessed.
      dataSource: "alpha_vantage",
      timestamp: "2026-09-18",
    });
  });

  it("normalizes TIME_SERIES_DAILY into oldest-first unified history", () => {
    const history = normalizeAlphaVantageTimeSeries(AV_DAILY, "NVDA", "Time Series (Daily)");
    expect(history.map((p) => p.date)).toEqual(["2026-09-17", "2026-09-18"]);
    expect(history[1]).toMatchObject({ close: 131.88, price: 131.88, open: 130, high: 132, low: 129, volume: 12345678 });
  });

  it("rejects an empty quote as symbol-not-found (no fallback hiding)", () => {
    expect(() => normalizeAlphaVantageQuote({ "Global Quote": {} }, "NVDA")).toThrow(SymbolNotFoundError);
  });

  it("maps the HTTP-200 rate-limit notice to ProviderRateLimitError", async () => {
    const provider = createAlphaVantageProvider({
      apiKey: "demo",
      fetchImpl: fetchReturning(200, { Note: "Thank you for using Alpha Vantage! Our standard API rate limit is 25 requests per day." }),
    });
    await expect(provider.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderRateLimitError);
    await expect(provider.getHistory("NVDA", "3mo")).rejects.toBeInstanceOf(ProviderRateLimitError);
  });

  it("maps the Information payload to ProviderRateLimitError", async () => {
    const provider = createAlphaVantageProvider({
      apiKey: "demo",
      fetchImpl: fetchReturning(200, { Information: "You have reached the rate limit." }),
    });
    await expect(provider.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderRateLimitError);
  });

  it("maps Error Message to SymbolNotFoundError", async () => {
    const provider = createAlphaVantageProvider({
      apiKey: "demo",
      fetchImpl: fetchReturning(200, { "Error Message": "Invalid API call." }),
    });
    await expect(provider.getQuote("NOPE")).rejects.toBeInstanceOf(SymbolNotFoundError);
  });

  it("maps HTTP failures and network errors to availability errors", async () => {
    const provider500 = createAlphaVantageProvider({ apiKey: "demo", fetchImpl: fetchReturning(500, {}) });
    await expect(provider500.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderUnavailableError);

    const provider429 = createAlphaVantageProvider({ apiKey: "demo", fetchImpl: fetchReturning(429, {}) });
    await expect(provider429.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderRateLimitError);

    const providerDown = createAlphaVantageProvider({
      apiKey: "demo",
      fetchImpl: vi.fn(async () => { throw new Error("socket hang up"); }) as FetchLike,
    });
    await expect(providerDown.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it("serves quote and history through the provider interface", async () => {
    const fetchImpl = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => (url.includes("GLOBAL_QUOTE") ? AV_GLOBAL_QUOTE : AV_DAILY),
    })) as FetchLike;
    const provider = createAlphaVantageProvider({ apiKey: "demo", fetchImpl });
    expect((await provider.getQuote("NVDA")).price).toBe(131.88);
    expect((await provider.getHistory("NVDA", "3mo")).length).toBe(2);
  });
});

describe("Yahoo Finance provider normalization (yfinance path)", () => {
  it("normalizes the v8 chart payload into quote + history", () => {
    const { quote, history } = normalizeYahooChart(YAHOO_CHART, "NVDA");
    expect(quote).toMatchObject({
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      assetType: "stock",
      price: 131.88,
      previousClose: 130.3,
      change: 1.58,
      changePercent: 1.21,
      currency: "USD",
      volume: 123456,
      marketStatus: "closed",
      dataSource: "yahoo_finance",
      timestamp: new Date(REGULAR_MARKET_TIME * 1000).toISOString(),
    });
    expect(history.length).toBe(2);
    expect(history[1]).toMatchObject({ close: 131.88, volume: 200 });
  });

  it("maps market states truthfully", () => {
    const withState = (state: string) =>
      normalizeYahooChart(
        { chart: { result: [{ meta: { ...YAHOO_CHART.chart.result[0].meta, marketState: state, regularMarketPrice: 1 }, timestamp: [], indicators: { quote: [{}] } }], error: null } },
        "X"
      ).quote.marketStatus;
    expect(withState("REGULAR")).toBe("open");
    expect(withState("PRE")).toBe("pre_market");
    expect(withState("POST")).toBe("after_hours");
    expect(withState("CLOSED")).toBe("closed");
    expect(withState("SOMETHING_ELSE")).toBe("unknown");
  });

  it("maps 404 and chart 'no data' errors to SymbolNotFoundError", async () => {
    const provider404 = createYahooFinanceProvider({ fetchImpl: fetchReturning(404, {}) });
    await expect(provider404.getQuote("NOPE")).rejects.toBeInstanceOf(SymbolNotFoundError);

    const providerNoData = createYahooFinanceProvider({
      fetchImpl: fetchReturning(200, { chart: { result: null, error: { code: "Not Found", description: "No data found, symbol may be delisted" } } }),
    });
    await expect(providerNoData.getQuote("NOPE")).rejects.toBeInstanceOf(SymbolNotFoundError);
  });

  it("maps 429/5xx to availability errors and empty results to response errors", async () => {
    const provider429 = createYahooFinanceProvider({ fetchImpl: fetchReturning(429, {}) });
    await expect(provider429.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderRateLimitError);

    const provider502 = createYahooFinanceProvider({ fetchImpl: fetchReturning(502, {}) });
    await expect(provider502.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderUnavailableError);

    const providerEmpty = createYahooFinanceProvider({ fetchImpl: fetchReturning(200, { chart: { result: [], error: null } }) });
    await expect(providerEmpty.getQuote("NVDA")).rejects.toBeInstanceOf(ProviderResponseError);
  });
});
