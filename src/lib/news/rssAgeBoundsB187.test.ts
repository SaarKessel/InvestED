import { describe, expect, it } from "vitest";
import { parseFeed, RSS_FEEDS, MAX_ITEMS_PER_FEED } from "./rssFeeds";
const now = Date.parse("2026-10-03T12:00:00Z");
const ages = [-36 * 3600000 - 1, -36 * 3600000, 0, 45 * 86400000, 45 * 86400000 + 1];
const rows = RSS_FEEDS.flatMap((feed) => ages.flatMap((age) => ["rss", "atom"].map((format) => [feed.id, age, format, feed] as const)));
describe("[sweep] B187 RSS and Atom timestamp acceptance exact publication boundaries", () => {
  it.each(rows)("feed %s age %s format %s", (_id, age, format, feed) => {
    const date = new Date(now - age).toISOString();
    const url = `https://${feed.linkHosts[0]}/news`;
    const xml = format === "rss" ? `<rss><channel><item><title>Headline</title><link>${url}</link><pubDate>${date}</pubDate></item></channel></rss>` : `<feed><entry><title>Headline</title><link rel="alternate" href="${url}"/><updated>${date}</updated></entry></feed>`;
    const accepted = age >= -36 * 3600000 && age <= 45 * 86400000;
    expect(parseFeed(xml, feed, now)).toEqual({ ok: true, items: accepted ? [{ title: "Headline", url, source: feed.publisher, publishedAt: date }] : [], dropped: accepted ? 0 : 1 });
  });
});
describe("[hand] B187 public headline parser sorts and caps without retaining descriptions", () => {
  it("newest eight visible headlines survive a longer reversed feed", () => {
    const feed = RSS_FEEDS[0];
    const items = Array.from({ length: 12 }, (_, i) => `<item><title>Headline${i}</title><link>https://${feed.linkHosts[0]}/story${i}</link><pubDate>${new Date(now - i * 3600000).toISOString()}</pubDate><description>ARTICLE CONTENT NOT STORED</description></item>`).reverse().join("");
    const parsed = parseFeed(`<rss><channel>${items}</channel></rss>`, feed, now);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.items).toHaveLength(MAX_ITEMS_PER_FEED);
      expect(parsed.items.map((i) => i.title)).toEqual(Array.from({ length: 8 }, (_, i) => `Headline${i}`));
      expect(parsed.dropped).toBe(0);
      expect(JSON.stringify(parsed)).not.toContain("ARTICLE CONTENT");
    }
  });
});
