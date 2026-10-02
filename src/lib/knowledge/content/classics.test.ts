import { describe, expect, it } from "vitest";
import { CLASSIC_NOTES, CLASSIC_EXPLANATIONS, classicExplanation } from "./classics";
import { allConcepts, findConcept, findConceptsInText, getConcept } from "../concepts/registry";
import { conceptAnswerByLabel, explainFinancialConcept, explainFinancialConcepts } from "../../financialEducation";
import { retrieve } from "../../search/retrieve";
import { groundAnswer } from "../../copilot/groundedAnswer";
import { UNKNOWN_ANSWER } from "../../copilotResponse";

describe("original economics and book library", () => {
  it("contains the scoped models and books without duplicate registry ids", () => {
    expect(CLASSIC_NOTES.filter((n) => n.kind === "economics-model")).toHaveLength(13);
    expect(CLASSIC_NOTES.filter((n) => n.kind === "book-synthesis")).toHaveLength(9);
    const ids = allConcepts().map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  for (const note of CLASSIC_NOTES) {
    for (const lang of ["en", "he"] as const) {
      it(`${note.id} is complete and reachable through ${lang} explanation and retrieval`, () => {
        const answer = classicExplanation(note, lang);
        expect(conceptAnswerByLabel(note.title.en, lang)).toBe(answer);
        expect(explainFinancialConcept(`Explain ${note.title[lang]}`, lang)).toBe(answer);
        expect(findConcept(note.title[lang])?.id).toBe(note.id);
        expect(findConceptsInText(note.title[lang]).map((c) => c.id)).toContain(note.id);
        expect(retrieve(note.title[lang], lang, 3).map((p) => p.id)).toContain(note.id);
        for (const part of ["attribution", "idea", "why", "practice", "limits"] as const) {
          expect(note[part][lang].length).toBeGreaterThan(20);
          if (lang === "he") expect(note[part][lang]).toMatch(/[א-ת]/);
          else expect(note[part][lang]).not.toMatch(/[א-ת]/);
        }
        expect(answer).toContain(lang === "he" ? "מגבלות וביקורת" : "Limits and critiques");
        expect(answer).toContain(lang === "he" ? "לא ייעוץ השקעות אישי" : "not personal investment advice");
        expect(answer).toContain(note.sources[0].url);
        expect(answer).not.toContain("undefined");
      });
    }
    it(`${note.id} links only to existing knowledge and carries public provenance`, () => {
      for (const id of note.related) expect(getConcept(id), id).toBeDefined();
      expect(note.sources.length).toBeGreaterThan(0);
      for (const source of note.sources) expect(new URL(source.url).protocol).toBe("https:");
    });
  }
  it("keeps Sharpe ratio separate from the named CAPM note", () => {
    expect(findConcept("Sharpe")?.id).toBe("sharpe-ratio");
    expect(explainFinancialConcept("what is Sharpe ratio", "en")).not.toContain("Learning exercise");
    expect(explainFinancialConcept("explain Sharpe CAPM", "en")).toContain("different from the Sharpe ratio");
  });
  it("distinguishes contributors from prize recipients", () => {
    expect(conceptAnswerByLabel("Prospect theory", "en")).toContain("Tversky did not");
    expect(conceptAnswerByLabel("Black-Scholes-Merton option pricing", "en")).toContain("Black did not");
  });
  it("prioritises named books over generic concepts in their titles", () => {
    expect(explainFinancialConcepts("summarize The Psychology of Money", "en")).toContain("Morgan Housel");
    expect(explainFinancialConcepts("סכמי את ניתוח ניירות ערך", "he")).toContain("דיוויד דוד");
  });
  it("uses word boundaries rather than matching names inside unrelated words", () => {
    for (const text of ["Thalerland", "Spencer", "Akerloff", "Zero to Oneness"]) {
      expect(CLASSIC_EXPLANATIONS.some((n) => n.patterns.some((p) => p.test(text))), text).toBe(false);
    }
  });
  it("grounded fallback returns a stored book note with provenance", () => {
    for (const [question, lang, id] of [
      ["The Lean Startup", "en", "book-lean-startup"],
      ["הפסיכולוגיה של הכסף", "he", "book-psychology-money"],
      ["Markowitz portfolio selection", "en", "markowitz-portfolio"],
    ] as const) {
      const result = groundAnswer(question, lang, "educational_question", UNKNOWN_ANSWER[lang]);
      expect(result?.kind).toBe("grounded");
      expect(result?.sources[0].id).toBe(id);
      const note = CLASSIC_NOTES.find((n) => n.id === id)!;
      expect(result?.text).toContain(classicExplanation(note, lang));
    }
  });
  it("book notes declare their selected-ideas scope instead of claiming full books or model training", () => {
    for (const note of CLASSIC_NOTES.filter((n) => n.kind === "book-synthesis")) {
      expect(classicExplanation(note, "en")).toContain("not the book's text or a full summary");
      expect(classicExplanation(note, "he")).toContain("לא טקסט מהספר או סיכום מלא");
    }
  });
});

import { processAIMessage } from "../../aiConversationService";
import { createConversationSession } from "../../conversationContext";
describe("classic notes through the real copilot conversation path", () => {
  for (const note of CLASSIC_NOTES) for (const lang of ["en", "he"] as const) {
    it(`${note.id} chat response in ${lang} keeps the note and its source`, async () => {
      const question = lang === "he" ? `הסבירי את ${note.title.he}` : `Explain ${note.title.en}`;
      const turn = await processAIMessage(createConversationSession(), question, lang, {
        fetchAsset: async () => null, enhance: async () => null,
      });
      expect(turn.response.text).toContain(note.idea[lang]);
      expect(turn.response.text).toContain(note.limits[lang]);
      expect(turn.response.text).toContain(note.sources[0].url);
      expect(turn.response.clarification).toBeNull();
    });
  }
});
