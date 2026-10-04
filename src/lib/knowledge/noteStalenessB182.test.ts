import { describe, expect, it } from "vitest";
import { isStaleNote, STALE_AFTER_DAYS, tokenizeQuestion, wantsKnowledgeLookup } from "./knowledge";
const rows = ["2026-01-01", "2026-03-15", "2026-10-03"].flatMap((date) => [-1, 0, 1].map((delta) => [date, delta] as const));
describe("[sweep] B182 stored note staleness exact ninety-day UTC boundary", () => {
  it.each(rows)("published %s boundary offset %s ms", (published, delta) => {
    const now = new Date(Date.parse(`${published}T00:00:00Z`) + STALE_AFTER_DAYS * 86400000 + delta);
    expect(isStaleNote(published, now)).toBe(delta > 0);
  });
});
describe("[hand] B182 invalid dates do not invent a stale-age assertion", () => {
  it("requires a supplied date-only field", () => {
    for (const published of [null, "", "not a date", "2026-10", "2026-10-03T00:00:00Z", "2026-99-99"]) expect(isStaleNote(published, new Date("2026-10-03T12:00:00Z"))).toBe(false);
  });
  it("normalizes compatibility characters,deduplicates tokens and caps meaningful terms", () => {
    expect(tokenizeQuestion("ＰＲＩＣＥ price What is the price?")).toEqual(["price"]);
    expect(tokenizeQuestion(Array.from({ length: 20 }, (_, i) => `word${i}`).join(" "))).toHaveLength(12);
    expect(tokenizeQuestion("what is the and מה זה של")).toEqual([]);
    for (const intent of ["general", "educational_question", "strategy_question"]) expect(wantsKnowledgeLookup(intent)).toBe(true);
    for (const intent of ["asset_analysis", "financial_projection", "comparison", "made-up"]) expect(wantsKnowledgeLookup(intent)).toBe(false);
  });
});
