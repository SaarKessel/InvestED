// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { useQuizBank, type QuizQuestion } from "./quizBank";
import { LanguageProvider } from "@/context/languageContext";
import en from "@/locales/en.json";
import he from "@/locales/he.json";

// Render the bank under a language by serializing the hook output through a
// probe component (no testing-library dependency needed).
function bankFor(language: "he" | "en"): QuizQuestion[] {
  window.localStorage.setItem("invested_language_preference", language);
  let captured: QuizQuestion[] = [];
  function Probe() {
    captured = useQuizBank();
    return null;
  }
  renderToStaticMarkup(createElement(LanguageProvider, null, createElement(Probe)));
  return captured;
}

describe("quiz bank", () => {
  it("has 25 questions with three options and a valid correct index", () => {
    const bank = bankFor("he");
    expect(bank).toHaveLength(25);
    for (const q of bank) {
      expect(q.options).toHaveLength(3);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(3);
      expect(q.question.trim()).not.toBe("");
      expect(q.explanation.trim()).not.toBe("");
    }
  });

  it("has fully translated content in both dictionaries for every question id", () => {
    const bank = bankFor("he");
    for (const q of bank) {
      for (const suffix of ["", "_o1", "_o2", "_o3", "_e"]) {
        const key = `quiz_${q.id}${suffix}`;
        expect(en[key as keyof typeof en]).toBeTruthy();
        expect(he[key as keyof typeof he]).toBeTruthy();
      }
    }
  });

  it("localizes every string when the language changes", () => {
    const heBank = bankFor("he");
    const enBank = bankFor("en");
    for (let i = 0; i < heBank.length; i++) {
      expect(heBank[i].question).not.toBe(enBank[i].question);
      expect(heBank[i].explanation).not.toBe(enBank[i].explanation);
      expect(/[\u0590-\u05FF]/.test(heBank[i].question)).toBe(true);
      expect(/[\u0590-\u05FF]/.test(enBank[i].question)).toBe(false);
    }
  });

  it("spreads the correct answer across option positions", () => {
    const bank = bankFor("en");
    const positions = bank.map((q) => q.correctIndex);
    for (const pos of [0, 1, 2]) {
      expect(positions.filter((p) => p === pos).length).toBeGreaterThanOrEqual(3);
    }
  });
});
