import { describe, expect, it } from "vitest";
import { outcomeOf, type ClaimCheck, type ClaimLabel } from "./claims";
const labels: ClaimLabel[] = ["sourced", "mispaired", "unsupported", "no_numbers"];
const rows = labels.flatMap((label) => [0, 1].flatMap((conflicts) => [0, 1].flatMap((badLinks) => [0, 1].flatMap((missing) => [false, true].map((issue) => [label, conflicts, badLinks, missing, issue] as const)))));
describe("[sweep] B162 verification outcome priority preserves contradiction and numeric evidence", () => {
  it.each(rows)("claim %s conflicts %s links %s missing %s audit issue %s", (label, conflicts, badLinks, missing, issue) => {
    const claims: ClaimCheck[] = [{ sentence: "example", label }];
    const expected = conflicts ? "contradicted" : label === "unsupported" ? "unverifiable" : label === "mispaired" || badLinks ? "partial" : missing || issue ? "verified_with_limits" : "verified";
    expect(outcomeOf({ claims, conflicts, badLinks, missing, audits: [{ stale: issue, issues: issue ? ["stale"] : [] }] })).toBe(expected);
  });
});
describe("[hand] B162 mixed numeric claims cannot overstate full verification", () => {
  it("mixed sourced and unsupported claims are partial while prose-only empty output is verified", () => {
    const base = { conflicts: 0, badLinks: 0, missing: 0, audits: [] };
    expect(outcomeOf({ ...base, claims: [{ sentence: "one", label: "sourced" }, { sentence: "two", label: "unsupported" }] })).toBe("partial");
    expect(outcomeOf({ ...base, claims: [] })).toBe("verified");
    expect(outcomeOf({ ...base, claims: [{ sentence: "words", label: "no_numbers" }] })).toBe("verified");
  });
});
