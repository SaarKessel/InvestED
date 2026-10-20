import { describe, it, expect } from "vitest";
import { FINANCE_CONCEPTS } from "./educationContent";

describe("FINANCE_CONCEPTS", () => {
  it("every concept has Hebrew and English terms and definitions", () => {
    expect(FINANCE_CONCEPTS.length).toBeGreaterThan(0);
    for (const c of FINANCE_CONCEPTS) {
      expect(c.term.he).toMatch(/[\u0590-\u05ff]/);
      expect(c.term.en.trim()).not.toBe("");
      expect(c.definition.he).toMatch(/[\u0590-\u05ff]/);
      expect(c.definition.en.trim()).not.toBe("");
    }
  });
  it("terms are unique per language", () => {
    const en = FINANCE_CONCEPTS.map((c) => c.term.en.toLowerCase());
    expect(new Set(en).size).toBe(en.length);
  });
});
