import { describe, expect, it } from "vitest";
import { depthSections, mathSections, fxSections, wbSections, deskSections, assetSections, calcSections, conceptSections } from "./depth";
import { runMathDesk } from "./mathDesk";
import { runCalcDesk } from "./calcDesk";
import type { WbResult } from "./worldBankDesk";
const math = runMathDesk("2 + 3")!;
const fx = { amount: 100, from: "USD", to: "ILS", rate: 3.5, result: 350, date: "2026-10-03" };
const wb: WbResult = { indicator: "inflation", country: "ISR", countryName: { en: "Israel", he: "ישראל" }, points: [{ year: "2025", value: 3 }], lastUpdated: "2026-10-03" };
const assets = [{ symbol: "TSLA", price: 100, changePercent: 2 }];
const calc = runCalcDesk("how much would 1000 usd grow at 7% over 10 years")!;
const rows = (["junior", "senior", "professional"] as const).flatMap((level) => ["math", "fx", "wb", "desk", "assets", "calc", "concept"].map((kind) => [level, kind] as const));
describe("[sweep] B175 depth dispatch picks the first available deterministic source", () => {
  it.each(rows)("level %s source %s", (level, kind) => {
    const msg = { question: "inflation", ...(kind !== "concept" ? { calc } : {}), ...(["math", "fx", "wb", "desk", "assets"].includes(kind) ? { assets } : {}), ...(["math", "fx", "wb", "desk"].includes(kind) ? { desk: { kind: "movers" as const } } : {}), ...(["math", "fx", "wb"].includes(kind) ? { wb } : {}), ...(["math", "fx"].includes(kind) ? { fx } : {}), ...(kind === "math" ? { math } : {}) };
    const expected = kind === "math" ? mathSections(level, math) : kind === "fx" ? fxSections(level, fx) : kind === "wb" ? wbSections(level, wb) : kind === "desk" ? deskSections(level, "movers") : kind === "assets" ? assetSections(level, assets) : kind === "calc" ? calcSections(level, calc) : conceptSections(level, "inflation");
    expect(depthSections(level, msg)).toEqual(expected);
    expect(depthSections("basic", msg)).toEqual([]);
  });
});
describe("[hand] B175 absent depth input stays empty", () => {
  it("does not invent a topic from an empty input envelope", () => {
    for (const level of ["basic", "junior", "senior", "professional"] as const) expect(depthSections(level, {})).toEqual([]);
  });
});
