import { describe, expect, it } from "vitest";
import { normalizePopupNews } from "./newsPopup";
const base = { id: "a", title: "Title", url: "https://example.test/news", source: "Example", publishedAt: "2026-10-03T12:00:00Z" };
const fields = ["id", "title", "url", "source", "publishedAt"] as const;
const rows = fields.flatMap((field) => [undefined, null, 0, false, [], {}].map((value) => [field, value] as const));
describe("[sweep] B142 popup news required fields reject malformed values", () => {
  it.each(rows)("field %s malformed %j", (field, value) => {
    const raw = { items: [{ ...base, [field]: value }, { ...base, id: "valid" }] };
    expect(normalizePopupNews(raw)).toEqual([{ ...base, id: "valid", eventType: "unknown", symbols: [] }]);
  });
});
const optionRows = [undefined, null, false, 0, "earnings"].flatMap((eventType) => [undefined, null, "TSLA", ["TSLA", 3, null, "NVDA", false]].map((symbols) => [eventType, symbols] as const));
describe("[sweep] B142 popup optional fields normalize without mutating the feed", () => {
  it.each(optionRows)("event %j symbols %j", (eventType, symbols) => {
    const raw = { items: [{ ...base, eventType, symbols, unrelated: "drop this" }] };
    const snapshot = JSON.stringify(raw);
    expect(normalizePopupNews(raw)).toEqual([{ ...base, eventType: typeof eventType === "string" ? eventType : "unknown", symbols: Array.isArray(symbols) ? symbols.filter((v) => typeof v === "string") : [] }]);
    expect(JSON.stringify(raw)).toBe(snapshot);
  });
});
describe("[hand] B142 popup normalization handles absent envelopes", () => {
  it("never invents a story for non-array input", () => {
    for (const raw of [null, undefined, {}, { items: null }, { items: "news" }, { items: [null, undefined, 0] }]) expect(normalizePopupNews(raw)).toEqual([]);
  });
});
