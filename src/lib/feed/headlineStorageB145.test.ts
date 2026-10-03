import { describe, expect, it } from "vitest";
import { headlinesRow, MAX_HEADLINES } from "./dailyFeed";
const rows = [0, 1, 19, 20, 21, 40].flatMap((count) => [false, true].flatMap((available) => [79, 80, 300, 301].map((length) => [count, available, length] as const)));
describe("[sweep] B145 headline storage caps valid public headlines and excludes article bodies", () => {
  it.each(rows)("count %s available %s text length %s", (count, available, length) => {
    const valid = Array.from({ length: count }, (_, i) => ({ title: `${i} ${"🧠".repeat(length)}`, url: `https://example.test/${i}`, source: "📰".repeat(length), publishedAt: `time${i}`, body: "article-body-not-stored" }));
    const items = [{ title: "invalid", url: "javascript:alert(1)" }, ...valid, { title: " ", url: "https://example.test/blank" }];
    const input = { available, items, feedProvider: "public_rss" };
    const snapshot = JSON.stringify(input);
    const row = headlinesRow("day", "now", input);
    if (!available || count === 0) expect(row).toBeNull();
    else {
      expect(row).toMatchObject({ feed_date: "day", fetched_at: "now", kind: "headlines", source: "public_rss via /api/news (headlines and links only)" });
      expect((row!.payload as { items: unknown[] }).items).toEqual(valid.slice(0, MAX_HEADLINES).map((v) => ({ title: Array.from(v.title).slice(0, 300).join(""), url: v.url, source: Array.from(v.source).slice(0, 80).join(""), publishedAt: v.publishedAt })));
      expect(JSON.stringify(row)).not.toContain("article-body-not-stored");
    }
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
describe("[hand] B145 missing headline source and date stay null", () => {
  it("stores only supplied headline and link rather than inventing item metadata", () => {
    const row = headlinesRow("day", "now", { available: true, items: [{ title: "Title", url: "https://example.test/news" }] });
    expect(row).toMatchObject({ payload: { items: [{ title: "Title", url: "https://example.test/news", source: null, publishedAt: null }] } });
  });
});
