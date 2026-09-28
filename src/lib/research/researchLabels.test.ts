import { describe, expect, it } from "vitest";
import { indicatorLabel, researchCodeLabel } from "./researchLabels";

describe("research display labels", () => {
  it("keeps raw values out of Hebrew display while retaining provider names", () => {
    expect(researchCodeLabel("asset", "stock", "he")).toBe("מניה");
    expect(researchCodeLabel("status", "unknown", "he")).toBe("לא ידוע");
    expect(researchCodeLabel("source", "yahoo_finance", "he")).toBe("Yahoo Finance");
    expect(indicatorLabel("volatilityPct", "he")).toBe("תנודתיות");
  });
  it("preserves English labels and never invents an unknown status", () => {
    expect(researchCodeLabel("status", "closed", "en")).toBe("Closed");
    expect(researchCodeLabel("status", undefined, "en")).toBe("Unknown");
    expect(indicatorLabel("macd", "en")).toContain("MACD");
  });
});
