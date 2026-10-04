import { describe, expect, it } from "vitest";
import { runCalcDesk } from "./calcDesk";
describe("B199 'compound interest on X at r% for n years' is calculated, not defined", () => {
  it("EN", () => {
    const r = runCalcDesk("compound interest on 5000 at 3% for 7 years")!;
    expect(r.principal).toBe(5000); expect(r.returnPct).toBe(3); expect(r.years).toBe(7); expect(r.monthly).toBe(0);
  });
  it("HE", () => {
    const r = runCalcDesk("ריבית דריבית על 5000 שקל ב-3% ל-7 שנים")!;
    expect(r.principal).toBe(5000); expect(r.returnPct).toBe(3); expect(r.years).toBe(7);
  });
  it("a plain definition question is still not a calculation", () => {
    expect(runCalcDesk("what is compound interest")).toBeNull();
    expect(runCalcDesk("מהי ריבית דריבית")).toBeNull();
  });
});
