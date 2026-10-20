import { describe, it, expect } from "vitest";
import { parseNum, inputCls } from "./sharedUtil";

describe("parseNum", () => {
  it("parses plain numbers", () => {
    expect(parseNum("42")).toBe(42);
    expect(parseNum("3.5")).toBe(3.5);
    expect(parseNum("0")).toBe(0);
    expect(parseNum("-7")).toBe(-7);
  });
  it("rejects empty, blank and non-numeric input", () => {
    expect(parseNum("")).toBeNull();
    expect(parseNum("   ")).toBeNull();
    expect(parseNum("abc")).toBeNull();
    expect(parseNum("12x")).toBeNull();
  });
});
describe("inputCls", () => {
  it("is the shared input styling contract", () => {
    expect(inputCls).toContain("rounded-lg");
    expect(inputCls).toContain("border-border");
  });
});
