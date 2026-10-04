import { describe, expect, it } from "vitest";
import { runCalcDesk } from "./calcDesk";
describe("B191 scale words on the starting amount are not dropped", () => {
  it("1.5M is 1,500,000", () => {
    expect(runCalcDesk("invest 1.5M and save 2K a month for 20 years at 5%")?.principal).toBe(1500000);
  });
  it("Hebrew 10 אלף is 10,000 even when the horizon is also 10", () => {
    const r = runCalcDesk("להשקיע 10 אלף ולחסוך 500 בחודש ל-10 שנים בתשואה של 6%")!;
    expect(r.principal).toBe(10000); expect(r.monthly).toBe(500); expect(r.target).toBeNull();
  });
  it("English and Hebrew phrasings agree", () => {
    const a = runCalcDesk("invest 10000 and save 500 a month for 10 years at 6%")!;
    const h = runCalcDesk("להשקיע 10 אלף ולחסוך 500 בחודש ל-10 שנים בתשואה של 6%")!;
    expect(h.finalBalance).toBe(a.finalBalance);
  });
});
