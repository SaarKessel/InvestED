import { describe, it, expect } from "vitest";
import { getHorizonProfile, getHorizonLabel, getGoalLabel, getRiskLabel, HORIZON_THRESHOLDS, RISK_LABELS, GOAL_LABELS, HORIZON_LABELS } from "./investmentMappings";

describe("getHorizonProfile", () => {
  it("buckets years by the thresholds", () => {
    expect(getHorizonProfile(0)).toBe("short");
    expect(getHorizonProfile(HORIZON_THRESHOLDS.short - 1)).toBe("short");
    expect(getHorizonProfile(HORIZON_THRESHOLDS.short)).toBe("medium");
    expect(getHorizonProfile(HORIZON_THRESHOLDS.medium - 1)).toBe("medium");
    expect(getHorizonProfile(HORIZON_THRESHOLDS.medium)).toBe("long");
    expect(getHorizonProfile(40)).toBe("long");
  });
  it("clamps nonsense input to short", () => {
    expect(getHorizonProfile(NaN)).toBe("short");
    expect(getHorizonProfile(-10)).toBe("short");
  });
});
describe("labels", () => {
  it("horizon label follows the profile and language", () => {
    expect(getHorizonLabel(3, "he")).toBe("קצר טווח");
    expect(getHorizonLabel(3, "en")).toBe("Short Term");
    expect(getHorizonLabel(20, "en")).toBe("Long Term");
  });
  it("goal and risk labels fall back safely for unknown or missing keys", () => {
    expect(getGoalLabel(undefined, "en")).toBe(GOAL_LABELS.general.en);
    expect(getGoalLabel("nonsense", "he")).toBe(GOAL_LABELS.general.he);
    expect(getRiskLabel(undefined, "en")).toBe(RISK_LABELS.medium.en);
    expect(getRiskLabel("extreme", "he")).toBe(RISK_LABELS.medium.he);
    expect(getRiskLabel("low", "he")).toBe(RISK_LABELS.low.he);
  });
  it("every label has both languages", () => {
    for (const m of [RISK_LABELS, GOAL_LABELS, HORIZON_LABELS]) {
      for (const v of Object.values(m)) {
        expect(v.he).toMatch(/[\u0590-\u05ff]/);
        expect(v.en.trim()).not.toBe("");
      }
    }
  });
});
