import { describe, expect, it } from "vitest";

import { isExtremeMove } from "./marketMovers";
describe("isExtremeMove", () => { it("flags 40% and over in either direction, not normal moves or missing data", () => { expect(isExtremeMove(-84.15)).toBe(true); expect(isExtremeMove(40)).toBe(true); expect(isExtremeMove(18.3)).toBe(false); expect(isExtremeMove(null)).toBe(false); }); });

import { knownAction } from "./marketMovers";
describe("knownAction", () => {
  it("names the Corteva spin-off for a week after Oct 1 2026 only", () => {
    expect(knownAction("CTVA", new Date("2026-10-02T12:00:00Z"))?.text.en).toContain("Vylor");
    expect(knownAction("ctva", new Date("2026-10-07T00:00:00Z"))).not.toBeNull();
    expect(knownAction("CTVA", new Date("2026-10-20T00:00:00Z"))).toBeNull();
    expect(knownAction("CTVA", new Date("2026-09-30T00:00:00Z"))).toBeNull();
    expect(knownAction("AAPL", new Date("2026-10-02T00:00:00Z"))).toBeNull();
  });
});
