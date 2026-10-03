import { describe, expect, it } from "vitest";
import { moversRow, MAX_MOVERS } from "./dailyFeed";
const rows = [0, 1, 9, 10, 11, 25].flatMap((gainers) => [0, 1, 9, 10, 11, 25].flatMap((losers) => [false, true].map((available) => [gainers, losers, available] as const)));
describe("[sweep] B144 stored daily movers independently cap both sides", () => {
  it.each(rows)("gainers %s losers %s available %s", (gainersCount, losersCount, available) => {
    const gainers = Array.from({ length: gainersCount }, (_, i) => ({ symbol: `G${i}`, price: i + 1, metadata: { rank: i } }));
    const losers = Array.from({ length: losersCount }, (_, i) => ({ symbol: `L${i}`, price: i + 1, metadata: { rank: i } }));
    const input = { available, gainers, losers, coverage: "screener", fetchedAt: "provider time" };
    const snapshot = JSON.stringify(input);
    const row = moversRow("2026-10-03", "fetch time", input);
    if (!available || gainersCount + losersCount === 0) expect(row).toBeNull();
    else expect(row).toEqual({ feed_date: "2026-10-03", kind: "market_movers", payload: { coverage: "screener", gainers: gainers.slice(0, MAX_MOVERS), losers: losers.slice(0, MAX_MOVERS), providerFetchedAt: "provider time" }, source: "Yahoo Finance screener via /api/market-movers", fetched_at: "fetch time" });
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
describe("[hand] B144 stored movers preserve missing optional metadata honestly", () => {
  it("does not invent coverage or a provider timestamp for a one-sided feed", () => {
    expect(moversRow("day", "now", { available: true, gainers: [{ symbol: "TSLA" }] })).toMatchObject({ payload: { coverage: null, providerFetchedAt: null, gainers: [{ symbol: "TSLA" }], losers: [] } });
    expect(moversRow("day", "now", null)).toBeNull();
  });
});
