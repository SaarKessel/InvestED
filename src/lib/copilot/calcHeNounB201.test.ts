import { describe, it, expect } from "vitest";
import { runCalcDesk } from "./calcDesk";

describe("Hebrew noun phrasing without a verb", () => {
  it("reads 'השקעה של 10,000 ו-500 בחודש ב-6 אחוז ל-30 שנה'", () => {
    const r = runCalcDesk("השקעה של 10,000 ו-500 בחודש ב-6 אחוז ל-30 שנה");
    expect(r).not.toBeNull();
    expect(r?.principal).toBe(10000);
    expect(r?.monthly).toBe(500);
    expect(r?.years).toBe(30);
    expect(r?.returnPct).toBe(6);
  });
  it("still ignores a plain question without a plan", () => {
    expect(runCalcDesk("מה זאת השקעה של סיכון")).toBeNull();
  });
});
