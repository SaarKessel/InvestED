import { describe, expect, it } from "vitest";
import { circuitBreaker, shouldShowHumility, trailingMisses } from "./humility";
const p = (d: string, hit: boolean) => ({ resolvedAt: `2026-01-${d}T00:00:00Z`, hit });
describe("humility", () => {
  it("fires after 3 straight misses", () => {
    expect(trailingMisses([p("01", true), p("02", false), p("03", false), p("04", false)])).toBe(3);
    expect(shouldShowHumility([p("01", true), p("02", false), p("03", false), p("04", false)])).toBe(true);
  });
  it("a hit resets the streak and order is by resolve date", () => {
    expect(shouldShowHumility([p("04", true), p("01", false), p("02", false), p("03", false)])).toBe(false);
    expect(trailingMisses([])).toBe(0);
  });
  it("two misses are not enough", () => expect(shouldShowHumility([p("01", false), p("02", false)])).toBe(false));
});
describe("circuitBreaker", () => {
  it("trips at the first 10% drawdown from peak", () => {
    const r = circuitBreaker([100, 120, 115, 107, 90], 10)!;
    expect(r.tripped).toBe(true);
    expect(r.trippedAtIndex).toBe(3);
    expect(r.peak).toBe(120);
  });
  it("does not trip on small dips", () => expect(circuitBreaker([100, 105, 100], 10)!.tripped).toBe(false));
  it("rejects bad input", () => {
    expect(circuitBreaker([100], 10)).toBeNull();
    expect(circuitBreaker([100, -1], 10)).toBeNull();
    expect(circuitBreaker([100, 90], 0)).toBeNull();
  });
});
