import { describe, it, expect } from "vitest";
import {
  analyzeFinancialGoal,
  detectTargetAmount,
  calculateGoalProgress,
} from "./goalEngine";

describe("analyzeFinancialGoal", () => {
  it("calculates goal progress correctly", () => {
    const result = analyzeFinancialGoal(100_000, 1_000_000, 20, 7, 2000);
    expect(result.targetAmount).toBe(1_000_000);
    expect(result.currentAmount).toBe(100_000);
    expect(result.expectedFinalValue).toBeGreaterThan(0);
    expect(result.progressPercentage).toBeGreaterThan(0);
    expect(result.progressPercentage).toBeLessThanOrEqual(100);
  });

  it("marks achievable when projected exceeds target", () => {
    const result = analyzeFinancialGoal(900_000, 1_000_000, 20, 7, 5000);
    expect(result.achievable).toBe(true);
    expect(result.gap).toBe(0);
  });

  it("calculates gap when target not reached", () => {
    const result = analyzeFinancialGoal(10_000, 1_000_000, 5, 5, 0);
    expect(result.achievable).toBe(false);
    expect(result.gap).toBeGreaterThan(0);
  });

  it("handles zero years", () => {
    const result = analyzeFinancialGoal(100_000, 1_000_000, 0, 7, 0);
    expect(result.expectedFinalValue).toBe(100_000);
    expect(result.achievable).toBe(false);
  });

  it("handles zero target", () => {
    const result = analyzeFinancialGoal(100_000, 0, 10, 7, 0);
    expect(result.progressPercentage).toBe(0);
  });

  it("required monthly contribution is positive", () => {
    const result = analyzeFinancialGoal(0, 1_000_000, 20, 7, 0);
    expect(result.requiredMonthlyContribution).toBeGreaterThan(0);
  });
});

describe("detectTargetAmount", () => {
  it("detects million in Hebrew", () => {
    expect(detectTargetAmount("אני רוצה להגיע למיליון שקל")).toBe(1_000_000);
  });

  it("detects half million", () => {
    expect(detectTargetAmount("חצי מיליון")).toBe(500_000);
  });

  it("detects thousand", () => {
    expect(detectTargetAmount("500 אלף")).toBe(500_000);
  });

  it("returns 0 when no amount detected", () => {
    expect(detectTargetAmount("אני רוצה להשקיע")).toBe(0);
  });
});

describe("calculateGoalProgress", () => {
  it("returns 100 when projected equals target", () => {
    expect(calculateGoalProgress(1_000_000, 1_000_000)).toBe(100);
  });

  it("returns 0 when target is 0", () => {
    expect(calculateGoalProgress(1_000_000, 0)).toBe(0);
  });

  it("caps at 100", () => {
    expect(calculateGoalProgress(2_000_000, 1_000_000)).toBe(100);
  });

  it("calculates partial progress", () => {
    expect(calculateGoalProgress(500_000, 1_000_000)).toBe(50);
  });
});
