import { describe, expect, it } from "vitest";
import { critique, findConflicts } from "./critique";

const src = [{ label: "Inflation", text: "Inflation is a rise in prices. Target 2 percent." }];
describe("critique", () => {
  it("passes a clean answer built from its sources", () => {
    const r = critique("Inflation is a rise in prices. Target 2 percent.", { sources: src, lang: "en" });
    expect(r.ok).toBe(true);
    expect(r.checks).toHaveLength(7);
  });
  it("fails on a number no source has", () => {
    const r = critique("Inflation will be 7 percent.", { sources: src, lang: "en" });
    expect(r.failed.map((c) => c.id)).toContain("numbers");
  });
  it("flags advice and guarantee language in both languages", () => {
    expect(critique("You should buy now.", { sources: src, lang: "en" }).failed.map((c) => c.id)).toContain("advice");
    expect(critique("זה רווח מובטח", { sources: src, lang: "he" }).failed.map((c) => c.id)).toContain("guarantee");
    expect(critique("This is a guaranteed return.", { sources: src, lang: "en" }).failed.map((c) => c.id)).toContain("guarantee");
  });
  it("flags wrong-language answers and empty text", () => {
    expect(critique("Prices rise over time in general.", { sources: [], lang: "he" }).failed.map((c) => c.id)).toContain("language");
    expect(critique("  ", { sources: [], lang: "en" }).failed.map((c) => c.id)).toContain("empty");
  });
  it("reports missing topics and conflicting sources", () => {
    const r = critique("x", { sources: [{ label: "A", text: "rate 3" }, { label: "A", text: "rate 4" }], lang: "en", missingTopics: ["Gamma"] });
    expect(r.failed.map((c) => c.id)).toEqual(expect.arrayContaining(["missing", "conflict"]));
    expect(findConflicts([{ label: "A", text: "1" }, { label: "A", text: "1" }])).toEqual([]);
  });
});
