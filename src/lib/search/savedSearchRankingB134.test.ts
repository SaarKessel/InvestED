import { describe, expect, it } from "vitest";
import { globalSearch } from "./globalSearch";
import type { SavedAnswer } from "../copilot/savedAnswers";
const query = "b134uniqueneedle";
const variants = [
  [query, "irrelevant", 95],
  [`${query} continuation`, "irrelevant", 65],
  [`prefix ${query}`, "irrelevant", 45],
  [`embedded${query}suffix`, "irrelevant", 25],
  ["unrelated question", `body contains ${query}`, 25],
  ["unrelated question", "unrelated body", null],
] as const;
const rows = variants.flatMap(([question, text, score]) => ["en", "he"].flatMap((lang) => [0, 79, 80, 119, 120, 300].map((length) => [question, text, score, lang as "en" | "he", length] as const)));
describe("[sweep] B134 saved-answer search scoring and truncation are deterministic", () => {
  it.each(rows)("question %s text %s score %s lang %s suffix %s", (question, text, score, lang, length) => {
    const saved: SavedAnswer[] = [{ id: "b134", question, text: `${text} ${"🧠".repeat(length)}`, savedAt: 123 }];
    const snapshot = JSON.stringify(saved);
    const hits = globalSearch(query, { lang, saved, limit: 1000 }).filter((h) => h.kind === "saved");
    if (score === null) expect(hits).toEqual([]);
    else {
      expect(hits).toHaveLength(1);
      expect(hits[0]).toMatchObject({ kind: "saved", id: "b134", score, ask: question });
      expect(Array.from(hits[0].label).length).toBeLessThanOrEqual(80);
      expect(Array.from(hits[0].excerpt!).length).toBeLessThanOrEqual(120);
      expect(hits[0].excerpt).not.toMatch(/[\uD800-\uDBFF]$/);
    }
    expect(JSON.stringify(saved)).toBe(snapshot);
  });
});
describe("[hand] B134 saved-answer score order and equal-score label order", () => {
  it("ranks exact before prefix before word before body-only and sorts tied labels", () => {
    const saved = [
      { id: "z", question: "zulu", text: query, savedAt: 9 },
      { id: "a", question: "alpha", text: query, savedAt: 0 },
      { id: "word", question: `prefix ${query}`, text: "", savedAt: 1 },
      { id: "prefix", question: `${query} extended`, text: "", savedAt: 2 },
      { id: "exact", question: query, text: "", savedAt: 3 },
    ];
    expect(globalSearch(query, { lang: "en", saved }).map((h) => h.id)).toEqual(["exact", "prefix", "word", "a", "z"]);
  });
});
