import { describe, expect, it } from "vitest";
import { decompose } from "./decompose";
import { runPlan, shouldOrchestrate } from "./orchestrate";

describe("shouldOrchestrate", () => {
  it("runs a mix of an engine part and a concept part as a plan", () => {
    expect(shouldOrchestrate("Convert 100 USD to EUR. What is inflation?")).toBe(true);
  });
  it("leaves single questions and concept-only questions alone", () => {
    expect(shouldOrchestrate("What is inflation?")).toBe(false);
    expect(shouldOrchestrate("What is inflation? What is a bond?")).toBe(false);
  });
  it("does not split when a part must see the whole text", () => {
    expect(shouldOrchestrate("Open the loans page. Convert 100 USD to EUR.")).toBe(false);
    expect(shouldOrchestrate("a. b.", decompose("Convert 100 USD to EUR. What is inflation?"), "scenario")).toBe(false);
  });
});
describe("runPlan", () => {
  const tasks = decompose("Explain inflation now. Explain bonds now. Explain ETFs now.").tasks;
  it("runs tasks in order", async () => {
    const seen: number[] = [];
    const r = await runPlan(tasks, async (t) => { seen.push(t.index); });
    expect(seen).toEqual([0, 1, 2]);
    expect(r.every((o) => o.status === "done")).toBe(true);
  });
  it("keeps going after a failure and records it", async () => {
    const r = await runPlan(tasks, async (t) => { if (t.index === 1) throw new Error("boom"); });
    expect(r.map((o) => o.status)).toEqual(["done", "failed", "done"]);
    expect(r[1].error).toBe("boom");
  });
  it("times out a slow task and moves on", async () => {
    const r = await runPlan(tasks, (t) => (t.index === 0 ? new Promise<void>(() => {}) : Promise.resolve()), { timeoutMs: 20 });
    expect(r.map((o) => o.status)).toEqual(["timeout", "done", "done"]);
  });
  it("skips the rest when aborted", async () => {
    const sig = { aborted: false };
    const r = await runPlan(tasks, async () => { sig.aborted = true; }, { signal: sig });
    expect(r.map((o) => o.status)).toEqual(["done", "skipped", "skipped"]);
  });
});
describe("runPlan concurrency", () => {
  const tasks = decompose("Explain inflation now. Explain bonds now. Explain ETFs now.").tasks;
  it("runs independent tasks in parallel and keeps outcome order by task index", async () => {
    const started: number[] = [];
    const r = await runPlan(tasks, async (t) => { started.push(t.index); await new Promise((res) => setTimeout(res, t.index === 0 ? 60 : 10)); }, { concurrency: 3 });
    // Task 0 is the slowest; with concurrency the fast tasks finish first but outcomes stay indexed.
    expect(r.map((o) => o.task.index)).toEqual([0, 1, 2]);
    expect(r.every((o) => o.status === "done")).toBe(true);
    expect(started).toEqual([0, 1, 2]);
    expect(r[0].ms).toBeGreaterThanOrEqual(50);
  });
  it("is faster than the sequential run for the same work", async () => {
    const work = () => new Promise((res) => setTimeout(res, 40));
    const seq = await runPlan(tasks, work);
    const par = await runPlan(tasks, work, { concurrency: 3 });
    const seqMs = seq.reduce((a, o) => a + o.ms, 0);
    const parMs = Math.max(...par.map((o) => o.ms));
    expect(parMs).toBeLessThan(seqMs);
  });
  it("reports each settled outcome through onSettled as it lands", async () => {
    const landed: number[] = [];
    await runPlan(tasks, async (t) => { await new Promise((res) => setTimeout(res, t.index === 0 ? 50 : 5)); }, { concurrency: 3, onSettled: (o) => { landed.push(o.task.index); } });
    expect([...landed].sort()).toEqual([0, 1, 2]);
    expect(landed[landed.length - 1]).toBe(0); // slow task 0 settles last
  });
  it("still times out and skips on abort with concurrency on", async () => {
    const r = await runPlan(tasks, () => new Promise(() => {}), { concurrency: 2, timeoutMs: 20 });
    expect(r.every((o) => o.status === "timeout")).toBe(true);
    const aborted = await runPlan(tasks, async () => {}, { concurrency: 2, signal: { aborted: true } });
    expect(aborted.every((o) => o.status === "skipped")).toBe(true);
  });
});
