// ---------------------------------------------------------------------------
// InvestED — Goal Planner View Model
// Beta 2.0
//
// Presentation-only adapter.
// No financial calculations belong in the UI.
// ---------------------------------------------------------------------------

import type {
  GoalPlannerResult
} from "@/lib/calculatorEngine";

export interface GoalPlannerViewModel {

  targetAmount: number | null;

  expectedFinalValue: number;

  progressPercentage: number;

  gap: number;

  requiredMonthlyContribution: number;

  currentAmount: number;

  years: number;

  initialCapital: number;

  futureContributions: number;

  estimatedGrowth: number;

  goalReached: boolean;

  hasGoal: boolean;
}

export function createGoalPlannerViewModel(
  result: GoalPlannerResult,
  currentAmount: number,
  years: number
): GoalPlannerViewModel {

  const targetAmount =
    result.targetAmount;

  const goalReached =
    targetAmount !== null &&
    result.currentProjectedValue >=
      targetAmount;

  return {

    targetAmount,

    expectedFinalValue:
      result.currentProjectedValue,

    progressPercentage:
      result.progressPct,

    gap:
      result.gap,

    requiredMonthlyContribution:
      result.requiredMonthlyContribution,

    currentAmount:
      Math.max(
        0,
        Number.isFinite(currentAmount)
          ? currentAmount
          : 0
      ),

    years:
      Math.max(
        0,
        Number.isFinite(years)
          ? years
          : 0
      ),

    initialCapital:
      result.initialCapital,

    futureContributions:
      result.futureContributions,

    estimatedGrowth:
      result.estimatedGrowth,

    goalReached,

    hasGoal:
      result.hasGoal
  };
}
