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
