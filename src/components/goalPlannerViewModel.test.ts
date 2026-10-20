import { describe, it, expect } from "vitest";
import { createGoalPlannerViewModel } from "./goalPlannerViewModel";
import type { GoalAnalysis } from "@/lib/goalEngine";

const base: GoalAnalysis = {
  targetAmount: 100000,
  expectedFinalValue: 80000,
  progressPercentage: 80,
  gap: 20000,
  requiredMonthlyContribution: 500,
  currentAmount: 10000,
  years: 10,
  achievable: false,
} as unknown as GoalAnalysis;

describe("createGoalPlannerViewModel", () => {
  it("maps the analysis fields one to one", () => {
    const vm = createGoalPlannerViewModel(base);
    expect(vm.targetAmount).toBe(100000);
    expect(vm.expectedFinalValue).toBe(80000);
    expect(vm.progressPercentage).toBe(80);
    expect(vm.gap).toBe(20000);
    expect(vm.requiredMonthlyContribution).toBe(500);
    expect(vm.currentAmount).toBe(10000);
    expect(vm.years).toBe(10);
  });
  it("goalReached mirrors achievable", () => {
    expect(createGoalPlannerViewModel(base).goalReached).toBe(false);
    expect(createGoalPlannerViewModel({ ...base, achievable: true }).goalReached).toBe(true);
  });
  it("hasGoal is true only for a positive target", () => {
    expect(createGoalPlannerViewModel(base).hasGoal).toBe(true);
    expect(createGoalPlannerViewModel({ ...base, targetAmount: 0 }).hasGoal).toBe(false);
  });
});
