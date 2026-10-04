import { describe, expect, it } from "vitest";
import { calcSections } from "./depth";
import { runCalcDesk } from "./calcDesk";
const rows = ["basic", "junior", "senior", "professional"].flatMap((level) => [0, 2, 7].flatMap((rate) => [1, 10].map((years) => [level as "basic" | "junior" | "senior" | "professional", rate, years] as const)));
describe("[sweep] B174 calculator depth retains deterministic teaching assumptions", () => {
  it.each(rows)("level %s return %s years %s", (level, rate, years) => {
    const calc = runCalcDesk(`how much would 1000 usd grow at ${rate}% over ${years} years`)!;
    expect(calc).not.toBeNull();
    const snapshot = JSON.stringify(calc);
    const sections = calcSections(level, calc);
    const ids = level === "basic" ? [] : level === "junior" ? ["meaning"] : level === "senior" ? ["meaning", "sensitivity"] : ["meaning", "sensitivity", "method"];
    expect(sections.map((s) => s.id)).toEqual(ids);
    expect(sections.every((s) => s.trust === "CALCULATION")).toBe(true);
    if (sections.length) expect(sections[0].lines[1].en).toContain("not a forecast");
    const sensitivity = sections.find((s) => s.id === "sensitivity");
    if (sensitivity) expect(sensitivity.lines.length).toBe(new Set([Math.max(0, rate - 2), rate, rate + 2]).size);
    const method = sections.find((s) => s.id === "method");
    if (method) {
      expect(method.lines[0].en).toContain("month end");
      expect(method.lines[0].en).toContain("2.5%");
      expect(method.lines[1].en).toContain("taxes, fees");
    }
    expect(JSON.stringify(calc)).toBe(snapshot);
  });
});
describe("[hand] B174 deeper calculator explanations remain bilingual", () => {
  it("all displayed titles and lines carry both languages", () => {
    const calc = runCalcDesk("how much would 1000 usd grow at 7% over 10 years")!;
    for (const section of calcSections("professional", calc)) {
      expect(section.title.he).toMatch(/[א-ת]/);
      for (const line of section.lines) { expect(line.en.length).toBeGreaterThan(0); expect(line.he).toMatch(/[א-ת]/); }
    }
  });
});
