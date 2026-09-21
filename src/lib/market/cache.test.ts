import { describe, expect, it } from "vitest";

import { createTtlCache } from "./cache";
import { computeFreshness } from "./freshness";

describe("TTL cache", () => {
  it("serves fresh entries without a provider round-trip", () => {
    let t = 1_000_000;
    const now = () => t;
    const cache = createTtlCache<string>({ ttlMs: 60_000, now });

    cache.set("NVDA", "quote");
    t += 30_000;

    expect(cache.get("NVDA")).toBe("quote");
    expect(cache.has("NVDA")).toBe(true);
    expect(cache.ageMs("NVDA")).toBe(30_000);
  });

  it("treats stale entries as missing", () => {
    let t = 1_000_000;
    const now = () => t;
    const cache = createTtlCache<string>({ ttlMs: 60_000, now });

    cache.set("NVDA", "quote");
    t += 61_000;

    expect(cache.get("NVDA")).toBeNull();
    expect(cache.has("NVDA")).toBe(false);
    expect(cache.ageMs("NVDA")).toBeNull();
  });

  it("supports independent short quote and long history TTLs", () => {
    let t = 1_000_000;
    const now = () => t;
    const quoteCache = createTtlCache<string>({ ttlMs: 60_000, now });
    const historyCache = createTtlCache<string>({ ttlMs: 6 * 60 * 60 * 1000, now });

    quoteCache.set("NVDA", "quote");
    historyCache.set("NVDA:3mo", "history");

    t += 120_000; // past the quote TTL, well inside the history TTL

    expect(quoteCache.get("NVDA")).toBeNull();
    expect(historyCache.get("NVDA:3mo")).toBe("history");
  });

  it("evicts the oldest entries beyond maxEntries", () => {
    const cache = createTtlCache<string>({ ttlMs: 60_000, now: () => 1, maxEntries: 2 });
    cache.set("A", "a");
    cache.set("B", "b");
    cache.set("C", "c");
    expect(cache.get("A")).toBeNull();
    expect(cache.get("C")).toBe("c");
    expect(cache.size).toBe(2);
  });
});

describe("truthful freshness classification", () => {
  const now = () => Date.parse("2026-09-21T12:00:00Z");

  it("labels mock data as simulated", () => {
    expect(computeFreshness({ dataSource: "mock", now })).toBe("simulated");
  });

  it("labels provider data minutes old as current", () => {
    expect(
      computeFreshness({ dataSource: "yahoo_finance", timestamp: "2026-09-21T11:50:00Z", now })
    ).toBe("current");
  });

  it("labels provider data hours/days old as recent (closed market, weekend)", () => {
    expect(
      computeFreshness({ dataSource: "alpha_vantage", timestamp: "2026-09-19T12:00:00Z", now })
    ).toBe("recent");
  });

  it("labels old provider data as stale", () => {
    expect(
      computeFreshness({ dataSource: "yahoo_finance", timestamp: "2026-09-01T12:00:00Z", now })
    ).toBe("stale");
  });

  it("never calls real data current without a verifiable timestamp", () => {
    expect(computeFreshness({ dataSource: "yahoo_finance", timestamp: null, fetchedAt: null, now })).toBe("stale");
  });

  it("uses fetchedAt only when no provider timestamp exists", () => {
    expect(
      computeFreshness({ dataSource: "alpha_vantage", timestamp: null, fetchedAt: Date.parse("2026-09-21T11:59:00Z"), now })
    ).toBe("current");
  });
});
