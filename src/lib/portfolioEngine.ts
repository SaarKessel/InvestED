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

  "משקיע שמרני": {
    "מניות ארה\"ב (ETF)": 20,
    "מניות בינלאומיות (ETF)": 5,
    "דיבידנד (ETF)": 10,
    "אג\"ח (ETF)": 55,
    "מזומן": 10,
  },

  "משקיע דיבידנדים": {
    "מניות ארה\"ב (ETF)": 25,
    "מניות בינלאומיות (ETF)": 10,
    "דיבידנד (ETF)": 40,
    "אג\"ח (ETF)": 20,
    "מזומן": 5,
  },

  "משקיע מאוזן": {
    "מניות ארה\"ב (ETF)": 40,
    "מניות בינלאומיות (ETF)": 20,
    "דיבידנד (ETF)": 15,
    "אג\"ח (ETF)": 20,
    "מזומן": 5,
  },

  "משקיע ערך": {
    "מניות ארה\"ב (ETF)": 35,
    "מניות בינלאומיות (ETF)": 15,
    "דיבידנד (ETF)": 25,
    "אג\"ח (ETF)": 20,
    "מזומן": 5,
  },

  "משקיע פסיבי": {
    "מניות ארה\"ב (ETF)": 50,
    "מניות בינלאומיות (ETF)": 25,
    "דיבידנד (ETF)": 5,
    "אג\"ח (ETF)": 15,
    "מזומן": 5,
  },

  "משקיע צמיחה": {
    "מניות ארה\"ב (ETF)": 55,
    "מניות בינלאומיות (ETF)": 20,
    "דיבידנד (ETF)": 5,
    "אג\"ח (ETF)": 15,
    "מזומן": 5,
  },

};

// ---------------------------------------------------------------------------
// Color Mapping
// ---------------------------------------------------------------------------

function colorFor(
  name: string
): string {

  if (
    name.includes("ארה\"ב")
  ) {
    return COLORS.us;
  }

  if (
    name.includes("בינלאומ")
  ) {
    return COLORS.intl;
  }

  if (
    name.includes("דיבידנד")
  ) {
    return COLORS.dividend;
  }

  if (
    name.includes("אג\"ח")
  ) {
    return COLORS.bonds;
  }

  if (
    name.includes("מזומן")
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
      result["אג\"ח (ETF)"] ?? 0;

    const shift =
      Math.min(
        10,
        bonds
      );

    result["אג\"ח (ETF)"] =
      bonds - shift;

    result["מניות ארה\"ב (ETF)"] =
      (
        result["מניות ארה\"ב (ETF)"] ?? 0
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
      result["מניות ארה\"ב (ETF)"] ?? 0;

    const shift =
      Math.min(
        15,
        stocks
      );

    result["מניות ארה\"ב (ETF)"] =
      stocks - shift;

    result["אג\"ח (ETF)"] =
      (
        result["אג\"ח (ETF)"] ?? 0
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
      BASE_TEMPLATES["משקיע מאוזן"]
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
      allocation["מניות ארה\"ב (ETF)"] ?? 0;

    const shift =
      Math.min(
        10,
        usAllocation
      );

    allocation["מניות ארה\"ב (ETF)"] =
      usAllocation - shift;

    allocation["דיבידנד (ETF)"] =
      (
        allocation["דיבידנד (ETF)"] ?? 0
      ) + shift;

  }

  // -------------------------------------------------------------------------
  // Bond Preference
  // -------------------------------------------------------------------------

  if (
    preferences.has("bonds")
  ) {

    const cash =
      allocation["מזומן"] ?? 0;

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

    allocation["מזומן"] =
      cash - shift;

    allocation["אג\"ח (ETF)"] =
      (
        allocation["אג\"ח (ETF)"] ?? 0
      ) + shift;

  }

  // -------------------------------------------------------------------------
  // Sector Interests
  // -------------------------------------------------------------------------

  const sectorInterests =
    flags.interests.filter(
      interest =>
        interest === "טכנולוגיה" ||
        interest === "בריאות"
    );

  if (
    sectorInterests.length > 0
  ) {

    const usAllocation =
      allocation["מניות ארה\"ב (ETF)"] ?? 0;

    /*
     * Keep the sector allocation educationally
     * bounded so it cannot dominate the portfolio.
     */

    const carve =
      Math.min(
        15,
        usAllocation * 0.4
      );

    allocation["מניות ארה\"ב (ETF)"] =
      usAllocation - carve;

    const label =
      `קרנות סקטוריאליות (${sectorInterests.join("/")})`;

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
      "לא קיימת הקצאת נכסים להצגה. " +
      "המערכת לא הצליחה לבנות תיק חינוכי מהנתונים שסופקו."
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
      "לא קיימת הקצאת נכסים מספקת ליצירת הסבר."
    );

  }

  const parts: string[] = [

    `ההקצאה לדוגמה משקפת פרופיל של "${investorType}".`,

    `הרכיב הגדול ביותר הוא ${top.name} (${Math.round(
      top.value
    )}%), ולכן הוא משפיע משמעותית על מאפייני הסיכון והתשואה של התיק.`,

  ];

  // -------------------------------------------------------------------------
  // Bonds
  // -------------------------------------------------------------------------

  const bonds =
    allocation.find(
      item =>
        item.name.includes("אג\"ח")
    );

  if (
    bonds &&
    bonds.value >= 25
  ) {

    parts.push(
      "רכיב האג\"ח מהווה חלק משמעותי מהתיק ומעניק לו אופי הגנתי יותר."
    );

  }

  // -------------------------------------------------------------------------
  // International Diversification
  // -------------------------------------------------------------------------

  const international =
    allocation.find(
      item =>
        item.name.includes("בינלאומ")
    );

  if (
    international &&
    international.value >= 15
  ) {

    parts.push(
      "הרכיב הבינלאומי מוסיף פיזור גאוגרפי ומפחית תלות בשוק יחיד."
    );

  }

  // -------------------------------------------------------------------------
  // Sector Exposure
  // -------------------------------------------------------------------------

  const sector =
    allocation.find(
      item =>
        item.name.includes("סקטוריאל")
    );

  if (
    sector &&
    sector.value >= 5
  ) {

    parts.push(
      "קיימת גם חשיפה סקטוריאלית, אשר יכולה להגדיל את הריכוזיות בענפים מסוימים."
    );

  }

  // -------------------------------------------------------------------------
  // Educational Disclaimer
  // -------------------------------------------------------------------------

  parts.push(
    "זוהי המחשה חינוכית בלבד ואינה מהווה המלצת השקעה."
  );

  return parts.join(" ");

}
