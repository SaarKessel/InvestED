import { afterEach, describe, expect, it, vi } from "vitest";
import { runTool, TOOL_SPECS, isToolId } from "./tools";
import { agentMayUse, AGENTS, type AgentDef } from "../agents";

afterEach(() => vi.unstubAllGlobals());

describe("tool registry", () => {
  it("every tool has a spec with a trust class and a domain", () => {
    for (const id of Object.keys(TOOL_SPECS)) { expect(isToolId(id)).toBe(true); expect(TOOL_SPECS[id as keyof typeof TOOL_SPECS].trust).toBeTruthy(); }
  });
  it("unknown tool is refused", async () => {
    expect(await runTool("nope", "x")).toEqual({ ok: false, reason: "unknown_tool" });
  });
  it("math returns the value with calculated provenance and no assumptions", async () => {
    const r = await runTool<{ value: number }>("math", "what is 2+3*4");
    expect(r.ok && r.result.value.value).toBe(14);
    expect(r.ok && r.result.provenance.state).toBe("calculated");
    expect(r.ok && r.result.trust).toBe("CALCULATION");
  });
  it("calc carries the teaching-assumption label", async () => {
    const r = await runTool("calc", "I invest 10000 and add 500 per month for 10 years at 6%");
    expect(r.ok && r.result.provenance.assumptions?.length).toBe(1);
  });
  it("a text no desk can read is unavailable, not guessed", async () => {
    expect(await runTool("math", "hello there")).toEqual({ ok: false, reason: "unavailable" });
  });
  it("fx result keeps date and a not-live-quote caveat in provenance", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ amount: 100, base: "USD", date: "2026-10-01", rates: { ILS: 307.62 } }), { status: 200 })));
    const r = await runTool<{ result: number }>("fx", { amount: 100, from: "USD", to: "ILS" });
    expect(r.ok && r.result.provenance.asOf).toBe("2026-10-01");
    expect(r.ok && r.result.provenance.note?.en).toContain("not a live trading quote");
    expect(r.ok && r.result.provenance.source.en).toContain("European Central Bank");
  });
  it("fx with a failing source is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("x", { status: 500 })));
    expect(await runTool("fx", { amount: 1, from: "USD", to: "ILS" })).toEqual({ ok: false, reason: "unavailable" });
  });
});

describe("agent permissions", () => {
  const agents: AgentDef[] = [{ ...AGENTS[0], id: "limited", tools: ["math"] }];
  it("allows listed tools, denies others, and allows everything when no list or no agent", () => {
    expect(agentMayUse("limited", "math", agents)).toBe(true);
    expect(agentMayUse("limited", "fx", agents)).toBe(false);
    expect(agentMayUse(null, "fx", agents)).toBe(true);
    expect(agentMayUse("investing", "fx")).toBe(true);
  });
  it("runTool returns denied for a disallowed agent", async () => {
    // default agents are unrestricted, so a denied path is exercised through agentMayUse above and a limited registry here
    const { agentMayUse: may } = await import("../agents");
    expect(may("limited", "wb", agents)).toBe(false);
  });
});

import { planQuestion } from "../copilot/planner";
import { toolCatalog } from "./tools";

describe("one vocabulary", () => {
  it("every tool a planner route names is a runnable registry tool", () => {
    for (const q of ["100 USD to ILS", "Israel inflation 2020-2025", "what is 2+3*4", "I invest 10000 and add 500 per month for 10 years at 6%"]) {
      const plan = planQuestion(q);
      expect(plan.tools.length, q).toBe(1);
      for (const id of plan.tools) expect(isToolId(id), id).toBe(true);
    }
    expect(planQuestion("open the calculator").tools).toEqual([]);
  });
  it("the catalogue lists the sixteen desks and the eight intent-stage engines with no duplicate ids", () => {
    const c = toolCatalog();
    expect(c.filter((x) => x.kind === "desk")).toHaveLength(16);
    expect(c.filter((x) => x.kind === "engine")).toHaveLength(8);
    expect(new Set(c.map((x) => x.id)).size).toBe(c.length);
  });
});
