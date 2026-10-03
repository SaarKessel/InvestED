import { describe, expect, it } from "vitest";
import { mostlyCovered } from "./multiPart";
const words = ["alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet"];
const rows = [1, 2, 3, 4, 5, 6, 10].flatMap((count) => Array.from({ length: count + 1 }, (_, covered) => [count, covered] as const));
describe("[sweep] B154 stored-answer coverage exact sixty-percent threshold", () => {
  it.each(rows)("words %s covered %s", (count, covered) => {
    const text = words.slice(0, count).join(" ");
    const main = words.slice(0, covered).join(" ");
    const expected = covered / count >= 0.6;
    expect(mostlyCovered(text, main)).toBe(expected);
    expect(mostlyCovered(text.toUpperCase(), main.toUpperCase())).toBe(expected);
    expect(mostlyCovered(text.replaceAll(" ", ", "), main)).toBe(expected);
    expect(mostlyCovered(text, `${main} unrelated background content`)).toBe(expected);
  });
});
describe("[hand] B154 empty and short-only answers cannot count as coverage", () => {
  it("ignores one/two-letter tokens and preserves Hebrew word matching", () => {
    expect(mostlyCovered("", "anything")).toBe(false);
    expect(mostlyCovered("a an to", "a an to")).toBe(false);
    expect(mostlyCovered("פיזור מפחית תלות", "פיזור מפחית")).toBe(true);
    expect(mostlyCovered("פיזור מפחית תלות", "פיזור")).toBe(false);
  });
});
