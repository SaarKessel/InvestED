import { describe, expect, it } from "vitest";
import { runMathDesk } from "./mathDesk";
const v = (q: string) => runMathDesk(q)?.value;
describe("mathDesk", () => {
  it("does precedence and powers", () => { expect(v("2+3*4")).toBe(14); expect(v("2^3^2")).toBe(512); expect(v("(1+2)*3")).toBe(9); });
  it("reads words, commas, percent", () => {
    expect(v("what is 1,200 plus 300 times 2")).toBe(1800);
    expect(v("15% of 2000")).toBe(300);
    expect(v("10k + 2.5k")).toBe(12500);
    expect(v("1000*1.07^10")).toBeCloseTo(1967.15, 1);
  });
  it("reads Hebrew operator words", () => { expect(v("כמה זה 100 כפול 3 ועוד 20")).toBe(320); expect(v("20% מתוך 500")).toBe(100); });
  it("functions", () => { expect(v("sqrt(144)+max(3,9)")).toBe(21); });
  it("says so on divide by zero and bad syntax", () => {
    expect(runMathDesk("5/0")?.error).toBe("divide_by_zero");
    expect(runMathDesk("(2+3")?.error).toBe("unparseable");
  });
  it("leaves ordinary questions alone", () => {
    for (const q of ["what is inflation", "how do I invest 500 a month", "S&P 500 today", "hello", "5"]) expect(runMathDesk(q)).toBeNull();
  });
  it("shows steps", () => { expect(runMathDesk("2+3*4")?.steps.map((s) => s.expr)).toEqual(["3 * 4", "2 + 12"]); });
});
