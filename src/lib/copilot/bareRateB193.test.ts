import { describe, expect, it } from "vitest";
import { runCalcDesk } from "./calcDesk";
const he = "להשקיע 10000 ולחסוך 500 בחודש ל-10 שנים";
describe("B193 a stated rate without the word תשואה/ריבית is not replaced by the 7% default", () => {
  it.each([["ב-6 אחוז", 6], ["ב-6%", 6], ["עם 6%", 6], ["ב-6.5 אחוזים", 6.5]])("Hebrew %s", (w, p) => {
    expect(runCalcDesk(`${he} ${w}`)?.returnPct).toBe(p);
  });
  it("Hebrew inflation / fee percent is still not the return", () => {
    expect(runCalcDesk(`${he} עם אינפלציה של 3%`)?.returnPct).toBe(7);
    expect(runCalcDesk(`${he} עם עמלה של 1%`)?.returnPct).toBe(7);
  });
  it("a negative stated rate is used, not replaced by 7%", () => {
    const r = runCalcDesk("invest 10000 and save 500 a month for 10 years at -2%")!;
    expect(r.returnPct).toBe(-2);
    expect(r.finalBalance).toBeLessThan(r.contributed);
  });
});
