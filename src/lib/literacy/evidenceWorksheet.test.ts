import { describe, expect, it } from "vitest";
import { buildWorksheet, classifyKind, EXAMPLES, findLoudSignals, sourceFor, splitStatements } from "./evidenceWorksheet";

describe("evidence worksheet", () => {
  it("splits a headline into statements", () => {
    expect(splitStatements("Acme stock plunges 40% as CEO says losses are temporary")).toHaveLength(2);
    expect(splitStatements("Central bank holds rate at 4.5%, says inflation is easing")).toHaveLength(2);
  });
  it("labels facts, opinions and attributed claims", () => {
    expect(classifyKind("Acme reported revenue of 5 billion")).toBe("fact");
    expect(classifyKind("Globex shares could double")).toBe("opinion");
    expect(classifyKind("CEO says losses are temporary")).toBe("attributed");
    expect(classifyKind("A quiet morning")).toBe("unclear");
    expect(classifyKind("אנליסטים אומרים שהמניה עשויה לעלות")).toBe("opinion");
  });
  it("suggests a primary source by topic and falls back to the original statement", () => {
    expect(sourceFor("Quarterly revenue rose").id).toBe("earnings");
    expect(sourceFor("Fed holds rate").id).toBe("macro");
    expect(sourceFor("Company sues rival").id).toBe("legal");
    expect(sourceFor("Hello there").id).toBe("original");
  });
  it("flags loud wording without calling it false", () => {
    expect(findLoudSignals("SHOCK: stock plunges!")).toEqual(expect.arrayContaining(["shock", "plunges", "!"]));
    expect(findLoudSignals("Central bank holds rate")).toEqual([]);
    expect(findLoudSignals("הלם בשוק")).toContain("הלם");
  });
  it("marks numbers as needing a comparison base", () => {
    const w = buildWorksheet("Acme profit rose 12%")!;
    expect(w.statements[0].hasNumber).toBe(true);
    expect(w.statements[0].unverified.some((u) => /compares/.test(u.en))).toBe(true);
  });
  it("never produces a verdict, score or label like true/fake", () => {
    for (const e of EXAMPLES) for (const lang of ["en", "he"] as const) {
      const w = buildWorksheet(e.headline[lang])!;
      expect(w.headlineOnly).toBe(true);
      expect(Object.keys(w).sort()).toEqual(["headline", "headlineOnly", "loudSignals", "statements"]);
      expect(JSON.stringify(w)).not.toMatch(/"(score|verdict|fake|isFake|confidence)"/i);
      expect(w.statements.length).toBeGreaterThan(0);
    }
  });
  it("handles empty and oversized input", () => {
    expect(buildWorksheet("  ")).toBeNull();
    expect(buildWorksheet("x".repeat(1000))!.headline.length).toBe(300);
  });
});
