import type {
  AllocationItem,
  InvestorType,
  ProfileFlags,
} from "@/types";

// ---------------------------------------------------------------------------
// InvestED — Portfolio Engine v2
// Educational Portfolio Allocation Layer
//
// IMPORTANT:
// This engine creates educational example allocations only.
// It does not provide investment advice.
// ---------------------------------------------------------------------------

const COLORS = {
  us: "#22b17d",
  intl: "#3ecfff",
  dividend: "#f9c74f",
  bonds: "#f97066",
  cash: "#9c8cf7",
  sector: "#5eead4",
};

type RawAllocation = Record<string, number>;

// ---------------------------------------------------------------------------
// Base Portfolio Templates
// ---------------------------------------------------------------------------

const BASE_TEMPLATES: Record<
  InvestorType,
  RawAllocation
> = {

  "conservative": {
    "US Stocks (ETF)": 20,
    "International Stocks (ETF)": 5,
    "Dividend (ETF)": 10,
    "Bonds (ETF)": 55,
    "Cash": 10,
  },

  "dividend": {
    "US Stocks (ETF)": 25,
    "International Stocks (ETF)": 10,
    "Dividend (ETF)": 40,
    "Bonds (ETF)": 20,
    "Cash": 5,
  },

  "balanced": {
    "US Stocks (ETF)": 40,
    "International Stocks (ETF)": 20,
    "Dividend (ETF)": 15,
    "Bonds (ETF)": 20,
    "Cash": 5,
  },

  "value": {
    "US Stocks (ETF)": 35,
    "International Stocks (ETF)": 15,
    "Dividend (ETF)": 25,
    "Bonds (ETF)": 20,
    "Cash": 5,
  },

  "passive": {
    "US Stocks (ETF)": 50,
    "International Stocks (ETF)": 25,
    "Dividend (ETF)": 5,
    "Bonds (ETF)": 15,
    "Cash": 5,
  },

  "growth": {
    "US Stocks (ETF)": 55,
    "International Stocks (ETF)": 20,
    "Dividend (ETF)": 5,
    "Bonds (ETF)": 15,
    "Cash": 5,
  },

};

// ---------------------------------------------------------------------------
// Color Mapping
// ---------------------------------------------------------------------------

function colorFor(
  name: string
): string {

  if (
    name.includes("US Stocks")
  ) {
    return COLORS.us;
  }

  if (
    name.includes("International")
  ) {
    return COLORS.intl;
  }

  if (
    name.includes("Dividend")
  ) {
    return COLORS.dividend;
  }

  if (
    name.includes("Bonds")
  ) {
    return COLORS.bonds;
  }

  if (
    name.includes("Cash")
  ) {
    return COLORS.cash;
  }

  return COLORS.sector;
}

// ---------------------------------------------------------------------------
// Normalize Allocation
// ---------------------------------------------------------------------------

function renormalize(
  raw: RawAllocation
): RawAllocation {

  const entries =
    Object.entries(raw)
      .filter(
        ([, value]) =>
          Number.isFinite(value) &&
          value > 0
      );

  if (
    entries.length === 0
  ) {
    return {};
  }

  const total =
    entries.reduce(
      (sum, [, value]) =>
        sum + value,
      0
    );

  if (
    total <= 0
  ) {
    return {};
  }

  const scaled: RawAllocation = {};

  entries.forEach(
    ([key, value]) => {

      scaled[key] =
        (value / total) * 100;

    }
  );

  const rounded: RawAllocation = {};

  Object.entries(scaled).forEach(
    ([key, value]) => {

      rounded[key] =
        Math.round(value);

    }
  );

  const roundedTotal =
    Object.values(rounded).reduce(
      (sum, value) =>
        sum + value,
      0
    );

  const difference =
    100 - roundedTotal;

  if (
    difference !== 0
  ) {

    const biggestEntry =
      Object.entries(rounded)
        .sort(
          ([, a], [, b]) =>
            b - a
        )[0];

    if (biggestEntry) {

      const [
        biggestKey
      ] = biggestEntry;

      rounded[biggestKey] +=
        difference;

    }

  }

  return Object.fromEntries(
    Object.entries(rounded)
      .filter(
        ([, value]) =>
          value > 0
      )
  );

}

// ---------------------------------------------------------------------------
// Profile-Based Adjustment
// ---------------------------------------------------------------------------

function adjustByProfile(
  allocation: RawAllocation,
  flags: ProfileFlags
): RawAllocation {

  const result = {
    ...allocation,
  };

  const age =
    flags.age;

  // -------------------------------------------------------------------------
  // Younger investor + long horizon
  // Educationally increases equity exposure.
  // -------------------------------------------------------------------------

  if (
    age !== null &&
    age < 35 &&
    flags.horizon === "long"
  ) {

    const bonds =
      result["Bonds (ETF)"] ?? 0;

    const shift =
      Math.min(
        10,
        bonds
      );

    result["Bonds (ETF)"] =
      bonds - shift;

    result["US Stocks (ETF)"] =
      (
        result["US Stocks (ETF)"] ?? 0
      ) + shift;

  }

  // -------------------------------------------------------------------------
  // Older investor OR short horizon
  // Educationally shifts some equity exposure toward bonds.
  // -------------------------------------------------------------------------

  if (
    (
      age !== null &&
      age > 55
    ) ||
    flags.horizon === "short"
  ) {

    const stocks =
      result["US Stocks (ETF)"] ?? 0;

    const shift =
      Math.min(
        15,
        stocks
      );

    result["US Stocks (ETF)"] =
      stocks - shift;

    result["Bonds (ETF)"] =
      (
        result["Bonds (ETF)"] ?? 0
      ) + shift;

  }

  return result;

}

