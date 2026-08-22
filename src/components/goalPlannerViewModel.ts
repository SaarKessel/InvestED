// ---------------------------------------------------------------------------
// InvestED — Goal Planner View Model
// Presentation-only adapter.
// No financial calculations belong in the UI layer.
// ---------------------------------------------------------------------------

import type {
  GoalAnalysis
} from "@/lib/goalEngine";

export interface GoalPlannerViewModel {

  targetAmount: number;

  expectedFinalValue: number;

  progressPercentage: number;

  gap: number;

  requiredMonthlyContribution: number;

  currentAmount: number;

  years: number;

  goalReached: boolean;

  hasGoal: boolean;
}

export function createGoalPlannerViewModel(
  result: GoalAnalysis
): GoalPlannerViewModel {

  return {

    targetAmount:
      result.targetAmount,

    expectedFinalValue:
      result.expectedFinalValue,

    progressPercentage:
      result.progressPercentage,

    gap:
      result.gap,

    requiredMonthlyContribution:
      result.requiredMonthlyContribution,

    currentAmount:
      result.currentAmount,

    years:
      result.years,

    goalReached:
      result.achievable,

    hasGoal:
      result.targetAmount > 0

  };
}
