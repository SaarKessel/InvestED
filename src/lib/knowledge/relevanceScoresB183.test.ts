import { describe, expect, it } from "vitest";
import { relevantHits } from "./knowledge";
const words = ["alpha", "bravo", "charlie", "delta", "echo"];
const rows = [1, 2, 3, 4, 5].flatMap((tokens) => [0, 1, 2, 3, 4, 5].flatMap((matches) => [0, 1, 3].map((limit) => [tokens, matches, limit] as const)));
describe("[sweep] B183 stored note relevance needs enough meaningful matching terms", () => {
  it.each(rows)("question words %s matching %s limit %s", (tokens, matches, limit) => {
    const question = words.slice(0, tokens).join(" ");
    const item = { id: "match", title: words.slice(0, matches).join(" "), body: "background note" };
    const snapshot = JSON.stringify(item);
    const actualMatches = Math.min(tokens, matches);
    const need = tokens >= 3 ? 2 : 1;
    expect(relevantHits(question, [item], limit)).toEqual(actualMatches >= need && limit > 0 ? [item] : []);
    expect(JSON.stringify(item)).toBe(snapshot);
  });
});
describe("[hand] B183 relevance ranking is stable and conserves original note objects", () => {
  it("orders by matching-token score and retains input order on ties", () => {
    const items = [
      { id: "low", title: "alpha bravo", body: "" },
      { id: "high", title: "alpha bravo charlie", body: "" },
      { id: "tie", title: "alpha", body: "bravo" },
    ];
    const ranked = relevantHits("alpha bravo charlie", items);
    expect(ranked.map((i) => i.id)).toEqual(["high", "low", "tie"]);
    expect(ranked[0]).toBe(items[1]);
    expect(relevantHits("what is the", items)).toEqual([]);
  });
});