// ---------------------------------------------------------------------------
// Build Educational Allocation
// ---------------------------------------------------------------------------

export function buildAllocation(
  investorType: InvestorType,
  flags: ProfileFlags
): AllocationItem[] {

  let allocation: RawAllocation = {
    ...(
      BASE_TEMPLATES[investorType] ??
      BASE_TEMPLATES["balanced"]
    ),
  };

  const preferences =
    new Set(
      flags.preferences
    );

  // -------------------------------------------------------------------------
  // Dividend Preference
  // -------------------------------------------------------------------------

  if (
    preferences.has("dividend")
  ) {

    const usAllocation =
      allocation["US Stocks (ETF)"] ?? 0;

    const shift =
      Math.min(
        10,
        usAllocation
      );

    allocation["US Stocks (ETF)"] =
      usAllocation - shift;

    allocation["Dividend (ETF)"] =
      (
        allocation["Dividend (ETF)"] ?? 0
      ) + shift;

  }

  // -------------------------------------------------------------------------
  // Bond Preference
  // -------------------------------------------------------------------------

  if (
    preferences.has("bonds")
  ) {

    const cash =
      allocation["Cash"] ?? 0;

    /*
     * Shift only what is actually removed from cash.
     *
     * Previous implementation could add more to bonds
     * than it removed from cash before normalization.
     */

    const shift =
      Math.min(
        10,
        cash
      );

    allocation["Cash"] =
      cash - shift;

    allocation["Bonds (ETF)"] =
      (
        allocation["Bonds (ETF)"] ?? 0
      ) + shift;

  }

  // -------------------------------------------------------------------------
  // Sector Interests
  // -------------------------------------------------------------------------

  const sectorInterests =
    flags.interests.filter(
      interest =>
        interest === "technology" ||
        interest === "healthcare"
    );

  if (
    sectorInterests.length > 0
  ) {

    const usAllocation =
      allocation["US Stocks (ETF)"] ?? 0;

    /*
     * Keep the sector allocation educationally
     * bounded so it cannot dominate the portfolio.
     */

    const carve =
      Math.min(
        15,
        usAllocation * 0.4
      );

    allocation["US Stocks (ETF)"] =
      usAllocation - carve;

    const label =
      `Sector funds (${sectorInterests.join("/")})`;

    allocation[label] =
      (
        allocation[label] ?? 0
      ) + carve;

  }

  // -------------------------------------------------------------------------
  // Age + Horizon Adjustment
  // -------------------------------------------------------------------------

  allocation =
    adjustByProfile(
      allocation,
      flags
    );

  // -------------------------------------------------------------------------
  // Final Normalization
  // -------------------------------------------------------------------------

  const normalized =
    renormalize(
      allocation
    );

  return Object.entries(
    normalized
  ).map(
    ([name, value]) => ({

      name,

      value,

      color:
        colorFor(name),

    })
  );

}

// ---------------------------------------------------------------------------
// Portfolio Narrative
// ---------------------------------------------------------------------------

export function portfolioNarrative(
  investorType: InvestorType,
  allocation: AllocationItem[]
): string {

  if (
    !allocation.length
  ) {

    return (
      "No asset allocation to display. " +
      "The system was unable to build an educational portfolio from the provided data."
    );

  }

  const sorted =
    [...allocation]
      .sort(
        (a, b) =>
          b.value - a.value
      );

  const top =
    sorted[0];

  if (!top) {

    return (
      "Insufficient allocation to generate an explanation."
    );

  }

  const parts: string[] = [

    `The example allocation reflects a "${investorType}" profile.`,

    `The largest component is ${top.name} (${Math.round(
      top.value
    )}%), so it significantly influences the risk and return characteristics of the portfolio.`,

  ];

  // -------------------------------------------------------------------------
  // Bonds
  // -------------------------------------------------------------------------

  const bonds =
    allocation.find(
      item =>
        item.name.includes("Bonds")
    );

  if (
    bonds &&
    bonds.value >= 25
  ) {

    parts.push(
      "The bonds component forms a significant part of the portfolio and gives it a more defensive character."
    );

  }

  // -------------------------------------------------------------------------
  // International Diversification
  // -------------------------------------------------------------------------

  const international =
    allocation.find(
      item =>
        item.name.includes("International")
    );

  if (
    international &&
    international.value >= 15
  ) {

    parts.push(
      "The international component adds geographic diversification and reduces dependence on a single market."
    );

  }

  // -------------------------------------------------------------------------
  // Sector Exposure
  // -------------------------------------------------------------------------

  const sector =
    allocation.find(
      item =>
        item.name.includes("Sector")
    );

  if (
    sector &&
    sector.value >= 5
  ) {

    parts.push(
      "There is also sector exposure, which can increase concentration in specific industries."
    );

  }

  // -------------------------------------------------------------------------
  // Educational Disclaimer
  // -------------------------------------------------------------------------

  parts.push(
    "This is an educational illustration only and does not constitute an investment recommendation."
  );

  return parts.join(" ");

}
