import { describe, expect, it } from "vitest";
import { buildSymbolPlan, CORE_SYMBOLS, INTEREST_SYMBOLS, MAX_SYMBOLS } from "./knownAssets";
import type { InterestArea } from "../../types";

const areas = Object.keys(INTEREST_SYMBOLS) as InterestArea[];
const cases: InterestArea[][] = [[]];
for (const a of areas) {
  cases.push([a]);
  for (const b of areas) {
    cases.push([a, b]);
    for (const c of areas) cases.push([a, b, c]);
  }
}

describe("[sweep] B119 bounded symbol plan first-occurrence order oracle", () => {
  it.each(cases.map((row) => [row] as const))("interest sequence %j", (interests) => {
    const candidates = [...CORE_SYMBOLS, ...interests.flatMap((area) => INTEREST_SYMBOLS[area])];
    const first = candidates.filter((asset, index) => candidates.findIndex((other) => other.symbol === asset.symbol) === index).slice(0, MAX_SYMBOLS);
    const plan = buildSymbolPlan(interests);
    expect(plan).toEqual(first);
    expect(new Set(plan.map((p) => p.symbol)).size).toBe(plan.length);
    expect(plan.length).toBeLessThanOrEqual(MAX_SYMBOLS);
    expect(plan.slice(0, CORE_SYMBOLS.length)).toEqual(CORE_SYMBOLS);
    expect(buildSymbolPlan([...interests, ...interests])).toEqual(plan);
    plan.pop();
    expect(buildSymbolPlan(interests)).toEqual(first);
  });
});

describe("[hand] B119 unsupported interest isolation", () => {
  it("unknown interests cannot displace a supported interest", () => {
    expect(buildSymbolPlan(["unknown" as InterestArea, "energy", "unknown" as InterestArea])).toEqual(buildSymbolPlan(["energy"]));
  });
  it("empty interest list does not return the mutable core array itself", () => {
    expect(buildSymbolPlan([])).not.toBe(CORE_SYMBOLS);
  });
});
