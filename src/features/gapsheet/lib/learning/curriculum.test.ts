import { describe, it, expect } from "vitest";
import { STAGES, ORDER, PREREQS, isReady, nextSkill, stageProgress, stageState, stageName } from "./curriculum";
import { SKILL_IDS } from "./skills";

describe("curriculum structure", () => {
  it("every learnable skill appears exactly once in the path", () => {
    expect(new Set(ORDER).size).toBe(ORDER.length);
    expect([...ORDER].sort()).toEqual([...SKILL_IDS].sort());
  });
  it("every prerequisite is a real skill and acyclic in path order", () => {
    for (const [skill, reqs] of Object.entries(PREREQS)) {
      for (const r of reqs) {
        expect(SKILL_IDS).toContain(r);
        expect(ORDER.indexOf(r as never)).toBeLessThan(ORDER.indexOf(skill as never));
      }
    }
  });
});
describe("isReady / nextSkill", () => {
  it("a skill with unpracticed prerequisites is not ready", () => {
    expect(isReady("sum", {})).toBe(true);
    expect(isReady("average", {})).toBe(false);
    expect(isReady("average", { sum: 30 })).toBe(true);
  });
  it("nextSkill walks the path in order", () => {
    expect(nextSkill({})).toBe("sum");
    expect(nextSkill({ sum: 60 })).toBe("average");
    expect(nextSkill(Object.fromEntries(ORDER.map((k) => [k, 100])))).toBeNull();
  });
});
describe("stage progress and state", () => {
  const basic = STAGES.find((s) => s.id === "basic")!;
  it("counts proficient-or-better skills", () => {
    const { done, total } = stageProgress(basic, { sum: 60, average: 100 });
    expect(total).toBe(5);
    expect(done).toBe(2);
  });
  it("stage state: complete / unlocked / later", () => {
    expect(stageState(basic, Object.fromEntries(basic.skills.map((k) => [k, 60])))).toBe("complete");
    expect(stageState(basic, {})).toBe("unlocked"); // sum has no prereqs
    const lookup = STAGES.find((s) => s.id === "lookup")!;
    expect(stageState(lookup, {})).toBe("later");
  });
  it("stageName picks the language", () => {
    expect(stageName(basic, "he")).toBe("נוסחאות בסיס");
    expect(stageName(basic, "en")).toBe("Basic formulas");
  });
});
