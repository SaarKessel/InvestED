import { describe, expect, it } from "vitest";
import { runCalcDesk } from "./calcDesk";
import { calcSteps, recompute } from "./calcExplain";
describe("calcExplain", () => {
  const d = runCalcDesk("If I invest 10000 and save 500 a month for 10 years how much will I have?");
  it("the independent recomputation equals the card's final balance", () => { expect(d).not.toBeNull(); expect(recompute(d!)).toBe(d!.finalBalance); });
  it("steps carry the same numbers in both languages", () => {
    const money = (v: number) => String(v);
    for (const language of ["en", "he"] as const) {
      const text = calcSteps({ data: d!, money, language }).join(" ");
      expect(text).toContain(String(d!.finalBalance)); expect(text).toContain(String(d!.real)); expect(text).toContain("120");
    }
  });
});
