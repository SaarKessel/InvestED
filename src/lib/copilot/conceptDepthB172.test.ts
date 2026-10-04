import { describe, expect, it } from "vitest";
import { conceptSections } from "./depth";
import { allConcepts } from "../knowledge/concepts/registry";
const rows = allConcepts().flatMap((c) => (["en", "he"] as const).map((lang) => [c.id, c[lang]] as const));
describe("[sweep] B172 concept depth keeps bilingual stored educational sections", () => {
  it.each(rows)("concept %s query %s", (_id, question) => {
    expect(conceptSections("basic", question)).toEqual([]);
    const junior = conceptSections("junior", question);
    const senior = conceptSections("senior", question);
    const professional = conceptSections("professional", question);
    expect(senior.slice(0, junior.length)).toEqual(junior);
    expect(professional.slice(0, senior.length)).toEqual(senior);
    expect(professional.at(-1)?.id).toBe("limits");
    expect(new Set(professional.map((s) => s.id)).size).toBe(professional.length);
    for (const section of professional) {
      expect(section.trust).toBe("EDUCATIONAL");
      expect(section.title.en.length).toBeGreaterThan(0);
      expect(section.title.he).toMatch(/[א-ת]/);
      expect(section.lines.length).toBeGreaterThan(0);
    }
    expect(professional.at(-1)!.lines[0].en).toContain("not advice");
    expect(professional.at(-1)!.lines[0].he).toContain("לא ייעוץ");
  });
});
describe("[hand] B172 unknown concept depth stays empty", () => {
  it("does not fabricate depth sections for an absent stored topic", () => {
    for (const level of ["basic", "junior", "senior", "professional"] as const) expect(conceptSections(level, "b172unknownconcept")).toEqual([]);
  });
});
