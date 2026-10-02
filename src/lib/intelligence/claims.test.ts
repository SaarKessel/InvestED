import { describe, expect, it } from "vitest";
import { auditResult, dataCheckLine, checkClaims, outcomeOf, OUTCOME_LINE, unknownLinks } from "./claims";
import type { ToolResult } from "./envelope";

const res = (state: "live" | "cached" | "static" | "synthetic" | "calculated", asOf?: string, trust: ToolResult["trust"] = "DATA"): ToolResult => ({ toolId: "t", value: 1, trust, provenance: { source: { en: "S", he: "מ" }, state, asOf } });
describe("claim checks", () => {
  const src = ["Volatility is 24.7% a year. Beta against SPY is 0.68."];
  it("passes a sentence whose numbers sit together in a source sentence", () => {
    expect(checkClaims("Volatility is 24.7% a year.", src)[0].label).toBe("sourced");
  });
  it("flags real numbers paired wrongly, which a presence check would pass", () => {
    expect(checkClaims("Beta is 24.7 and volatility is 0.68.", src)[0].label).toBe("mispaired");
  });
  it("flags a number no source has, and ignores sentences without numbers", () => {
    const c = checkClaims("It is 99%. Good luck.", src);
    expect(c.map((x) => x.label)).toEqual(["unsupported", "no_numbers"]);
  });
  it("finds links that are not in any source", () => {
    expect(unknownLinks("See https://a.com/x and https://evil.test/y.", ["from https://a.com/x"])).toEqual(["https://evil.test/y"]);
  });
});
describe("result audit", () => {
  const now = Date.parse("2026-10-02T12:00:00Z");
  it("accepts fresh real data and flags stale or undated data", () => {
    expect(auditResult(res("live", "2026-10-01"), now).issues).toEqual([]);
    expect(auditResult(res("cached", "2026-09-01"), now)).toMatchObject({ stale: true });
    expect(auditResult(res("live"), now).issues).toContain("real-data state without a date");
  });
  it("keeps invented and real data apart", () => {
    expect(auditResult(res("synthetic", undefined, "SIMULATION"), now).issues).toEqual([]);
    expect(auditResult(res("synthetic", undefined, "DATA"), now).issues.length).toBe(1);
    expect(auditResult(res("static", undefined, "SIMULATION"), now).issues.length).toBe(1);
  });
});
describe("outcome", () => {
  const ok = [{ sentence: "a 1", label: "sourced" as const }];
  const base = { claims: ok, conflicts: 0, badLinks: 0, audits: [], missing: 0 };
  it("ranks outcomes", () => {
    expect(outcomeOf(base)).toBe("verified");
    expect(outcomeOf({ ...base, missing: 1 })).toBe("verified_with_limits");
    expect(outcomeOf({ ...base, claims: [...ok, { sentence: "b 2", label: "mispaired" }] })).toBe("partial");
    expect(outcomeOf({ ...base, conflicts: 1 })).toBe("contradicted");
    expect(outcomeOf({ ...base, claims: [{ sentence: "z 9", label: "unsupported" }] })).toBe("unverifiable");
    for (const k of Object.keys(OUTCOME_LINE)) expect(OUTCOME_LINE[k as keyof typeof OUTCOME_LINE].he).not.toMatch(/[A-Za-z]{4,}/);
  });
});
describe("data check line", () => {
  const now = Date.parse("2026-10-02T12:00:00Z");
  it("says passed or what was found, in both languages, with no English in Hebrew", () => {
    expect(dataCheckLine(res("live", "2026-10-01"), now).en).toContain("passed");
    const bad = dataCheckLine(res("cached", "2026-09-01"), now);
    expect(bad.en).toContain("older than the freshness limit"); expect(bad.he).toContain("ישנים");
    expect(dataCheckLine(res("live"), now).he).toContain("אין תאריך");
    expect(bad.he.replace(/\d|-/g, "")).not.toMatch(/[A-Za-z]{3,}/);
  });
});
