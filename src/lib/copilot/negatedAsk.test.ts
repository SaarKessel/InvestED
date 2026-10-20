import { describe, it, expect } from "vitest";
import { isNegatedAsk } from "./negatedAsk";

describe("isNegatedAsk", () => {
  it("catches English negations of information verbs", () => {
    expect(isNegatedAsk("don't tell me the price")).toBe(true);
    expect(isNegatedAsk("do not show me the chart")).toBe(true);
    expect(isNegatedAsk("never convert my dollars")).toBe(true);
    expect(isNegatedAsk("I don't want to know")).toBe(true);
    expect(isNegatedAsk("dont need to hear it")).toBe(true);
  });
  it("catches Hebrew negations", () => {
    expect(isNegatedAsk("אל תגיד לי את המחיר")).toBe(true);
    expect(isNegatedAsk("לא רוצה לראות")).toBe(true);
    expect(isNegatedAsk("אל תציג לי גרף")).toBe(true);
  });
  it("leaves plain asks alone", () => {
    expect(isNegatedAsk("tell me the price of NVDA")).toBe(false);
    expect(isNegatedAsk("show me the chart")).toBe(false);
    expect(isNegatedAsk("מה המחיר של אפל")).toBe(false);
    expect(isNegatedAsk("convert 100 dollars")).toBe(false);
  });
});
