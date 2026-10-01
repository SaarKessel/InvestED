import { describe, expect, it } from "vitest";
import { looksLikeCalcRequest, runCalcDesk } from "./calcDesk";

describe("calcDesk", () => {
  it("ignores non-calculation questions", () => {
    expect(looksLikeCalcRequest("what is compound interest")).toBe(false);
    expect(runCalcDesk("What is VOO price?")).toBeNull();
  });
  it("computes from an English sentence", () => {
    const r = runCalcDesk("If I invest 1000 per month for 20 years in the S&P 500, what do I get?");
    expect(r).not.toBeNull();
    expect(r!.monthly).toBe(1000);
    expect(r!.years).toBe(20);
    expect(r!.finalBalance).toBeGreaterThan(r!.contributed);
    expect(r!.contributed).toBeCloseTo(240000, -2);
  });
  it("computes from a Hebrew sentence", () => {
    const r = runCalcDesk("אם אשקיע 2000 שקל בחודש ל-15 שנה במדד S&P 500 כמה יהיה לי?");
    expect(r!.monthly).toBe(2000);
    expect(r!.years).toBe(15);
    expect(r!.finalBalance).toBeGreaterThan(540000);
  });
});

describe("plain 'I have X and add Y per month'", () => {
  it("is a calculation request with the starting amount kept", () => {
    const r = runCalcDesk("I have 10000 and add 500 per month for 10 years");
    expect(r?.principal).toBe(10000); expect(r?.monthly).toBe(500); expect(r?.years).toBe(10);
  });
  it("ignores unrelated year talk", () => { expect(runCalcDesk("I have 3 years left on my loan")).toBeNull(); });
});
