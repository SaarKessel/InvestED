import { describe, expect, it } from "vitest";
import { feedDate, headlinesRow, moversRow, MAX_HEADLINES } from "./dailyFeed";

const now = "2026-10-02T04:00:00.000Z";
describe("daily feed rows", () => {
  it("stores movers as served and nothing when unavailable or empty", () => {
    const m = { available: true, coverage: "screener", gainers: [{ symbol: "A" }], losers: [{ symbol: "B" }], fetchedAt: "t" };
    expect(moversRow("2026-10-02", now, m)).toMatchObject({ kind: "market_movers", feed_date: "2026-10-02", payload: { gainers: [{ symbol: "A" }], losers: [{ symbol: "B" }], coverage: "screener" } });
    expect(moversRow("d", now, { ...m, available: false })).toBeNull();
    expect(moversRow("d", now, { available: true, gainers: [], losers: [] })).toBeNull();
    expect(moversRow("d", now, null)).toBeNull();
  });
  it("keeps headlines with title and http link only, capped, no article text", () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ title: `T${i}`, url: `https://x.test/${i}`, source: "S", publishedAt: "p", body: "secret article text" }));
    items.push({ title: "", url: "https://x.test/e", source: "S", publishedAt: "p", body: "" }, { title: "bad", url: "javascript:alert(1)", source: "S", publishedAt: "p", body: "" });
    const r = headlinesRow("d", now, { available: true, items })!;
    const kept = (r.payload as { items: Record<string, unknown>[] }).items;
    expect(kept).toHaveLength(MAX_HEADLINES);
    expect(Object.keys(kept[0]).sort()).toEqual(["publishedAt", "source", "title", "url"]);
    expect(JSON.stringify(r)).not.toContain("secret");
    expect(headlinesRow("d", now, { available: true, items: [] })).toBeNull();
    expect(headlinesRow("d", now, { available: false, items })).toBeNull();
  });
  it("feed day follows Jerusalem time", () => {
    expect(feedDate(new Date("2026-10-01T22:30:00Z"))).toBe("2026-10-02");
  });
});
