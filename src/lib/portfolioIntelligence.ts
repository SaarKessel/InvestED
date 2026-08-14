// ============================================================
// InvestED — Portfolio Intelligence Engine
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

  return Number.isFinite(
    Number(value)
  )
    ? Number(value)
    : fallback;

}

// ------------------------------------------------------------
// Calculate Portfolio Intelligence
// ------------------------------------------------------------

export function calculatePortfolioMetrics(
  allocation: AllocationItem[]
): PortfolioMetrics {

  const safeAllocation =
    Array.isArray(allocation)
      ? allocation
      : [];

  const normalized =
    safeAllocation.map(
      item => ({
        ...item,
        value: Math.max(
          0,
          safeNumber(item.value)
        )
      })
    );

  const largest =
    [...normalized]
      .sort(
        (a, b) =>
          b.value - a.value
      )[0];

  const equityExposure =
    normalized
      .filter(item => {

        const name =
          item.name
            .toLowerCase();

        return (
          name.includes("מניות") ||
          name.includes("מניה") ||
          name.includes("equity") ||
          name.includes("stock") ||
          name.includes("סקטור")
        );

      })
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

  let riskLevel:
    | "נמוך"
    | "בינוני"
    | "גבוה" =
      "בינוני";

  if (equityExposure >= 70) {
    riskLevel = "גבוה";
  }

  if (equityExposure <= 35) {
    riskLevel = "נמוך";
  }

  const diversificationScore =
    largest
      ? Math.max(
          0,
          100 - largest.value
        )
      : 0;

  let diversification =
    "נמוך";

  if (diversificationScore >= 75) {
    diversification = "גבוה";
  } else if (
    diversificationScore >= 50
  ) {
    diversification = "בינוני";
  }

  const volatilityEstimate =
    riskLevel === "גבוה"
      ? "תנודתיות צפויה גבוהה"
      : riskLevel === "נמוך"
        ? "תנודתיות צפויה נמוכה"
        : "תנודתיות צפויה בינונית";

  const explanation =
    `התיק כולל ${Math.round(equityExposure)}% חשיפה מנייתית ` +
    `ו-${Math.round(fixedIncomeExposure)}% בנכסים שאינם מנייתיים. ` +
    `רמת הפיזור החינוכית מסווגת כ-${diversification}.`;

  return {

    expectedReturn: 0,

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

    largestPositionWeight:
      Math.round(
        largest?.value ?? 0
      ),

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
    metrics.diversification === "גבוה" &&
    metrics.riskLevel !== "גבוה"
  ) {

    return "פיזור מאוזן";

  }

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

  return "מבנה תיק סביר";

}
