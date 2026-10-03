import { describe, expect, it } from "vitest";
import { globalSearch } from "./globalSearch";
import { allConcepts } from "../knowledge/concepts/registry";
const rows = allConcepts().flatMap((c) => (["en", "he"] as const).map((lang) => [c.id, lang, c[lang]] as const));
describe("[sweep] B131 full-name global search keeps every registry concept reachable", () => {
  it.each(rows)("concept %s language %s query %s", (id, lang, query) => {
    const hits = globalSearch(query, { lang, limit: 1000 });
    const hit = hits.find((h) => h.kind === "concept" && h.id === id);
    expect(hit).toBeDefined(); expect(hit!.label).toBe(query);
    expect(hit!.score).toBeGreaterThanOrEqual(100);
    expect(hit!.ask).toBe(lang === "he" ? `מה זה ${query}?` : `What is ${query}?`);
    const normalized = globalSearch(`  ${query.toUpperCase()}  `, { lang, limit: 1000 });
    expect(normalized).toEqual(hits);
    for (let i = 1; i < hits.length; i++) expect(hits[i].score).toBeLessThanOrEqual(hits[i - 1].score);
    expect(globalSearch(query, { lang, limit: 1 })).toEqual(hits.slice(0, 1));
  });
});
describe("[hand] B131 saved answers do not change their contents", () => {
  it("search returns stored questions and safe excerpts without editing the saved entry", () => {
    const saved = [{ id: "B131", question: "What is uncommonterm?", text: "uncommonterm " + "x".repeat(200), savedAt: 1 }];
    const before = JSON.stringify(saved);
    const hit = globalSearch("uncommonterm", { lang: "en", saved })[0];
    expect(hit).toMatchObject({ kind: "saved", id: "B131", ask: saved[0].question });
    expect(hit.excerpt!.length).toBeLessThanOrEqual(121);
    expect(JSON.stringify(saved)).toBe(before);
  });
});
