import { describe, expect, it } from "vitest";
import { describeRun, MAX_RETRIES, runSteps, type PlanStep } from "./plan";

const ok = (id: string, v: unknown = id, dependsOn?: string[]): PlanStep => ({ id, label: id, dependsOn, run: async () => v });
describe("plan runner", () => {
  it("runs steps in order and passes earlier values forward", async () => {
    const seen: unknown[] = [];
    const r = await runSteps([ok("a", 1), { id: "b", label: "b", dependsOn: ["a"], run: async (p) => { seen.push(p.a); return 2; } }]);
    expect(r.complete).toBe(true); expect(seen).toEqual([1]); expect(r.values).toEqual({ a: 1, b: 2 });
  });
  it("blocks a step whose dependency failed and returns a partial result", async () => {
    const r = await runSteps([ok("a"), { id: "b", label: "b", run: async () => { throw new Error("boom"); } }, ok("c", "c", ["b"]), ok("d", "d", ["a"])]);
    expect(r.steps.map((s) => s.state)).toEqual(["done", "failed", "blocked", "done"]);
    expect(r.partial).toBe(true); expect(r.complete).toBe(false); expect(r.values).toEqual({ a: "a", d: "d" });
  });
  it("retries a flaky step a bounded number of times", async () => {
    let n = 0;
    const flaky: PlanStep = { id: "f", label: "f", retries: 1, run: async () => { if (++n < 2) throw new Error("once"); return "ok"; } };
    const r = await runSteps([flaky]);
    expect(r.steps[0]).toMatchObject({ state: "done", attempts: 2 });
    let m = 0;
    const never: PlanStep = { id: "x", label: "x", retries: 99, run: async () => { m++; throw new Error("no"); } };
    const r2 = await runSteps([never]);
    expect(m).toBe(1 + MAX_RETRIES); expect(r2.steps[0].state).toBe("failed");
  });
  it("marks a slow step as timeout and still runs independent steps", async () => {
    const slow: PlanStep = { id: "s", label: "s", run: () => new Promise((res) => setTimeout(res, 200)) };
    const r = await runSteps([slow, ok("z")], { timeoutMs: 20 });
    expect(r.steps.map((s) => s.state)).toEqual(["timeout", "done"]);
  });
  it("reports state changes as they happen", async () => {
    const states: string[] = [];
    await runSteps([ok("a")], { onState: (rec) => states.push(rec.state) });
    expect(states).toEqual(["running", "done"]);
  });
  it("describes a clean run and a partial run in both languages", async () => {
    const clean = describeRun((await runSteps([ok("a")])).steps);
    expect(clean.en).toBe("Plan state: 1 of 1 steps done."); expect(clean.he).toContain("1 מתוך 1");
    const part = describeRun((await runSteps([{ id: "reword", label: "reword", run: async () => { throw new Error("x"); } }])).steps);
    expect(part.en).toContain("rewording: failed"); expect(part.he).toContain("ניסוח מחדש: נכשל"); expect(part.he).not.toMatch(/[A-Za-z]{4,}/);
  });
});
