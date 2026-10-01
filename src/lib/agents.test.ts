import { describe, expect, it } from "vitest";
import { AGENTS, classifyAgent, getAgent, readPickedAgent, routeAgent, savePickedAgent, type AgentDef } from "./agents";
describe("agents", () => {
  it("classifies by topic in both languages", () => {
    expect(classifyAgent("what is a deductible on my car insurance")).toBe("insurance");
    expect(classifyAgent("איך מחשבים החזר משכנתא")).toBe("credit");
    expect(classifyAgent("should I buy an ETF")).toBe("investing");
    expect(classifyAgent("how big is an emergency fund")).toBe("savings");
    expect(classifyAgent("hello")).toBeNull();
  });
  it("returns null on a tie", () => { expect(classifyAgent("insurance loan")).toBeNull(); });
  it("keeps the picked agent and suggests a switch only on a clear owner", () => {
    expect(routeAgent("what is a premium", "investing")).toEqual({ agentId: "investing", suggestSwitchTo: "insurance" });
    expect(routeAgent("hello", "investing")).toEqual({ agentId: "investing" });
    expect(routeAgent("what is a premium", null)).toEqual({ agentId: "insurance" });
  });
  it("adding an agent is one entry", () => {
    const tax: AgentDef = { id: "tax", name: { en: "Tax", he: "מס" }, color: "0 70% 50%", keywords: { en: ["tax"], he: ["מס"] }, starters: [] };
    expect(classifyAgent("capital gains tax", [...AGENTS, tax])).toBe("tax");
    expect(getAgent("tax", [tax])?.id).toBe("tax");
  });
  it("persists the pick per user", () => {
    const m = new Map<string, string>();
    const store = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
    savePickedAgent("u1", "insurance", store); expect(readPickedAgent("u1", store)).toBe("insurance"); expect(readPickedAgent("u2", store)).toBeNull();
    savePickedAgent("u1", null, store); expect(readPickedAgent("u1", store)).toBeNull();
  });
});
