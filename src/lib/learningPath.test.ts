import { describe, expect, it } from "vitest";
import { PATH_TOPICS, recommendPath, type PathInput } from "./learningPath";

const base: PathInput = { level: "advanced", goal: "confidence", minutesPerWeek: 120, knownTopics: [] };
const ids = (i: Partial<PathInput>) => recommendPath({ ...base, ...i }).steps.map((s) => s.topic);

describe("recommendPath", () => {
  it("puts basics first and follows prerequisite order otherwise", () => {
    expect(ids({ goal: "confidence", minutesPerWeek: 120 })[0]).toBe("basics");
  });
  it("skips topics the user already feels sure about", () => {
    expect(ids({ knownTopics: ["basics", "risk"] })).not.toContain("basics");
    expect(ids({ knownTopics: ["basics", "risk"] })).not.toContain("risk");
  });
  it("pulls goal topics forward but never ahead of basics", () => {
    const p = ids({ goal: "portfolio", level: "builder", minutesPerWeek: 120 });
    expect(p[0]).toBe("basics");
    expect(p.slice(1, 3).sort()).toEqual(["diversification", "fees"]);
  });
  it("hides topics above the user's level", () => {
    expect(ids({ level: "foundation" })).not.toContain("diversification");
    expect(ids({ level: "foundation" })).not.toContain("valuation");
    expect(ids({ level: "builder" })).not.toContain("valuation");
    expect(ids({ level: "advanced", goal: "analysis" })).toContain("valuation");
  });
  it("sizes the plan from minutes per week", () => {
    expect(ids({ minutesPerWeek: 30 })).toHaveLength(2);
    expect(ids({ minutesPerWeek: 60 })).toHaveLength(3);
    expect(ids({ minutesPerWeek: 120 })).toHaveLength(5);
  });
  it("re-opens basics and risk after a weak quiz score", () => {
    const known = PATH_TOPICS.map((t) => t.id);
    const r = recommendPath({ ...base, knownTopics: known, quiz: { score: 1, total: 5 } });
    expect(r.steps.map((s) => s.topic)).toEqual(["basics", "risk"]);
    expect(r.steps.every((s) => s.reason === "quiz")).toBe(true);
  });
  it("does not re-open topics on a good quiz score", () => {
    const known = PATH_TOPICS.map((t) => t.id);
    const r = recommendPath({ ...base, knownTopics: known, quiz: { score: 4, total: 5 } });
    expect(r.allKnown).toBe(true);
    expect(r.steps).toEqual([]);
  });
  it("labels goal-driven steps", () => {
    const r = recommendPath({ ...base, goal: "analysis", knownTopics: ["basics"], minutesPerWeek: 30 });
    expect(r.steps[0]).toMatchObject({ topic: "risk", reason: "goal" });
  });
  it("is deterministic and has he and en labels", () => {
    expect(recommendPath(base)).toEqual(recommendPath(base));
    for (const t of PATH_TOPICS) { expect(t.he).toMatch(/[א-ת]/); expect(t.en.length).toBeGreaterThan(2); }
  });
  it("reports how many weak topics exist beyond the plan", () => {
    const r = recommendPath({ ...base, minutesPerWeek: 30 });
    expect(r.weakCount).toBe(PATH_TOPICS.length);
    expect(r.steps).toHaveLength(2);
  });
});
