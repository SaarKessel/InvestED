import { describe, expect, it } from "vitest";
import { briefHeader, conceptOfTheDay, dayNumber } from "./dailyBrief";
import { allConcepts } from "../knowledge/concepts/registry";
const dates = Array.from({ length: 24 }, (_, month) => [2025 + Math.floor(month / 12), month % 12] as const);
const rows = dates.flatMap(([year, month]) => [1, 15, 28].flatMap((day) => ["en", "he"].map((lang) => [year, month, day, lang as "en" | "he"] as const)));
describe("[sweep] B136 daily brief local calendar headers and bilingual concept identity", () => {
  it.each(rows)("%s month %s day %s language %s", (year, month, day, lang) => {
    const morning = new Date(year, month, day, 6, 0);
    const night = new Date(year, month, day, 23, 59);
    const chosen = conceptOfTheDay(morning, lang);
    const concept = allConcepts().find((c) => c.id === chosen.id)!;
    expect(concept.explain).not.toBeNull();
    expect(chosen.name).toBe(concept[lang]);
    expect(chosen.ask).toBe(lang === "en" ? `What is ${concept.en}?` : `מה זה ${concept.he}?`);
    expect(conceptOfTheDay(morning, lang === "en" ? "he" : "en").id).toBe(chosen.id);
    expect(conceptOfTheDay(night, lang)).toEqual(chosen);
    expect(dayNumber(night)).toBe(dayNumber(morning));
    expect(dayNumber(new Date(year, month, day + 1, 12))).toBe(dayNumber(morning) + 1);
    const header = briefHeader(morning, lang);
    expect(header).toContain(chosen.name);
    expect(header).toContain(morning.toLocaleDateString(lang === "en" ? "en-GB" : "he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    expect(briefHeader(night, lang)).toBe(header);
    expect(header).toContain(lang === "en" ? "nothing is generated" : "בלי תוכן שנוצר");
  });
});
describe("[hand] B136 daily brief crosses a leap-year February without skipping a day", () => {
  it("February 28, February 29 and March 1 are consecutive local days", () => {
    const days = [new Date(2028, 1, 28, 12), new Date(2028, 1, 29, 12), new Date(2028, 2, 1, 12)].map(dayNumber);
    expect(days[1] - days[0]).toBe(1);
    expect(days[2] - days[1]).toBe(1);
  });
});
