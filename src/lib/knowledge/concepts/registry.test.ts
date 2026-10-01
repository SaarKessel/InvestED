import { describe, expect, it } from "vitest";
import { allConcepts, findConcept, findConceptsInText, getConcept, relatedConcepts } from "./registry";
import { conceptAnswerByLabel } from "@/lib/financialEducation";

describe("concept registry", () => {
  it("has at least 100 concepts with unique ids", () => {
    const ids = allConcepts().map((c) => c.id);
    expect(ids.length).toBeGreaterThanOrEqual(100);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("every related id and explanation link exists", () => {
    for (const c of allConcepts()) {
      for (const r of c.related) expect(getConcept(r), `${c.id} -> ${r}`).toBeDefined();
      if (c.explain) expect(conceptAnswerByLabel(c.explain, "en"), c.id).not.toBeNull();
      expect(c.he.length, c.id).toBeGreaterThan(0);
    }
  });
  it("resolves aliases in Hebrew, English and abbreviations to one concept", () => {
    for (const t of ["Sharpe", "Sharpe Ratio", "יחס שארפ", "risk adjusted return", "תשואה מתואמת סיכון"]) expect(findConcept(t)?.id, t).toBe("sharpe-ratio");
    for (const t of ["S&P 500", "SPX", "SP500", "אס אנד פי", "מדד S&P 500"]) expect(findConcept(t)?.id, t).toBe("sp-500");
    for (const t of ["P/E", "PE", "price-to-earnings", "מכפיל רווח"]) expect(findConcept(t)?.id, t).toBe("p-e-ratio");
    for (const t of ["USD", "דולר", "dollar"]) expect(findConcept(t)?.id, t).toBe("exchange-rate");
    expect(findConcept("לוח שפיצר")?.id).toBe("amortization");
  });
  it("finds concepts in mixed-language sentences, with Hebrew prefixes", () => {
    expect(findConceptsInText("מה זה Sharpe Ratio?").map((c) => c.id)).toContain("sharpe-ratio");
    expect(findConceptsInText("איך הפיזור משפיע על התנודתיות").map((c) => c.id)).toEqual(expect.arrayContaining(["diversification", "volatility"]));
    expect(findConceptsInText("explain the P/E and EPS").map((c) => c.id)).toEqual(expect.arrayContaining(["p-e-ratio", "eps"]));
  });
  it("does not match inside other words", () => {
    expect(findConceptsInText("the opera is nice").map((c) => c.id)).not.toContain("options");
    expect(findConceptsInText("pet shop").map((c) => c.id)).not.toContain("p-e-ratio");
  });
  it("builds the related-intelligence chain from the graph", () => {
    expect(relatedConcepts("sharpe-ratio").map((c) => c.id)).toContain("volatility");
    expect(relatedConcepts("nope")).toEqual([]);
  });
});

import { relatedChips } from "./registry";
describe("related chips", () => {
  it("English question gives English chips that have answers", () => {
    const chips = relatedChips("What is diversification?");
    expect(chips.length).toBeGreaterThan(0);
    for (const c of chips) { expect(c.ask).toMatch(/^What is /); expect(getConcept(c.id)?.explain).toBeTruthy(); }
  });
  it("Hebrew question gives Hebrew chips", () => {
    const chips = relatedChips("מה זה פיזור?");
    expect(chips.length).toBeGreaterThan(0);
    for (const c of chips) expect(c.ask).toMatch(/^מה זה /);
  });
  it("no concept, no chips", () => expect(relatedChips("hello there")).toEqual([]));
});
