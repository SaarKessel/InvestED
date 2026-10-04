import { describe, expect, it } from "vitest";
import { buildDashboard } from "./dashboard";
import { summarize, type TraceEntry } from "./traceStore";
import { DOMAINS } from "./domains";
import { graphStats } from "../knowledge/graph";
const rows = [0, 1, 5, 10, 50, 200].flatMap((count) => [1, 3, 9].map((routes) => [count, routes] as const));
describe("[sweep] B167 intelligence dashboard conserves trace and registry source facts", () => {
  it.each(rows)("trace count %s distinct routes %s", (count, routes) => {
    const traces: TraceEntry[] = Array.from({ length: count }, (_, i) => ({ at: i, route: i % routes === 0 ? "__proto__" : `route${i % routes}`, tools: [], ms: i, ok: i % 3 !== 0, failedChecks: i % 3 ? [] : ["numbers"], q: "hash", live: "none" }));
    const snapshot = JSON.stringify(traces);
    const dashboard = buildDashboard(traces);
    const expected = new Map<string, number>();
    traces.forEach((trace) => expected.set(trace.route, (expected.get(trace.route) ?? 0) + 1));
    expect(dashboard.topRoutes).toEqual([...expected].map(([route, count]) => ({ route, count })).sort((a, b) => b.count - a.count || a.route.localeCompare(b.route)).slice(0, 6));
    expect(dashboard.health).toEqual(summarize(traces));
    expect(dashboard.wiredDomains).toBe(Object.values(DOMAINS).filter((d) => d.status === "wired").length);
    const graph = graphStats();
    expect(dashboard.knowledge).toEqual({ concepts: graph.nodes, withText: graph.withText, withoutText: graph.nodes - graph.withText, categories: Object.keys(graph.byCategory).length, isolated: graph.isolated.length, brokenLinks: graph.brokenLinks.length });
    expect(JSON.stringify(traces)).toBe(snapshot);
  });
});
describe("[hand] B167 empty dashboard reports no invented success rate", () => {
  it("has empty route history and explicit null success fraction", () => {
    const result = buildDashboard([]);
    expect(result.health.okRate).toBeNull();
    expect(result.topRoutes).toEqual([]);
    expect(result.knowledge.withText + result.knowledge.withoutText).toBe(result.knowledge.concepts);
  });
});
