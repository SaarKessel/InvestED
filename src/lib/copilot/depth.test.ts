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

describe("desk depth", () => {
  it("market-data answers deepen by level and add no numbers", () => {
    const ids = (l: "junior" | "senior" | "professional") => depthSections(l, { desk: { kind: "movers" } }).map((s) => s.id);
    expect(ids("junior")).toEqual(["read"]);
    expect(ids("senior")).toEqual(["read", "next"]);
    expect(ids("professional")).toEqual(["read", "next", "datalimits"]);
    for (const k of ["movers", "policy_rate", "insurance"] as const) for (const s of depthSections("professional", { desk: { kind: k } })) for (const l of s.lines) expect(/\d/.test(l.en + l.he)).toBe(false);
  });
});

describe("asset depth", () => {
  const a = [{ symbol: "AAPL", price: 333.02, changePercent: -1.19 }];
  it("deepens by level and labels the band", () => {
    const ids = (l: "junior" | "senior" | "professional") => depthSections(l, { assets: a }).map((s) => s.id);
    expect(ids("junior")).toEqual(["terms"]);
    expect(ids("senior")).toEqual(["terms", "move"]);
    expect(ids("professional")).toEqual(["terms", "move", "assetlimits"]);
    expect(depthSections("senior", { assets: a }).find((s) => s.id === "move")!.lines[0].en).toContain("moderate");
    expect(depthSections("basic", { assets: a })).toEqual([]);
  });
});
