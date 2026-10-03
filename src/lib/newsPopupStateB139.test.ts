import { describe, expect, it } from "vitest";
import { emptyState, markShown, pickPopup, MIN_GAP_MS, MAX_PER_DAY, type PopupNews } from "./newsPopup";
const now = Date.parse("2026-10-03T12:00:00Z");
const items: PopupNews[] = [10, 20, 30].map((minutes) => ({ id: `story${minutes}`, title: "Company earnings announcement", url: "https://example.test/news", source: "Example", publishedAt: new Date(now - minutes * 60000).toISOString(), eventType: "earnings", symbols: ["TSLA"] }));
const rows = [false, true].flatMap((off) => ["today", "yesterday"].flatMap((dayKey) => [0, 1, 2, 3, 5].flatMap((shownToday) => [MIN_GAP_MS - 1, MIN_GAP_MS, MIN_GAP_MS + 1].flatMap((gap) => [[], ["story10"], ["story10", "story20", "story30"]].map((seen) => [off, dayKey, shownToday, gap, seen] as const)))));
describe("[sweep] B139 breaking popup state gates and newest unseen story", () => {
  it.each(rows)("off %s day %s shown %s gap %s seen %j", (off, dayKey, shownToday, gap, seen) => {
    const state = { ...emptyState(), off, dayKey, shownToday, lastShownAt: now - gap, seen: [...seen] };
    const snapshot = JSON.stringify({ state, items });
    const blocked = off || gap < MIN_GAP_MS || (dayKey === "today" && shownToday >= MAX_PER_DAY);
    const expected = blocked ? null : items.find((item) => !seen.includes(item.id)) ?? null;
    expect(pickPopup([...items].reverse(), now, "today", state)).toEqual(expected);
    expect(JSON.stringify({ state, items })).toBe(snapshot);
  });
});
describe("[hand] B139 shown stories advance only the supplied state", () => {
  it("resets a new-day count and increments the same-day count without mutation", () => {
    const previous = { ...emptyState(), dayKey: "yesterday", shownToday: 3, seen: ["old"] };
    const today = markShown(previous, "new", now, "today");
    expect(today).toEqual({ ...previous, dayKey: "today", shownToday: 1, seen: ["old", "new"], lastShownAt: now });
    expect(previous.seen).toEqual(["old"]);
    expect(previous.shownToday).toBe(3);
    expect(markShown(today, "next", now + MIN_GAP_MS, "today").shownToday).toBe(2);
  });
});
