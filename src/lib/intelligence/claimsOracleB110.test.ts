import { describe, expect, it } from "vitest";
import { auditResult, checkClaims, outcomeOf, type ClaimLabel } from "./claims";
import type { DataState, ToolResult } from "./envelope";

const now = Date.UTC(2026, 9, 3, 12);
const daily = 4 * 86400000;
const toolLimits: Array<[string, number]> = [["fx", 4], ["filings", 140], ["etf", 160], ["macro", 400]];
const realStates: DataState[] = ["live", "cached", "fallback"];
const ages: Array<[string, DataState, number, number]> = toolLimits.flatMap(([tool, limit]) => realStates.flatMap((state) => [-1, 0, 1].map((offset): [string, DataState, number, number] => [tool, state, limit, offset])));
const result = (toolId: string, state: DataState, asOf?: string): ToolResult => ({ toolId, value: {}, trust: "DATA", provenance: { state, asOf, source: { en: "Source", he: "מקור" } } });

describe("[sweep] B110 freshness audit exact millisecond boundaries", () => {
  it.each(ages)("%s %s limit %s days offset %s ms", (tool, state, limit, offset) => {
    const r = result(tool, state, new Date(now - limit * 86400000 - offset).toISOString());
    const audit = auditResult(r, now);
    expect(audit.stale).toBe(offset > 0);
    expect(audit.issues).toEqual(offset > 0 ? [`data older than ${limit} days`] : []);
  });
});

const labels: ClaimLabel[] = ["sourced", "mispaired", "unsupported", "no_numbers"];
const combinations: Array<[ClaimLabel, ClaimLabel, number, number, number, boolean]> = [];
for (const a of labels) for (const b of labels) for (const conflicts of [0, 1]) for (const badLinks of [0, 1]) for (const missing of [0, 1]) for (const issue of [false, true]) combinations.push([a, b, conflicts, badLinks, missing, issue]);

describe("[sweep] B110 verification outcome priority table", () => {
  it.each(combinations)("labels %s/%s conflicts %s links %s missing %s audit %s", (a, b, conflicts, badLinks, missing, issue) => {
    const numeric = [a, b].filter((label) => label !== "no_numbers");
    const expected = conflicts ? "contradicted" : numeric.length > 0 && numeric.every((label) => label === "unsupported") ? "unverifiable" : numeric.some((label) => label !== "sourced") || badLinks ? "partial" : issue || missing ? "verified_with_limits" : "verified";
    const opts = { claims: [{ sentence: "first", label: a }, { sentence: "second", label: b }], conflicts, badLinks, missing, audits: [{ issues: issue ? ["gap"] : [], stale: false }] };
    expect(outcomeOf(opts)).toBe(expected);
    expect(outcomeOf({ ...opts, claims: [...opts.claims].reverse() })).toBe(expected);
  });
});

describe("[hand] B110 provenance and paired-number examples", () => {
  it("a tool without an override uses the four-day rule", () => {
    expect(auditResult(result("unknown-tool", "live", new Date(now - daily).toISOString()), now).stale).toBe(false);
    expect(auditResult(result("unknown-tool", "live", new Date(now - daily - 1).toISOString()), now).stale).toBe(true);
  });
  it("numbers in different source sentences cannot support a new numeric pairing", () => {
    expect(checkClaims("Revenue 50 and margin 20.", ["Revenue 50. Margin 20."])).toEqual([{ sentence: "Revenue 50 and margin 20.", label: "mispaired" }]);
    expect(checkClaims("Revenue 50 and margin 20.", ["Revenue 50 with margin 20."])[0].label).toBe("sourced");
  });
});
