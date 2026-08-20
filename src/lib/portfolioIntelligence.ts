// ============================================================
// InvestED — Portfolio Intelligence Engine v2
// Educational Portfolio Analytics Layer
// ============================================================

import type {
  AllocationItem,
  PortfolioMetrics,
} from "@/types";

// ------------------------------------------------------------
// Safe Number
// ------------------------------------------------------------

function safeNumber(
  value: unknown,
  fallback = 0
): number {

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;

}

// ------------------------------------------------------------
// Clamp
// ------------------------------------------------------------

function clamp(
  value: number,
  min: number,
  max: number
): number {

  return Math.min(
    Math.max(value, min),
    max
  );

}

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

function isEquityAsset(
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

  /*
   * Keep the result bounded.
   *
   * If allocation does not add up to exactly 100,
   * we still avoid returning impossible percentages.
   */

  const equityExposure =
    clamp(
      equityExposureRaw,
      0,
      100
    );

  const fixedIncomeExposure =
    clamp(
      100 - equityExposure,
      0,
      100
    );

  // ----------------------------------------------------------
  // Risk Classification
  // ----------------------------------------------------------

  let riskLevel:
    | "נמוך"
    | "בינוני"
    | "גבוה" =
      "בינוני";

  if (
    equityExposure >= 75
  ) {

    riskLevel = "גבוה";

  }

  else if (
    equityExposure <= 35
  ) {

    riskLevel = "נמוך";

  }

  // ----------------------------------------------------------
  // Diversification
  // ----------------------------------------------------------

  const diversificationScore =
    calculateDiversificationScore(
      normalized
    );

  let diversification =
    "נמוך";

  if (
    diversificationScore >= 70
  ) {

    diversification = "גבוה";

  }

  else if (
    diversificationScore >= 45
  ) {

    diversification = "בינוני";

  }

  // ----------------------------------------------------------
  // Volatility Estimate
  // ----------------------------------------------------------

  let volatilityEstimate =
    "תנודתיות צפויה בינונית";

  if (
    riskLevel === "גבוה"
  ) {

    volatilityEstimate =
      "תנודתיות צפויה גבוהה";

  }

  else if (
    riskLevel === "נמוך"
  ) {

    volatilityEstimate =
      "תנודתיות צפויה נמוכה";

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
    "לא נמצאה הקצאת נכסים מספקת לניתוח.";

  if (
    normalized.length > 0
  ) {

    explanation =
      `התיק כולל כ-${Math.round(
        equityExposure
      )}% חשיפה מנייתית ו-${Math.round(
        fixedIncomeExposure
      )}% בנכסים שאינם מנייתיים. ` +
      `רמת הפיזור החינוכית מסווגת כ-${diversification}.`;

    if (
      largest &&
      largestPositionWeight >= 60
    ) {

      explanation +=
        ` קיימת גם ריכוזיות יחסית גבוהה בנכס המרכזי (${largest.name}), ` +
        `המהווה כ-${largestPositionWeight}% מהתיק.`;

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

    return "ריכוזיות גבוהה";

  }

  if (
    metrics.equityExposure >= 80
  ) {

    return "חשיפה מנייתית גבוהה";

  }

  if (
    metrics.diversification === "גבוה" &&
    metrics.riskLevel !== "גבוה"
  ) {

    return "פיזור מאוזן";

  }

  if (
    metrics.diversification === "בינוני"
  ) {

    return "פיזור בינוני";

  }

  return "מבנה תיק סביר";

}
