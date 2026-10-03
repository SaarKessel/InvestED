import { describe, expect, it } from "vitest";
import { formatRssNews } from "./newsAsk";
import type { RssNewsResult } from "./rssClient";
const rows = [0, 1, 4, 5, 6, 12].flatMap((count) => ["en", "he"].flatMap((lang) => [0, 1, 5, 20].map((limit) => [count, lang as "en" | "he", limit] as const)));
describe("[sweep] B146 RSS news formatting preserves publisher date link and bounded order", () => {
  it.each(rows)("count %s language %s limit %s", (count, lang, limit) => {
    const result: RssNewsResult = { available: true, feedProvider: "public_rss", fetchedAt: "now", feeds: [], items: Array.from({ length: count }, (_, i) => ({ id: `id${i}`, title: `Headline${i}`, url: `https://example.test/story${i}`, source: `Publisher${i}`, publishedAt: i % 2 === 0 ? "2026-10-03T12:34:56Z" : "date unavailable", eventType: "policy", eventLabel: { en: "Policy", he: "מדיניות" } })) };
    const snapshot = JSON.stringify(result);
    const formatted = formatRssNews(result, lang, limit);
    if (count === 0) expect(formatted).toContain(lang === "en" ? "will not make up headlines" : "לא אמציא כותרות");
    else {
      expect(formatted).toContain(lang === "en" ? `the ${Math.min(count, limit)} latest` : `${Math.min(count, limit)} ההודעות`);
      result.items.forEach((item, i) => {
        if (i < limit) expect(formatted).toContain(`• ${item.title} - ${item.source}, ${i % 2 === 0 ? "2026-10-03" : "date unavailable"}\n  ${item.url}`);
        else expect(formatted).not.toContain(item.url);
      });
    }
    expect(JSON.stringify(result)).toBe(snapshot);
  });
});
describe("[hand] B146 unavailable official news cannot present stale headlines as current", () => {
  it("rejects an unavailable source even when its old item list is nonempty", () => {
    const result: RssNewsResult = { available: false, feedProvider: "public_rss", fetchedAt: "old", feeds: [], items: [{ id: "old", title: "Stale headline", url: "https://example.test/old", source: "Publisher", publishedAt: "old", eventType: "policy", eventLabel: { en: "Policy", he: "מדיניות" } }] };
    expect(formatRssNews(result, "en")).not.toContain("Stale headline");
    expect(formatRssNews(result, "he")).toContain("לא אמציא");
  });
});
