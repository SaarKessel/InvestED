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

describe("starting amount in one sentence", () => {
  it.each([
    ["If I invest 10000 and save 500 a month for 10 years how much will I have?", 10000],
    ["invest 10,000 and save 500 a month for 10 years", 10000],
    ["I invest 10000 now and 500 monthly for 10 years", 10000],
  ])("%s", (q, start) => { const r = runCalcDesk(q)!; expect(r.principal).toBe(start); expect(r.monthly).toBe(500); expect(r.years).toBe(10); expect(recompute(r)).toBe(r.finalBalance); });
  it("does not invent a start when none is stated", () => { expect(runCalcDesk("save 500 a month for 10 years")!.principal).toBe(0); });
});

describe("index names are not starting amounts", () => { it("S&P 500 stays a name", () => { expect(runCalcDesk("If I invest 1000 per month for 20 years in the S&P 500, what do I get?")!.principal).toBe(0); }); });

describe("Hebrew starting amount", () => { it("אשקיע 10000 ואחסוך 500 בחודש", () => { const r = runCalcDesk("אשקיע 10000 ואחסוך 500 בחודש ל-10 שנים"); expect(r?.principal).toBe(10000); expect(r?.monthly).toBe(500); expect(r?.years).toBe(10); }); });
