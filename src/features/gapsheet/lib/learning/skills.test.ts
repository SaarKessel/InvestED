import { describe, it, expect } from "vitest";
import { SKILLS, SKILL_IDS } from "./skills";

describe("skill registry", () => {
  it("ids are unique and SKILL_IDS matches", () => {
    expect(new Set(SKILL_IDS).size).toBe(SKILLS.length);
    expect(SKILL_IDS).toEqual(SKILLS.map((s) => s.id));
  });
  it("every skill has Hebrew and English descriptions and a category", () => {
    for (const s of SKILLS) {
      expect(s.description).toMatch(/[\u0590-\u05ff]/);
      expect(s.descriptionEn.trim()).not.toBe("");
      expect(s.category.trim()).not.toBe("");
      expect(s.name.trim()).not.toBe("");
    }
  });
});
