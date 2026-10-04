import { describe, expect, it } from "vitest";
import { runCalcDesk } from "./calcDesk";
import { parseFxRequest } from "./fxDesk";
describe("B194 negatives are not silently flipped; absurd inputs carry a note", () => {
  it("negative starting amount is not read as positive", () => {
    expect(runCalcDesk("invest -10000 and save 500 a month for 10 years")).toBeNull();
  });
  it("negative conversion amount is not read as positive", () => {
    expect(parseFxRequest("convert -50 USD to ILS")).toBeNull();
    expect(parseFxRequest("convert 50 USD to ILS")?.amount).toBe(50);
  });
  it("Hebrew horizon hyphen and a negative rate are not negative amounts", () => {
    expect(runCalcDesk("להשקיע 10000 ולחסוך 500 בחודש ל-10 שנים ב-6 אחוז")?.principal).toBe(10000);
    expect(runCalcDesk("invest 10000 and save 500 a month for 10 years at -2%")?.returnPct).toBe(-2);
  });
  it("1000 years and 100% return keep their numbers and carry a note", () => {
    expect(runCalcDesk("invest 10000 and save 500 a month for 1000 years")?.warning?.en).toMatch(/1000 years/);
    expect(runCalcDesk("invest 10000 and save 500 a month for 10 years at 100%")?.warning?.he).toMatch(/100%/);
    expect(runCalcDesk("invest 10000 and save 500 a month for 10 years at 6%")?.warning).toBeUndefined();
  });
});
