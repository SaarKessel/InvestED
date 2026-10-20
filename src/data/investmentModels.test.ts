import { describe, it, expect } from "vitest";
import { defaultScenarios } from "./investmentModels";

describe("defaultScenarios", () => {
  it("are ordered from low to high return with sane values", () => {
    expect(defaultScenarios.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < defaultScenarios.length; i++) {
      expect(defaultScenarios[i].annualReturn).toBeGreaterThan(defaultScenarios[i - 1].annualReturn);
    }
    for (const s of defaultScenarios) {
      expect(s.annualReturn).toBeGreaterThan(0);
      expect(s.annualReturn).toBeLessThan(0.5);
      expect(s.name.trim()).not.toBe("");
      expect(s.description.trim()).not.toBe("");
    }
  });
});
