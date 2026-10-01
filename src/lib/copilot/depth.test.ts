import { describe, expect, it } from "vitest";
import { runCalcDesk } from "./calcDesk";
import { depthSections } from "./depth";
describe("depth", () => {
  const calc = runCalcDesk("invest 10000 and save 500 a month for 10 years")!;
  it("BASIC adds nothing", () => { expect(depthSections("basic", { calc })).toEqual([]); expect(depthSections("basic", { question: "what is a deductible" })).toEqual([]); });
  it("calc passes grow by level and stay labelled", () => {
    const ids = (l: "junior" | "senior" | "professional") => depthSections(l, { calc }).map((s) => s.id);
    expect(ids("junior")).toEqual(["meaning"]);
    expect(ids("senior")).toEqual(["meaning", "sensitivity"]);
    expect(ids("professional")).toEqual(["meaning", "sensitivity", "method"]);
    expect(depthSections("senior", { calc }).find((s) => s.id === "sensitivity")!.lines.length).toBe(3);
  });
  it("sensitivity numbers come from the fixed calculator", () => {
    const s = depthSections("senior", { calc }).find((x) => x.id === "sensitivity")!;
    expect(s.lines[1].en).toContain(`${calc.returnPct}% a year`);
  });
  it("concept passes use stored text and deepen by level", () => {
    const j = depthSections("junior", { question: "what is a deductible" }).map((s) => s.id);
    expect(j).toContain("related");
    const p = depthSections("professional", { question: "what is a deductible" }).map((s) => s.id);
    expect(p).toContain("limits");
    expect(depthSections("junior", { question: "hello" })).toEqual([]);
  });
});
