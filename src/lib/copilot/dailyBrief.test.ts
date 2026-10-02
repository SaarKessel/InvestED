import { describe, expect, it } from "vitest";
import { briefHeader, conceptOfTheDay, isDailyBrief } from "./dailyBrief";

describe("daily brief", () => {
  it("recognises the command in both languages only", () => {
    expect(isDailyBrief("daily brief")).toBe(true);
    expect(isDailyBrief("תדריך יומי")).toBe(true);
    expect(isDailyBrief("what is a brief")).toBe(false);
  });
  it("picks the same concept all day and a different one next day", () => {
    const a = conceptOfTheDay(new Date(2026, 9, 2, 6), "en");
    const b = conceptOfTheDay(new Date(2026, 9, 2, 23), "en");
    expect(a.id).toBe(b.id);
    expect(conceptOfTheDay(new Date(2026, 9, 3, 6), "en").id).not.toBe(a.id);
    expect(a.ask).toBe(`What is ${a.name}?`);
  });
  it("header names the concept in Hebrew", () => {
    const h = briefHeader(new Date(2026, 9, 2), "he");
    expect(h).toContain("תדריך יומי");
    expect(h).toContain(conceptOfTheDay(new Date(2026, 9, 2), "he").name);
  });
});
