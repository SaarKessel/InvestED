// ============================================================
// InvestED — Portfolio Intelligence Engine v2
// Educational Portfolio Analytics Layer
// ============================================================

import type {
  AllocationItem,
  PortfolioMetrics,
} from "@/types";

import {
  clamp,
  safeNumber,
} from "@/lib/format";

// ------------------------------------------------------------
// Normalize Allocation
// ------------------------------------------------------------

function normalizeAllocation(
  allocation: AllocationItem[]
): AllocationItem[] {

  if (!Array.isArray(allocation)) {
    return [];
  }

  return allocation
    .map(item => ({
      ...item,
      value: clamp(
        safeNumber(item.value),
        0,
        100
      ),
    }))
    .filter(
      item => item.value > 0
    );

}

// ------------------------------------------------------------
// Asset Classification
// ------------------------------------------------------------

export function isEquityAsset(
  item: AllocationItem
): boolean {

  const name =
    String(
      item.name ?? ""
    ).toLowerCase();

  return (
    name.includes("מניות") ||
    name.includes("מניה") ||
    name.includes("equity") ||
    name.includes("stock") ||
    name.includes("s&p") ||
    name.includes("nasdaq") ||
    name.includes("sp500") ||
    name.includes("msci") ||
    name.includes("world") ||
    name.includes("מדד") ||
    name.includes("סקטור")
  );

}

export function calculateEquityExposure(
  allocation: AllocationItem[]
): number {

  const normalized =
    normalizeAllocation(
      allocation
    );

  const equityExposureRaw =
    normalized
      .filter(
        isEquityAsset
      )
      .reduce(
        (sum, item) =>
          sum + item.value,
        0
      );

  return Math.round(
    clamp(
      equityExposureRaw,
      0,
      100
    )
  );

}

export function calculateFixedIncomeExposure(
  allocation: AllocationItem[]
): number {

  const equityExposure =
    calculateEquityExposure(
      allocation
    );

  return Math.round(
    clamp(
      100 - equityExposure,
      0,
      100
    )
  );

}

// ------------------------------------------------------------
// Estimate Expected Return
// ------------------------------------------------------------

function estimateExpectedReturn(
  allocation: AllocationItem[]
): number {

  if (
    allocation.length === 0
  ) {
    return 0;
  }

  /*
   * Educational long-term nominal return assumptions.
   * These are NOT forecasts and are intentionally conservative.
   */

  const equityReturn = 7;
  const fixedIncomeReturn = 3;

  const equityExposure =
    allocation
      .filter(isEquityAsset)
      .reduce(
        (sum, item) =>
          sum + item.value,
        0
      );

  const fixedIncomeExposure =
    Math.max(
      0,
      100 - equityExposure
    );

  const weightedReturn =
    (
      equityExposure *
      equityReturn +
      fixedIncomeExposure *
      fixedIncomeReturn
    ) / 100;

  return Math.round(
    weightedReturn * 10
  ) / 10;

}

// ------------------------------------------------------------
// Calculate Diversification Score
// ------------------------------------------------------------

function calculateDiversificationScore(
  allocation: AllocationItem[]
): number {

  if (
    allocation.length === 0
  ) {
    return 0;
  }

  const total =
    allocation.reduce(
      (sum, item) =>
        sum + item.value,
      0
    );

  if (total <= 0) {
    return 0;
  }

  /*
   * Herfindahl-style concentration measure.
   *
   * Lower concentration = better diversification.
   */

  const concentration =
    allocation.reduce(
      (sum, item) => {

        const weight =
          item.value / total;

        return sum + weight * weight;

      },
      0
    );

  const score =
    (1 - concentration) * 100;

  return Math.round(
    clamp(score, 0, 100)
  );

}

// ------------------------------------------------------------
// Calculate Portfolio Intelligence
// ------------------------------------------------------------

export function calculatePortfolioMetrics(
  allocation: AllocationItem[]
): PortfolioMetrics {

  const normalized =
    normalizeAllocation(
      allocation
    );

  const largest =
    [...normalized]
      .sort(
        (a, b) =>
          b.value - a.value
      )[0];

  const equityExposure =
    calculateEquityExposure(
      normalized
    );

  /*
   * Keep the result bounded.
   *
   * If allocation does not add up to exactly 100,
   * we still avoid returning impossible percentages.
   */

  const fixedIncomeExposure =
    calculateFixedIncomeExposure(
      normalized
    );

  // ----------------------------------------------------------
  // Risk Classification
  // ----------------------------------------------------------

  let riskLevel:
    | "low"
    | "medium"
    | "high" =
      "medium";

  if (
    equityExposure >= 75
  ) {

    riskLevel = "high";

  }

  else if (
    equityExposure <= 35
  ) {

    riskLevel = "low";

  }

  // ----------------------------------------------------------
  // Diversification
  // ----------------------------------------------------------

  const diversificationScore =
    calculateDiversificationScore(
      normalized
    );

  let diversification =
    "low";

  if (
    diversificationScore >= 70
  ) {

    diversification = "high";

  }

  else if (
    diversificationScore >= 45
  ) {

    diversification = "medium";

  }

  // ----------------------------------------------------------
  // Volatility Estimate
  // ----------------------------------------------------------

  let volatilityEstimate =
    "Expected moderate volatility.";

  if (
    riskLevel === "high"
  ) {

    volatilityEstimate =
      "Expected high volatility.";

  }

  else if (
    riskLevel === "low"
  ) {

    volatilityEstimate =
      "Expected low volatility.";

  }

  // ----------------------------------------------------------
  // Expected Return
  // ----------------------------------------------------------

  const expectedReturn =
    estimateExpectedReturn(
      normalized
    );

  // ----------------------------------------------------------
  // Concentration
  // ----------------------------------------------------------

  const largestPositionWeight =
    Math.round(
      largest?.value ?? 0
    );

  // ----------------------------------------------------------
  // Portfolio Explanation
  // ----------------------------------------------------------

  let explanation =
    "Insufficient asset allocation for analysis.";

  if (
    normalized.length > 0
  ) {

    explanation =
      `The portfolio has approximately ${Math.round(
        equityExposure
      )}% equity exposure and ${Math.round(
        fixedIncomeExposure
      )}% non-equity assets. ` +
      `The educational diversification score is ${diversification}.`;

    if (
      largest &&
      largestPositionWeight >= 60
    ) {

      explanation +=
        ` There is also relatively high concentration in the main position (${largest.name}), ` +
        `accounting for approximately ${largestPositionWeight}% of the portfolio.`;

    }

  }

  // ----------------------------------------------------------
  // Return
  // ----------------------------------------------------------

  return {

    expectedReturn,

    riskLevel,

    volatilityEstimate,

    diversification,

    equityExposure:
      Math.round(
        equityExposure
      ),

    fixedIncomeExposure:
      Math.round(
        fixedIncomeExposure
      ),

    largestPosition:
      largest?.name ?? "-",

    largestPositionWeight,

    explanation

  };

}

// ------------------------------------------------------------
// Educational Portfolio Health
// ------------------------------------------------------------

export function portfolioHealthLabel(
  metrics: PortfolioMetrics
): string {

  if (
    metrics.largestPositionWeight >= 70
  ) {

    return "High concentration";

  }

  if (
    metrics.equityExposure >= 80
  ) {

    return "High equity exposure";

  }

  if (
    metrics.diversification === "high" &&
    metrics.riskLevel !== "high"
  ) {

    return "Balanced diversification";

  }

  if (
    metrics.diversification === "medium"
  ) {

    return "Medium diversification";

  }

  return "Reasonable portfolio structure";

}
