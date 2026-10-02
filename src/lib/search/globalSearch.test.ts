import { describe, expect, it } from "vitest";
import { globalSearch } from "./globalSearch";

describe("globalSearch", () => {
  it("returns nothing for a very short query", () => { expect(globalSearch("a", { lang: "en" })).toEqual([]); });
  it("finds a stored concept by name and gives a question to ask", () => {
    const hits = globalSearch("sharpe", { lang: "en" });
    expect(hits.some((h) => h.kind === "concept" && /sharpe/i.test(h.label) && h.ask?.startsWith("What is"))).toBe(true);
  });
  it("finds a Hebrew term and asks in Hebrew", () => {
    const hits = globalSearch("שארפ", { lang: "he" });
    const c = hits.find((h) => h.kind === "concept");
    expect(c?.ask?.startsWith("מה זה")).toBe(true);
  });
  it("finds site pages with their route", () => {
    expect(globalSearch("loans", { lang: "en" }).find((h) => h.kind === "page")?.route).toBe("/loans");
  });
  it("searches saved answers and keeps the stored question", () => {
    const saved = [{ id: "s1", question: "How does zorblat work", text: "zorblat is stored text", savedAt: 1 }];
    const h = globalSearch("zorblat", { lang: "en", saved });
    expect(h[0]).toMatchObject({ kind: "saved", ask: "How does zorblat work" });
  });
  it("is capped and sorted by score", () => {
    const hits = globalSearch("in", { lang: "en", limit: 5 });
    expect(hits.length).toBeLessThanOrEqual(5);
    for (let i = 1; i < hits.length; i++) expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score);
  });
});
