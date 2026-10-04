import { describe, expect, it } from "vitest";
import { describeStep, TRUST_LABEL } from "./provenance";
import { STATE_LABEL } from "./envelope";
import type { TrustClass } from "./verificationEngine";
const trusts = Object.keys(TRUST_LABEL) as TrustClass[];
const rows = trusts.flatMap((trust) => ["en", "he"].flatMap((lang) => [undefined, "Named source"].flatMap((source) => [undefined, "2026-10-03"].map((asOf) => [trust, lang as "en" | "he", source, asOf] as const))));
describe("[sweep] B164 trace provenance descriptions use only supplied source and time", () => {
  it.each(rows)("trust %s language %s source %s date %s", (trust, lang, source, asOf) => {
    const step = { tool: "tool-id", trust, source, asOf, note: "not part of description" };
    expect(describeStep(step, lang)).toBe(`${TRUST_LABEL[trust][lang]}: tool-id${source ? ` · ${source}` : ""}${asOf ? ` · ${asOf}` : ""}`);
    expect(describeStep(step, lang)).not.toContain("not part of description");
  });
});
describe("[hand] B164 trust and state labels stay bilingual and distinguish invented data", () => {
  it("every declared label has real text and simulation remains marked", () => {
    for (const label of [...Object.values(TRUST_LABEL), ...Object.values(STATE_LABEL)]) {
      expect(label.en.trim().length).toBeGreaterThan(0);
      expect(label.he).toMatch(/[א-ת]/);
    }
    expect(TRUST_LABEL.SIMULATION.en).toContain("illustrative");
    expect(STATE_LABEL.synthetic.en).toContain("Invented");
  });
});
