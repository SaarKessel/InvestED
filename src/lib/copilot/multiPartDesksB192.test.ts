import { describe, expect, it } from "vitest";
import { decompose } from "./decompose";
describe("B192 a plain 'and' between two currency conversions or two country statistics is two tasks", () => {
  it("two conversions", () => {
    const d = decompose("convert 100 dollars to euros and 50 pounds to shekels");
    expect(d.tasks.map((t) => t.route)).toEqual(["fx", "fx"]);
  });
  it("Hebrew ו- between conversions", () => {
    expect(decompose("המר 100 דולר לשקל ו-50 יורו לדולר").tasks).toHaveLength(2);
  });
  it("two country statistics, even when the second country is unsupported (not silently dropped)", () => {
    expect(decompose("inflation in Germany and unemployment in France").tasks).toHaveLength(2);
    expect(decompose("GDP of Israel and GDP of Japan").tasks.map((t) => t.route)).toEqual(["wb", "wb"]);
  });
  it("a single conversion with 'and' stays one task", () => {
    expect(decompose("convert 100 USD to EUR").tasks).toHaveLength(1);
  });
});
