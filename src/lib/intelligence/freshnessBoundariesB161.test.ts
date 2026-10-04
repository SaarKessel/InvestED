import { describe, expect, it } from "vitest";
import { auditResult, FRESH_LIMIT_DAYS, TOOL_FRESH_LIMIT_DAYS } from "./claims";
import type { DataState, ToolResult } from "./envelope";
const now = Date.parse("2026-10-03T12:00:00Z");
const states: DataState[] = ["live", "cached", "fallback", "static", "calculated", "synthetic"];
const rows = states.flatMap((state) => ["market", "filings", "etf", "macro"].flatMap((tool) => [-1, 0, 1].map((delta) => [state, tool, delta] as const)));
describe("[sweep] B161 provenance freshness limits honor source publication cadence", () => {
  it.each(rows)("state %s tool %s boundary delta %s", (state, toolId, delta) => {
    const limit = FRESH_LIMIT_DAYS[state] === null ? null : TOOL_FRESH_LIMIT_DAYS[toolId] ?? FRESH_LIMIT_DAYS[state];
    const age = (limit ?? 1000) * 86400000 + delta;
    const result: ToolResult = { toolId, value: null, trust: state === "synthetic" ? "SIMULATION" : "DATA", provenance: { state, source: { en: "Source", he: "מקור" }, asOf: new Date(now - age).toISOString() } };
    const stale = limit !== null && delta > 0;
    expect(auditResult(result, now)).toEqual({ stale, issues: stale ? [`data older than ${limit} days`] : [] });
  });
});
describe("[hand] B161 provenance labels reject missing dates and mixed simulation trust", () => {
  it("keeps real-data date gaps and simulation mismatches visible", () => {
    const result: ToolResult = { toolId: "market", value: null, trust: "DATA", provenance: { state: "live", source: { en: "Source", he: "מקור" } } };
    expect(auditResult(result, now)).toEqual({ stale: false, issues: ["real-data state without a date"] });
    expect(auditResult({ ...result, provenance: { ...result.provenance, state: "synthetic" } }, now).issues).toContain("invented scenario not marked as simulation");
    expect(auditResult({ ...result, trust: "SIMULATION" }, now).issues).toContain("simulation not marked as invented");
  });
});
