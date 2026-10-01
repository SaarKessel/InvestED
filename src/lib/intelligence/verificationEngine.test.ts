import { describe, expect, it } from "vitest";
import { numbersIn, verifyNumbers } from "./verificationEngine";
describe("verificationEngine", () => {
  it("normalizes numbers", () => { expect(numbersIn("1,000.50 and 2.0")).toEqual(["1000.5", "2"]); });
  it("passes when all numbers trace to sources", () => { expect(verifyNumbers("Total 1,500 in 10 years", ["1500", "10 years"]).ok).toBe(true); });
  it("flags invented numbers", () => { expect(verifyNumbers("Expect 12% return", ["rate 7"])).toEqual({ ok: false, unsupported: ["12"] }); });
});
