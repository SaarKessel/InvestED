import { describe, expect, it } from "vitest";
import { isMajor, MAX_AGE_MS, type PopupNews } from "./newsPopup";
const now = Date.parse("2026-10-03T12:00:00Z");
const events = ["earnings", "guidance", "merger_acquisition", "regulatory", "management_change", "analyst_action", "unknown"];
const rows = events.flatMap((eventType) => [false, true].flatMap((watched) => ["Company announcement", "Company board of directors meeting"].flatMap((title) => [-300001, -300000, 0, MAX_AGE_MS, MAX_AGE_MS + 1].map((age) => [eventType, watched, title, age] as const))));
describe("[sweep] B141 popup major-story age and watched-type boundary oracle", () => {
  it.each(rows)("type %s watched %s title %s age %s", (eventType, watched, title, age) => {
    const story: PopupNews = { id: "a", title, url: "https://example.test/story", source: "Example", publishedAt: new Date(now - age).toISOString(), eventType, symbols: watched ? ["TSLA"] : [] };
    const allowedType = ["earnings", "guidance", "merger_acquisition", "regulatory", "management_change"].includes(eventType);
    expect(isMajor(story, now)).toBe(age >= -300000 && age <= MAX_AGE_MS && ((watched && allowedType) || title.includes("board of directors")));
  });
});
describe("[hand] B141 major stories require usable titles timestamps and web URLs", () => {
  it("invalid transport or absent visible content suppresses a popup", () => {
    const story: PopupNews = { id: "a", title: "Company earnings", url: "https://example.test/story", source: "Example", publishedAt: new Date(now).toISOString(), eventType: "earnings", symbols: ["TSLA"] };
    for (const url of ["javascript:alert(1)", "file:///news", "", "ftp://example.test"]) expect(isMajor({ ...story, url }, now)).toBe(false);
    for (const title of ["", "   "]) expect(isMajor({ ...story, title }, now)).toBe(false);
    expect(isMajor({ ...story, publishedAt: "bad date" }, now)).toBe(false);
  });
});
