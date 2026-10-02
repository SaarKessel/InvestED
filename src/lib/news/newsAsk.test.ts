import { describe, expect, it } from "vitest";
import { formatRssNews, isOfficialNewsQuestion } from "./newsAsk";
import type { RssNewsResult } from "./rssClient";

const item = (n: number) => ({ id: `i${n}`, title: `Title ${n}`, url: `https://example.gov/${n}`, source: "Federal Reserve Board", publishedAt: "2026-10-01T12:00:00Z", eventType: "policy", eventLabel: { he: "מדיניות", en: "Policy" } });
const data: RssNewsResult = { available: true, feedProvider: "public_rss", items: [item(1), item(2), item(3)], feeds: [], fetchedAt: "2026-10-02T00:00:00Z" };

describe("official news questions", () => {
  it("matches announcement and headline questions in both languages", () => {
    expect(isOfficialNewsQuestion("what are the latest official announcements")).toBe(true);
    expect(isOfficialNewsQuestion("latest Fed news")).toBe(true);
    expect(isOfficialNewsQuestion("מה ההודעות הרשמיות האחרונות")).toBe(true);
    expect(isOfficialNewsQuestion("חדשות אחרונות")).toBe(true);
  });
  it("does not take over unrelated questions", () => {
    expect(isOfficialNewsQuestion("what is a bond")).toBe(false);
    expect(isOfficialNewsQuestion("convert 100 USD to ILS")).toBe(false);
  });
  it("formats headlines with publisher, date and link only", () => {
    const en = formatRssNews(data, "en");
    expect(en).toContain("Title 1 - Federal Reserve Board, 2026-10-01");
    expect(en).toContain("https://example.gov/1");
    expect(formatRssNews(data, "he")).toContain("3 ההודעות הרשמיות");
  });
  it("says so honestly when nothing loaded", () => {
    expect(formatRssNews(null, "en")).toContain("will not make up");
    expect(formatRssNews({ ...data, available: false, items: [] }, "he")).toContain("לא אמציא");
  });
});
