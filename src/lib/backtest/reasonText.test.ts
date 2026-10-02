import { describe, expect, it } from "vitest";
import { reasonText } from "./reasonText";

describe("reasonText", () => {
  it("translates known reasons to Hebrew and leaves English alone", () => {
    expect(reasonText("Need 253 observations (have 120)", "he")).toBe("נדרשות 253 תצפיות (יש 120)");
    expect(reasonText("Need 253 observations (have 120)", "en")).toBe("Need 253 observations (have 120)");
    expect(reasonText("Need at least 20 return observations (have 5)", "he")).toContain("20");
    expect(reasonText("Something new", "he")).toBe("Something new");
  });
});
