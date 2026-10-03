import { describe, expect, it } from "vitest";
import { describeStep, TRUST_LABEL, type ProvenanceStep } from "./provenance";
import type { TrustClass } from "./verificationEngine";

const labels: Array<[TrustClass, string, string]> = [["DATA", "Market data", "נתוני שוק"], ["KNOWLEDGE", "Stored knowledge", "ידע שמור"], ["CALCULATION", "Calculation", "חישוב"], ["ANALYSIS", "Analysis", "ניתוח"], ["SIMULATION", "Simulation (illustrative)", "סימולציה (להמחשה)"], ["EDUCATIONAL", "Education", "לימוד"]];
const rows = labels.flatMap(([trust, en, he]) => (["en", "he"] as const).flatMap((lang) => [false, true].flatMap((source) => [false, true].map((date) => [trust, lang, lang === "en" ? en : he, source, date] as const))));

describe("[sweep] B128 provenance labels preserve trust and optional source/date", () => {
  it.each(rows)("trust %s language %s label %s source %s date %s", (trust, lang, label, source, date) => {
    const step: ProvenanceStep = { tool: "Tool 123", trust, source: source ? "Provider original" : undefined, asOf: date ? "2026-10-03" : undefined };
    const before = JSON.stringify(step);
    expect(describeStep(step, lang)).toBe(`${label}: Tool 123${source ? " · Provider original" : ""}${date ? " · 2026-10-03" : ""}`);
    expect(JSON.stringify(step)).toBe(before);
    expect(TRUST_LABEL[trust][lang]).toBe(label);
  });
});
describe("[hand] B128 simulation is never presented as market data", () => {
  it("simulation labels explicitly mark illustrative/invented status in both languages", () => {
    expect(describeStep({ tool: "scenario", trust: "SIMULATION" }, "en")).toContain("illustrative");
    expect(describeStep({ tool: "scenario", trust: "SIMULATION" }, "he")).toContain("להמחשה");
    expect(TRUST_LABEL.SIMULATION).not.toEqual(TRUST_LABEL.DATA);
  });
});
