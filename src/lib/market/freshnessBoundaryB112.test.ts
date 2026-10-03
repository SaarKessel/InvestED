import { describe, expect, it } from "vitest";
import { computeFreshness } from "./freshness";
import type { MarketDataSource } from "../../types";

const now = Date.UTC(2026, 9, 3, 12);
const minuteLimit = 15 * 60 * 1000;
const dayLimit = 96 * 60 * 60 * 1000;
const ages = [-60000, 0, minuteLimit - 1, minuteLimit, minuteLimit + 1, dayLimit - 1, dayLimit, dayLimit + 1, 365 * 86400000];
const cases: Array<[MarketDataSource, number, boolean]> = ["yahoo_finance", "alpha_vantage"].flatMap((provider) => ages.flatMap((age) => [true, false].map((timestamp): [MarketDataSource, number, boolean] => [provider as MarketDataSource, age, timestamp])));

describe("[sweep] B112 provider freshness exact timestamp/fetch fallback boundaries", () => {
  it.each(cases)("provider %s age %s timestamp present %s", (dataSource, age, timestamp) => {
    const expected = age <= minuteLimit ? "current" : age <= dayLimit ? "recent" : "stale";
    const reference = now - age;
    expect(computeFreshness({ dataSource, timestamp: timestamp ? new Date(reference).toISOString() : null, fetchedAt: timestamp ? now : reference, now: () => now })).toBe(expected);
  });
  it.each(ages)("mock age %s is always simulated", (age) => {
    expect(computeFreshness({ dataSource: "mock", timestamp: new Date(now - age).toISOString(), fetchedAt: now, now: () => now })).toBe("simulated");
  });
});

describe("[hand] B112 missing and unusable provider timestamps", () => {
  it("an invalid provider timestamp is not hidden by a fresh fetch timestamp", () => {
    expect(computeFreshness({ dataSource: "yahoo_finance", timestamp: "not-a-date", fetchedAt: now, now: () => now })).toBe("stale");
  });
  it("an absent timestamp may use fetch time, but no timestamp at all is stale", () => {
    expect(computeFreshness({ dataSource: "alpha_vantage", timestamp: "", fetchedAt: now, now: () => now })).toBe("current");
    expect(computeFreshness({ dataSource: "alpha_vantage", timestamp: "", now: () => now })).toBe("stale");
  });
  it("mock classification never consults the clock or provider timestamp", () => {
    expect(computeFreshness({ dataSource: "mock", timestamp: "invalid", now: () => { throw new Error("clock must not be called"); } })).toBe("simulated");
  });
});
