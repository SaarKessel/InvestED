import { describe, expect, it } from "vitest";
import { rebaseToHundred } from "./rebase";

describe("rebaseToHundred", () => {
  it("starts every series at 100 on the first common date", () => {
    const r = rebaseToHundred([
      { symbol: "A", history: [{ date: "2026-01-01", price: 10 }, { date: "2026-01-02", price: 11 }, { date: "2026-01-03", price: 12 }] },
      { symbol: "B", history: [{ date: "2026-01-02", price: 50 }, { date: "2026-01-03", price: 40 }] },
    ])!;
    expect(r[0].points).toEqual([{ date: "2026-01-02", value: 100 }, { date: "2026-01-03", value: (12 / 11) * 100 }]);
    expect(r[1].points[1].value).toBeCloseTo(80);
  });
  it("returns null without overlap or with one series", () => {
    expect(rebaseToHundred([{ symbol: "A", history: [{ date: "d1", price: 1 }, { date: "d2", price: 2 }] }])).toBeNull();
    expect(rebaseToHundred([
      { symbol: "A", history: [{ date: "d1", price: 1 }, { date: "d2", price: 2 }] },
      { symbol: "B", history: [{ date: "d3", price: 1 }, { date: "d4", price: 2 }] },
    ])).toBeNull();
  });
});
