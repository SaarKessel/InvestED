import { describe, expect, it } from "vitest";
import { CLASSIC_NOTES } from "../knowledge/content/classics";
import { retrieve } from "./retrieve";

describe("[hand] B129 ticker score request does not retrieve unrelated books", () => {
  it("does not suggest Zero to One for the reported TSLA score/source request", () => {
    const result = retrieve("מה הציון של TSLA ולמה? תראה לי את המקורות", "he", 3);
    expect(result.map((r) => r.id)).not.toContain("book-zero-to-one");
  });
});

const rows = ["TSLA", "AAPL", "MSFT", "NVDA"].flatMap((ticker) => [
  `מה הציון של ${ticker} ולמה? תראה לי את המקורות`,
  `מה המחיר של ${ticker} ולמה? תראה לי את המקורות`,
  `What is the score of ${ticker} and why? Show the sources`,
]);
describe("[sweep] B129 generic source requests do not justify unrelated book passages", () => {
  it.each(rows)("question %s", (question) => {
    const lang = /[א-ת]/.test(question) ? "he" : "en";
    expect(retrieve(question, lang).some((p) => p.id.startsWith("book-"))).toBe(false);
  });
  it.each(CLASSIC_NOTES.map((n) => [n.id, n.title.en, n.title.he] as const))("explicit title %s stays reachable", (id, en, he) => {
    expect(retrieve(en, "en", 3).map((p) => p.id)).toContain(id);
    expect(retrieve(he, "he", 3).map((p) => p.id)).toContain(id);
  });
});
