import { describe, expect, it } from "vitest";
import { findConflicts, critique } from "./critique";
const rows = ["price", "תשואה", "constructor", "__proto__"].flatMap((label) => ["same", "different", "reordered", "deduplicated", "no-numbers"].map((mode) => [label, mode] as const));
describe("[sweep] B165 source conflicts compare normalized numeric sets per label", () => {
  it.each(rows)("label %s numeric set mode %s", (label, mode) => {
    const second = mode === "different" ? "Values 1250 and 9" : mode === "reordered" ? "Values 7 and 1250" : mode === "deduplicated" ? "Values 1250 7 7" : mode === "no-numbers" ? "No figures supplied" : "Values 1,250.00 and 7";
    const sources = [{ label, text: "Values 1250 and 7" }, { label, text: second }];
    const snapshot = JSON.stringify(sources);
    expect(findConflicts(sources)).toEqual(mode === "different" ? [{ label, a: ["1250", "7"], b: ["1250", "9"] }] : []);
    expect(JSON.stringify(sources)).toBe(snapshot);
    expect(findConflicts([{ ...sources[0], label: "first" }, { ...sources[1], label: "second" }])).toEqual([]);
  });
});
describe("[hand] B165 critique failure list mirrors failed checks without hiding evidence", () => {
  it("reports missing topics conflicts and unsupported numbers independently", () => {
    const result = critique("Value 99.", { lang: "en", missingTopics: ["topic"], sources: [{ label: "same", text: "Value 1." }, { label: "same", text: "Value 2." }] });
    expect(result.ok).toBe(false);
    expect(result.failed).toEqual(result.checks.filter((c) => !c.ok));
    expect(result.failed.map((c) => c.id)).toEqual(["numbers", "missing", "conflict"]);
    expect(result.failed.every((c) => c.note.en.length > 0 && /[א-ת]/.test(c.note.he))).toBe(true);
  });
});
