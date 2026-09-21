import { describe, it, expect } from "vitest";
import {
  normalizeYahooScreener,
  createYahooMoversFetcher,
  supportsMovers,
} from "./movers";
import { ProviderRateLimitError, ProviderResponseError, ProviderUnavailableError } from "./errors";

const SCREENER_PAYLOAD = {
  finance: {
    result: [
      {
        total: 2,
        quotes: [
          {
            symbol: "ABC",
            longName: "ABC Corp",
            regularMarketPrice: { raw: 12.34, fmt: "12.34" },
            regularMarketChangePercent: { raw: 5.67, fmt: "+5.67%" },
            regularMarketTime: 1_800_000_000,
            currency: "USD",
          },
          {
            symbol: "XYZ",
            shortName: "XYZ Inc",
            regularMarketPrice: 7.5,
            regularMarketChangePercent: -2.1,
            currency: "USD",
          },
        ],
      },
    ],
    error: null,
  },
};

describe("normalizeYahooScreener", () => {
  it("normalizes quotes with names, prices, changes and provider timestamps", () => {
    const movers = normalizeYahooScreener(SCREENER_PAYLOAD);
    expect(movers).toHaveLength(2);
    expect(movers[0]).toMatchObject({
      symbol: "ABC",
      name: "ABC Corp",
      price: 12.34,
      changePercent: 5.67,
      currency: "USD",
      dataSource: "yahoo_finance",
    });
    expect(movers[0].timestamp).toBe(new Date(1_800_000_000 * 1000).toISOString());
    expect(movers[1].name).toBe("XYZ Inc");
    expect(movers[1].timestamp).toBeNull();
  });

  it("skips entries without a symbol", () => {
    const payload = {
      finance: { result: [{ quotes: [{ regularMarketPrice: { raw: 1 } }] }], error: null },
    };
    expect(normalizeYahooScreener(payload)).toHaveLength(0);
  });

  it("rejects provider errors and malformed payloads without fabricating", () => {
    expect(() => normalizeYahooScreener({ finance: { result: null, error: { code: "bad" } } }))
      .toThrow(ProviderResponseError);
    expect(() => normalizeYahooScreener({})).toThrow(ProviderResponseError);
  });
});

describe("createYahooMoversFetcher", () => {
  it("is recognized by supportsMovers", () => {
    expect(supportsMovers(createYahooMoversFetcher())).toBe(true);
    expect(supportsMovers({})).toBe(false);
  });

  it("maps HTTP 429 to a rate-limit (availability) error", async () => {
    const fetcher = createYahooMoversFetcher({
      fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }),
    });
    await expect(fetcher.getMovers("day_gainers")).rejects.toBeInstanceOf(ProviderRateLimitError);
  });

  it("maps other HTTP failures to availability errors", async () => {
    const fetcher = createYahooMoversFetcher({
      fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) }),
    });
    await expect(fetcher.getMovers("day_losers")).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it("maps network failures to availability errors", async () => {
    const fetcher = createYahooMoversFetcher({
      fetchImpl: async () => { throw new Error("socket hang up"); },
    });
    await expect(fetcher.getMovers("day_gainers")).rejects.toBeInstanceOf(ProviderUnavailableError);
  });

  it("serves normalized movers on success", async () => {
    const fetcher = createYahooMoversFetcher({
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => SCREENER_PAYLOAD }),
    });
    const movers = await fetcher.getMovers("day_gainers", 5);
    expect(movers.map((m) => m.symbol)).toEqual(["ABC", "XYZ"]);
  });
});
