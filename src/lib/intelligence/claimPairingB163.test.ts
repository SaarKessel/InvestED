import { describe, expect, it } from "vitest";
import { checkClaims } from "./claims";
const rows = [10, 25, 100, 1250].flatMap((a) => [3, 7, 12].flatMap((b) => ["together", "separate", "absent"].map((mode) => [a, b, mode] as const)));
describe("[sweep] B163 numeric claim pairing requires a shared source sentence", () => {
  it.each(rows)("first %s second %s mode %s", (a, b, mode) => {
    const sentence = `Value ${a} and change ${b}.`;
    const sources = mode === "together" ? [`Both ${a} and ${b} appear here.`] : mode === "separate" ? [`First ${a}. Second ${b}.`] : [`First ${a}.`];
    expect(checkClaims(sentence, sources)).toEqual([{ sentence, label: mode === "together" ? "sourced" : mode === "separate" ? "mispaired" : "unsupported" }]);
  });
});
describe("[hand] B163 numeric claims retain sentence-local labels and normalized values", () => {
  it("separates prose from sourced unsupported and mispaired sentences", () => {
    expect(checkClaims("Intro words. Value 1,250.00. Unknown 77. Pair 1250 and 3.", ["Value 1250. Other 3."])).toEqual([
      { sentence: "Intro words.", label: "no_numbers" },
      { sentence: "Value 1,250.00.", label: "sourced" },
      { sentence: "Unknown 77.", label: "unsupported" },
      { sentence: "Pair 1250 and 3.", label: "mispaired" },
    ]);
    expect(checkClaims("  \n  ", [])).toEqual([]);
  });
});
