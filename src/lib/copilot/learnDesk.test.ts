import { describe, expect, it } from "vitest";
import { buildLearningPath, looksLikeLearningPathRequest } from "./learnDesk";

describe("learnDesk", () => {
  it("routes path questions in both languages", () => {
    expect(looksLikeLearningPathRequest("Where do I start learning to invest?")).toBe(true);
    expect(looksLikeLearningPathRequest("תן לי מפת דרכים ללמידה")).toBe(true);
    expect(looksLikeLearningPathRequest("what is VOO price")).toBe(false);
    expect(looksLikeLearningPathRequest("what is an ETF")).toBe(false);
  });
  it("returns the four site stages with topics in each language", () => {
    for (const lang of ["he", "en"] as const) {
      const p = buildLearningPath(lang);
      expect(p).toHaveLength(4);
      expect(p.every((s) => s.title && s.topics.length > 0)).toBe(true);
    }
  });
});
