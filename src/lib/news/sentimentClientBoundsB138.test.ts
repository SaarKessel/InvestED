import { describe, expect, it } from "vitest";
import { fetchHeadlineSentiment, MAX_HEADLINES, type SentimentInput } from "./sentiment";
const rows = [0, 1, 11, 12, 13, 30].flatMap((count) => ["en", "he"].flatMap((lang) => [0, 79, 80, 81, 300, 301].map((length) => [count, lang as "en" | "he", length] as const)));
describe("[sweep] B138 headline sentiment client bounds preserve input identity", () => {
  it.each(rows)("count %s language %s text length %s", async (count, language, length) => {
    const inputs: SentimentInput[] = Array.from({ length: count }, (_, i) => ({ id: `id${i}`, title: "a".repeat(length), source: "📰".repeat(length) }));
    const snapshot = JSON.stringify(inputs);
    let calls = 0;
    const response = await fetchHeadlineSentiment(inputs, language, async (url, init) => {
      calls++;
      expect(url).toBe("/api/news-sentiment");
      expect(init.method).toBe("POST");
      expect(init.headers).toEqual({ "Content-Type": "application/json" });
      const body = JSON.parse(init.body) as { items: SentimentInput[]; language: string };
      expect(body.language).toBe(language);
      expect(body.items).toHaveLength(Math.min(count, MAX_HEADLINES));
      body.items.forEach((item, i) => {
        expect(item.id).toBe(inputs[i].id);
        expect(item.title).toBe(Array.from(inputs[i].title).slice(0, 300).join(""));
        expect(item.source).toBe(Array.from(inputs[i].source).slice(0, 80).join(""));
      });
      return { ok: true, json: async () => ({ items: [] }) };
    });
    expect(calls).toBe(count === 0 ? 0 : 1);
    expect(response).toBeNull();
    expect(JSON.stringify(inputs)).toBe(snapshot);
  });
});
describe("[hand] B138 headline sentiment malformed JSON cannot produce a fallback tone", () => {
  it("treats a failed response parser as unavailable", async () => {
    expect(await fetchHeadlineSentiment([{ id: "a", title: "Apple beats estimates", source: "News" }], "en", async () => ({ ok: true, json: async () => { throw new Error("invalid JSON"); } }))).toBeNull();
  });
});
