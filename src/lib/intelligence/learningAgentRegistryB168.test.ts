import { describe, expect, it } from "vitest";
import { SUPER_AGENTS, formatAgentResult } from "./superAgents";
import { allConcepts } from "../knowledge/concepts/registry";
import { conceptAnswerByLabel } from "../financialEducation";
const concepts = allConcepts().filter((c) => c.explain);
const rows = concepts.flatMap((concept) => ["en", "he"].map((lang) => [concept.id, lang as "en" | "he", concept] as const));
describe("[sweep] B168 learning agent returns only stored concepts and valid next topics", () => {
  it.each(rows)("concept %s language %s", (_id, lang, concept) => {
    const result = SUPER_AGENTS.learning.run(concept[lang], lang);
    expect(result.agent).toBe("learning");
    expect(result.steps.length).toBeLessThanOrEqual(1);
    expect(result.empty).toBe(result.steps.length === 0);
    for (const step of result.steps) {
      const source = concepts.find((c) => c.id === step.id)!;
      expect(step.label).toBe(source[lang]);
      expect(step.text).toBe(conceptAnswerByLabel(source.explain!, lang));
    }
    expect(result.next.length).toBeLessThanOrEqual(4);
    expect(new Set(result.next.map((n) => n.id)).size).toBe(result.next.length);
    for (const next of result.next) {
      const source = concepts.find((c) => c.id === next.id)!;
      expect(source).toBeDefined();
      expect(next.label).toBe(source[lang]);
      expect(next.ask).toBe(lang === "en" ? `What is ${source.en}?` : `מה זה ${source.he}?`);
    }
    const formatted = formatAgentResult(result, lang);
    expect(formatted).toContain(result.limits[lang]);
    for (const step of result.steps) expect(formatted).toContain(step.text);
    expect(result.tools.map((t) => t.path)).toEqual(["/learn", "/trivia"]);
  });
});
describe("[hand] B168 learning agent unknown topic stays unavailable", () => {
  it("does not fabricate a stored lesson", () => {
    const result = SUPER_AGENTS.learning.run("b168unmatchedtopic", "en");
    expect(result.empty).toBe(true);
    expect(result.steps).toEqual([]);
    expect(formatAgentResult(result, "en")).toContain("no stored explanation");
  });
});
