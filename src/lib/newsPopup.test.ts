import { describe, expect, it } from "vitest";
import { emptyState, isMajor, markShown, MAX_PER_DAY, normalizePopupNews, pickPopup, type PopupNews } from "./newsPopup";
const NOW = Date.parse("2026-10-01T15:00:00Z");
const n = (o: Partial<PopupNews> = {}): PopupNews => ({ id: "a", title: "Apple reports quarterly results", url: "https://x.com/a", source: "Reuters", publishedAt: "2026-10-01T14:30:00Z", eventType: "earnings", symbols: ["AAPL"], ...o });
describe("newsPopup", () => {
  it("major = watched symbol + major event type + recent, or a board/shareholder-meeting headline", () => {
    expect(isMajor(n(), NOW)).toBe(true);
    expect(isMajor(n({ symbols: [] }), NOW)).toBe(false);
    expect(isMajor(n({ eventType: "analyst_action" }), NOW)).toBe(false);
    expect(isMajor(n({ publishedAt: "2026-10-01T10:00:00Z" }), NOW)).toBe(false);
    expect(isMajor(n({ eventType: "unknown", symbols: [], title: "Tesla board of directors meets today" }), NOW)).toBe(true);
    expect(isMajor(n({ url: "javascript:alert(1)" }), NOW)).toBe(false);
  });
  it("rate limits: gap, daily cap, seen, off", () => {
    expect(pickPopup([n()], NOW, "d", emptyState())?.id).toBe("a");
    const s = markShown(emptyState(), "a", NOW, "d");
    expect(pickPopup([n({ id: "b" })], NOW + 10 * 60000, "d", s)).toBeNull();
    expect(pickPopup([n()], NOW + 40 * 60000, "d", s)).toBeNull();
    expect(pickPopup([n({ id: "b" })], NOW + 40 * 60000, "d", s)?.id).toBe("b");
    let capped = emptyState(); for (let i = 0; i < MAX_PER_DAY; i++) capped = markShown(capped, `x${i}`, NOW - (MAX_PER_DAY - i) * 3600000, "d");
    expect(pickPopup([n({ id: "z" })], NOW, "d", capped)).toBeNull();
    expect(pickPopup([n({ id: "z" })], NOW, "next", capped)?.id).toBe("z");
    expect(pickPopup([n()], NOW, "d", { ...emptyState(), off: true })).toBeNull();
  });
  it("normalizes the news feed shape", () => { expect(normalizePopupNews({ items: [{ id: "1", title: "t", url: "https://u", source: "s", publishedAt: "p", symbols: ["A", 3] }, { id: 2 }] })).toHaveLength(1); expect(normalizePopupNews(undefined)).toEqual([]); });
});
