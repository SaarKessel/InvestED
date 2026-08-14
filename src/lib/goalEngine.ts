// ---------------------------------------------------------------------------
// InvestED — Goal Planning Engine v3
// Unified Goal & Retirement Planning
// ---------------------------------------------------------------------------

export interface GoalAnalysis {
  targetAmount: number;
  currentAmount: number;
  years: number;
  requiredMonthlyContribution: number;
  expectedFinalValue: number;
  progressPercentage: number;
  achievable: boolean;

  /**
   * Remaining amount required to reach the target.
   *
   * This value is calculated by the goal engine
   * and consumed directly by the UI.
   */
  gap: number;
}

// ---------------------------------------------------------------------------
// Target Amount Detection
// ---------------------------------------------------------------------------

export function detectTargetAmount(text: string): number {
  const normalized = text
    .toLowerCase()
    .replace(/,/g, "")
    .trim();

  let amount = 0;

  const cleanedText = normalized.replace(
    /(?:בן|בת)\s+\d+/g,
    ""
  );

  // Natural Hebrew amounts
  if (
    cleanedText.includes("חצי מיליון") ||
    cleanedText.includes("חצי מליון")
  ) {
    amount = Math.max(amount, 500_000);
  }

  if (
    cleanedText.includes("מיליון וחצי") ||
    cleanedText.includes("מליון וחצי")
  ) {
    amount = Math.max(amount, 1_500_000);
  }

  if (
    cleanedText.includes("רבע מיליון") ||
    cleanedText.includes("רבע מליון")
  ) {
    amount = Math.max(amount, 250_000);
  }

  // X million
  const millionMatch = cleanedText.match(
    /(\d+(?:\.\d+)?)\s*(?:מיליון|מליון)/
  );

  if (millionMatch) {
    amount = Math.max(
      amount,
      Number(millionMatch[1]) * 1_000_000
    );
  }

  // "מיליון" without number
  if (
    /(?:מיליון|מליון)/.test(cleanedText) &&
    amount === 0
  ) {
    amount = 1_000_000;
  }

  // Thousands
  const thousandMatch = cleanedText.match(
    /(\d+(?:\.\d+)?)\s*(אלף|k)\b/i
  );

  if (thousandMatch) {
    amount = Math.max(
      amount,
      Number(thousandMatch[1]) * 1_000
    );
  }

  // Direct currency amounts
  const currencyMatch = cleanedText.match(
    /(\d{5,})\s*(?:שקל|₪)?/
  );

  if (currencyMatch) {
    amount = Math.max(
      amount,
      Number(currencyMatch[1])
    );
  }

  return Math.round(amount);
}

// ---------------------------------------------------------------------------
// Required Monthly Contribution
// ---------------------------------------------------------------------------

export function calculateRequiredMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  years: number,
  annualReturnPct: number = 8
): number {
  if (
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0 ||
    !Number.isFinite(currentAmount) ||
    currentAmount < 0 ||
    !Number.isFinite(years) ||
    years <= 0
  ) {
    return 0;
  }

  const monthlyRate =
    annualReturnPct / 100 / 12;

  const months = Math.round(years * 12);

  if (months <= 0) {
    return 0;
  }

  const futureCurrentAmount =
    currentAmount *
    Math.pow(
      1 + monthlyRate,
      months
    );

  const remainingAmount =
    Math.max(
      targetAmount - futureCurrentAmount,
      0
    );

  if (remainingAmount <= 0) {
    return 0;
  }

  if (monthlyRate === 0) {
    return Math.round(
      remainingAmount / months
    );
  }

  const contribution =
    remainingAmount *
    monthlyRate /
    (
      Math.pow(
        1 + monthlyRate,
        months
      ) - 1
    );

  return Math.max(
    0,
    Math.round(contribution)
  );
}

// ---------------------------------------------------------------------------
// Goal Progress
// ---------------------------------------------------------------------------

