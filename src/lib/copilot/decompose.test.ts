import { describe, expect, it } from "vitest";
import { decompose, describePlan, splitParts, MAX_TASKS } from "./decompose";

describe("decompose", () => {
  it("keeps a simple question as one task", () => {
    const d = decompose("What is inflation?");
    expect(d.multi).toBe(false);
    expect(d.tasks).toHaveLength(1);
  });
  it("splits sentences and connectors in order", () => {
    expect(splitParts("What is inflation? Then explain bonds; and what is an ETF.")).toEqual(["What is inflation?", "explain bonds", "what is an ETF."]);
  });
  it("plans each part with the existing planner", () => {
    const d = decompose("Convert 100 USD to EUR. What is inflation?");
    expect(d.multi).toBe(true);
    expect(d.tasks[0].route).toBe("fx");
    expect(d.tasks.map((t) => t.index)).toEqual([0, 1]);
  });
  it("caps the number of tasks and reports the rest", () => {
    const d = decompose(Array.from({ length: 8 }, (_, i) => `Explain topic number ${i}.`).join(" "));
    expect(d.tasks).toHaveLength(MAX_TASKS);
    expect(d.dropped).toBe(3);
  });
  it("describes the plan in both languages", () => {
    const d = decompose("What is inflation? What is a bond?");
    expect(describePlan(d, "en")).toMatch(/2 tasks/);
    expect(describePlan(d, "he")).toMatch(/2 משימות/);
  });
});
