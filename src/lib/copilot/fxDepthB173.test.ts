import { describe, expect, it } from "vitest";
import { fxSections } from "./depth";
import type { FxResult } from "./fxDesk";
const rows = (["basic", "junior", "senior", "professional"] as const).flatMap((level) => [0.5, 1, 2, 3.75].flatMap((rate) => [1, 100, 1250].map((amount) => [level, rate, amount] as const)));
describe("[sweep] B173 FX depth separates reference data from teaching calculations", () => {
  it.each(rows)("level %s rate %s amount %s", (level, rate, amount) => {
    const input: FxResult = { from: "USD", to: "ILS", amount, rate, result: amount * rate, date: "2026-10-03" };
    const snapshot = JSON.stringify(input);
    const sections = fxSections(level, input);
    const ids = level === "basic" ? [] : level === "junior" ? ["fxmeaning"] : level === "senior" ? ["fxmeaning", "fxsens"] : ["fxmeaning", "fxsens", "fxlimits"];
    expect(sections.map((s) => s.id)).toEqual(ids);
    for (const section of sections) {
      expect(section.trust).toBe(section.id === "fxsens" ? "CALCULATION" : "DATA");
      expect(section.title.en.length).toBeGreaterThan(0);
      expect(section.title.he).toMatch(/[א-ת]/);
      expect(section.lines.length).toBeGreaterThan(0);
    }
    if (sections.length) {
      expect(sections[0].lines[0].en).toContain(input.date);
      expect(sections[0].lines[1].en).toContain("not the rate a bank");
    }
    const sensitivity = sections.find((s) => s.id === "fxsens");
    if (sensitivity) expect(sensitivity.lines[1].en).toContain("not a forecast");
    expect(JSON.stringify(input)).toBe(snapshot);
  });
});
describe("[hand] B173 professional FX depth retains real conversion fee limits", () => {
  it("states that actual receipts can be lower due to spread or fees", () => {
    const sections = fxSections("professional", { from: "EUR", to: "USD", amount: 10, rate: 1.2, result: 12, date: "2026-10-03" });
    expect(sections.at(-1)!.lines[0].en).toContain("spread or a fee");
    expect(sections.at(-1)!.lines[0].he).toContain("מרווח או עמלה");
  });
});
