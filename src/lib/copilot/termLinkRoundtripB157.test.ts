import { describe, expect, it } from "vitest";
import { allConcepts } from "../knowledge/concepts/registry";
import { linkTerms, termExplanation } from "./termLinks";
const rows = allConcepts().filter((c) => c.explain).flatMap((c) => (["en", "he"] as const).map((lang) => [c.id, lang, c[lang]] as const));
describe("[sweep] B157 linked finance text round-trips across caps and repeated mentions", () => {
  it.each(rows)("concept %s language %s name %s", (_id, lang, name) => {
    const text = `🧠 ${name}; ${name}. ${lang === "en" ? "Inflation and diversification" : "אינפלציה ופיזור"}`;
    for (const max of [0, 1, 2, 5]) {
      const segments = linkTerms(text, max);
      expect(segments.map((s) => s.text).join("")).toBe(text);
      const links = segments.filter((s) => s.id);
      expect(links.length).toBeLessThanOrEqual(max);
      expect(new Set(links.map((s) => s.id)).size).toBe(links.length);
      for (const link of links) {
        const explanation = termExplanation(link.id!, lang);
        expect(explanation).not.toBeNull();
        expect(explanation!.text.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
describe("[hand] B157 unsupported concept identities never synthesize an explanation", () => {
  it("unknown and empty IDs remain unavailable in both languages", () => {
    for (const id of ["", "b157notaconcept"]) for (const lang of ["en", "he"] as const) expect(termExplanation(id, lang)).toBeNull();
    expect(linkTerms("", 5)).toEqual([{ text: "" }]);
  });
});