export function calculateGoalProgress(
  projectedAmount: number,
  targetAmount: number
): number {
  if (
    !Number.isFinite(projectedAmount) ||
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        projectedAmount /
        targetAmount *
        100
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Full Goal Analysis
// ---------------------------------------------------------------------------

export function analyzeFinancialGoal(
  currentAmount: number,
  targetAmount: number,
  years: number,
  annualReturnPct: number = 8,
  monthlyContribution: number = 0
): GoalAnalysis {
  const safeCurrentAmount =
    Math.max(0, currentAmount);

  const safeMonthlyContribution =
    Math.max(0, monthlyContribution);

  const safeYears =
    Math.max(0, years);

  const monthlyRate =
    annualReturnPct / 100 / 12;

  const months =
    Math.round(safeYears * 12);

  let futureValue =
    safeCurrentAmount;

  if (months > 0) {
    if (monthlyRate === 0) {
      futureValue =
        safeCurrentAmount +
        safeMonthlyContribution * months;
    } else {
      futureValue =
        safeCurrentAmount *
        Math.pow(
          1 + monthlyRate,
          months
        ) +
        safeMonthlyContribution *
        (
          (
            Math.pow(
              1 + monthlyRate,
              months
            ) - 1
          ) /
          monthlyRate
        );
    }
  }

  const monthlyRequired =
    calculateRequiredMonthlyContribution(
      targetAmount,
      safeCurrentAmount,
      safeYears,
      annualReturnPct
    );

  const roundedFutureValue =
    Math.round(futureValue);

  /**
   * The goal engine is the single source of truth
   * for the remaining gap.
   *
   * Never calculate this value again inside the UI.
   */
  const gap =
    Math.max(
      targetAmount - roundedFutureValue,
      0
    );

  return {
    targetAmount,

    currentAmount:
      safeCurrentAmount,

    years:
      safeYears,

    requiredMonthlyContribution:
      monthlyRequired,

    expectedFinalValue:
      roundedFutureValue,

    progressPercentage:
      calculateGoalProgress(
        roundedFutureValue,
        targetAmount
      ),

    achievable:
      roundedFutureValue >= targetAmount,

    gap
  };
}

// ---------------------------------------------------------------------------
// Retirement Planning
// ---------------------------------------------------------------------------

export interface RetirementPlanInput {
  currentAge: number;
  expectedRetirementAge: number;
  currentAssets: number;
  monthlyInvestment: number;
  annualReturnPct: number;
  inflationPct: number;
  targetMonthlyIncome: number;
}

export interface RetirementScenarioAlternative {
  label: string;
  annualReturnPct: number;
  futureValue: number;
  monthlyIncomeDuringRetirement: number;
}

export interface RetirementPlan {
  yearsRemaining: number;
  currentAssets: number;
  monthlyInvestment: number;
  futureValue: number;
  futureMonthlyIncomeTarget: number;
  targetRetirementCapital: number;
  requiredMonthlyContribution: number;
  monthlyIncomeDuringRetirement: number;
  probabilityOfSuccess: number;
  scenarioAlternatives: RetirementScenarioAlternative[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Retirement Plan Builder
// ---------------------------------------------------------------------------

export function buildRetirementPlan(
  input: RetirementPlanInput
): RetirementPlan {
  const yearsRemaining = Math.max(
    input.expectedRetirementAge -
      input.currentAge,
    0
  );

  const months =
    Math.round(yearsRemaining * 12);

  const annualReturn =
    Math.max(
      input.annualReturnPct,
      0
    ) / 100;

  const monthlyRate =
    annualReturn / 12;

  const inflationRate =
    Math.max(
      input.inflationPct,
      0
    ) / 100;

  const currentAssets =
    Math.max(
      input.currentAssets,
      0
    );

  const monthlyInvestment =
    Math.max(
      input.monthlyInvestment,
      0
    );

  const targetMonthlyIncome =
    Math.max(
      input.targetMonthlyIncome,
      0
    );

  // -------------------------------------------------------------------------
  // Future value
  // -------------------------------------------------------------------------

  let futureValue =
    currentAssets;

  if (months > 0) {
    if (monthlyRate === 0) {
      futureValue =
        currentAssets +
        monthlyInvestment * months;
    } else {
      futureValue =
        currentAssets *
        Math.pow(
          1 + monthlyRate,
          months
        ) +
        monthlyInvestment *
        (
          (
            Math.pow(
              1 + monthlyRate,
              months
            ) - 1
          ) /
          monthlyRate
        );
    }
  }

  futureValue =
    Math.round(futureValue);

  // -------------------------------------------------------------------------
  // Withdrawal assumption
  // -------------------------------------------------------------------------

  const annualWithdrawalRate = 0.04;

  const monthlyIncomeDuringRetirement =
    Math.round(
      futureValue *
      annualWithdrawalRate /
      12
    );

  // -------------------------------------------------------------------------
  // Inflation-adjusted retirement target
  // -------------------------------------------------------------------------

  const futureMonthlyIncomeTarget =
    targetMonthlyIncome *
    Math.pow(
      1 + inflationRate,
      yearsRemaining
    );

  const targetRetirementCapital =
    futureMonthlyIncomeTarget *
    12 /
    annualWithdrawalRate;

  // -------------------------------------------------------------------------
  // Required contribution
  // -------------------------------------------------------------------------

  const requiredMonthlyContribution =
    calculateRequiredMonthlyContribution(
      targetRetirementCapital,
      currentAssets,
      yearsRemaining,
      input.annualReturnPct
    );

  // -------------------------------------------------------------------------
  // Scenario alternatives
  // -------------------------------------------------------------------------

  const scenarioReturns = [
    {
      label: "שמרני",
      annualReturnPct: 5
    },
    {
      label: "בסיס",
      annualReturnPct:
        input.annualReturnPct
    },
    {
      label: "צמיחה",
      annualReturnPct: 10
    }
  ];

  const scenarioAlternatives =
    scenarioReturns.map(
      scenario => {
        const rate =
          scenario.annualReturnPct /
          100 /
          12;

        let value =
          currentAssets;

        if (months > 0) {
          if (rate === 0) {
            value =
              currentAssets +
              monthlyInvestment *
              months;
          } else {
            value =
              currentAssets *
              Math.pow(
                1 + rate,
                months
              ) +
              monthlyInvestment *
              (
                (
                  Math.pow(
                    1 + rate,
                    months
                  ) - 1
                ) /
                rate
              );
          }
        }

        value =
          Math.round(value);

        return {
          label:
            scenario.label,
          annualReturnPct:
            scenario.annualReturnPct,
          futureValue:
            value,
          monthlyIncomeDuringRetirement:
            Math.round(
              value *
              annualWithdrawalRate /
              12
            )
        };
      }
    );

  // -------------------------------------------------------------------------
  // Educational progress indicator
  // -------------------------------------------------------------------------

  const probabilityOfSuccess =
    targetRetirementCapital > 0
      ? Math.round(
          Math.min(
            futureValue /
              targetRetirementCapital *
              100,
            100
          )
        )
      : 100;

  // -------------------------------------------------------------------------
  // Recommendations
  // -------------------------------------------------------------------------

  const recommendations: string[] = [];

  if (yearsRemaining >= 20) {
    recommendations.push(
      "אופק השקעה ארוך מאפשר לריבית דריבית להיות מנוע מרכזי בבניית ההון."
    );
  } else if (yearsRemaining > 0) {
    recommendations.push(
      "אופק ההשקעה משמעותי, ולכן עקביות בהפקדות יכולה להשפיע מהותית על התוצאה."
    );
  } else {
    recommendations.push(
      "יש לבחון מחדש את יעד הפרישה ואת מקורות ההכנסה הצפויים."
    );
  }

  if (
    monthlyInvestment <
    requiredMonthlyContribution
  ) {
    recommendations.push(
      "הגדלת ההפקדה החודשית עשויה לשפר את הסיכוי להגיע ליעד."
    );
  } else {
    recommendations.push(
      "רמת ההפקדה הנוכחית תואמת או עולה על ההפקדה המחושבת לפי ההנחות."
    );
  }

  recommendations.push(
    "התרחיש הוא הדמיה חינוכית המבוססת על תשואה והנחות אינפלציה ואינו מהווה הבטחת תשואה."
  );

  return {
    yearsRemaining,
    currentAssets,
    monthlyInvestment,
    futureValue,
    futureMonthlyIncomeTarget,
    targetRetirementCapital,
    requiredMonthlyContribution,
    monthlyIncomeDuringRetirement,
    probabilityOfSuccess,
    scenarioAlternatives,
    recommendations
  };
}