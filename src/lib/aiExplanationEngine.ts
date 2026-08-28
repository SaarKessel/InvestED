// ---------------------------------------------------------------------------
// InvestED — AI Explanation Engine v4
// Explainable Financial Insights Engine
//
// Purpose:
// - Explain why the analysis reached its conclusions
// - Connect investment horizon, asset class, growth and diversification
// - Keep explanations educational and deterministic
// - Preserve the existing AIInsight API
// ---------------------------------------------------------------------------

import type {
  FinancialScenario,
  ProjectionResult,
} from "@/lib/calculatorEngine";

import {
  ASSET_CLASSES,
} from "@/lib/calculatorEngine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AIInsight {
  headline: string;

  riskLevel: string;

  riskEmoji: string;

  horizonInsight: string;

  growthInsight: string;

  recommendation: string;

  confidence: number;

  diversificationInsight: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const ASSET_LABELS_EN: Record<string, string> = {
  sp500: "S&P 500 Index",
  world: "Global Index",
  nasdaq: "Nasdaq",
  bonds: "Bonds",
  balanced: "Balanced Portfolio",
};

function getAssetLabel(
  assetKey: string,
  language: "he" | "en" = "he"
): string {
  const asset =
    ASSET_CLASSES.find(
      item => item.key === assetKey
    );

  if (!asset) {
    return assetKey;
  }

  return language === "he"
    ? asset.label
    : (ASSET_LABELS_EN[assetKey] ?? asset.label);
}

// ---------------------------------------------------------------------------
// Horizon Explanation
// ---------------------------------------------------------------------------

function buildHorizonInsight(
  years: number,
  language: "he" | "en" = "he"
): string {

  if (years < 3) {

    return language === "he"
      ? "⏳ אופק השקעה קצר מאוד. " +
        "בטווח כזה לתנודתיות בשוק יכולה להיות השפעה משמעותית " +
        "על התוצאה בזמן שבו ייתכן שהכסף יידרש."
      : "⏳ Very short investment horizon. " +
        "Over such a period, market volatility can have a significant impact " +
        "on the outcome when the money may be needed.";

  }

  if (years < 5) {

    return language === "he"
      ? "⏳ אופק השקעה קצר יחסית. " +
        "הזמן שנותר לצבירת תשואה מוגבל יותר, ולכן חשוב לבחון " +
        "את הקשר בין רמת הסיכון לבין מועד השימוש בכסף."
      : "⏳ Relatively short horizon. " +
        "The time left to accumulate returns is more limited, so it's important to examine " +
        "the relationship between risk level and when the money will be used.";

  }

  if (years < 10) {

    return language === "he"
      ? "📊 אופק השקעה בינוני. " +
        "יש יותר זמן להתמודד עם תנודות שוק, אך עדיין חשוב " +
        "לבחון את רמת הסיכון ביחס למטרה ולמועד היעד."
      : "📊 Medium investment horizon. " +
        "There's more time to deal with market fluctuations, but it's still important to examine " +
        "risk level relative to the goal and target date.";

  }

  if (years < 15) {

    return language === "he"
      ? "📈 אופק השקעה בינוני-ארוך. " +
        "פרק זמן כזה מאפשר לתשואה מצטברת ולריבית דריבית " +
        "להפוך לגורם משמעותי בתוצאה."
      : "📈 Medium-to-long horizon. " +
        "Such a period allows compound returns and compound interest " +
        "to become a significant factor in the outcome.";

  }

  return language === "he"
    ? "🚀 אופק השקעה ארוך. " +
      "מספר רב של שנים מאפשר לריבית דריבית ולצבירת תשואה " +
      "להשפיע משמעותית על צמיחת ההון, תוך יכולה טובה יותר " +
      "להתמודד עם תנודתיות לאורך הדרך."
    : "🚀 Long investment horizon. " +
      "A large number of years allows compound interest and return accumulation " +
      "to significantly impact wealth growth, with better ability to cope with volatility along the way.";
}

// ---------------------------------------------------------------------------
// Risk Analysis
// ---------------------------------------------------------------------------

function buildRiskProfile(
  asset: string,
  years: number,
  language: "he" | "en" = "he"
): {
  riskLevel: string;
  riskEmoji: string;
} {

  if (
    asset === "bonds" ||
    asset === "cash"
  ) {

    return {
      riskLevel: language === "he" ? "נמוכה" : "Low",
      riskEmoji: "🟢",
    };

  }

  if (
    asset === "nasdaq"
  ) {

    return {
      riskLevel: language === "he" ? "גבוהה" : "High",
      riskEmoji: "🔴",
    };

  }

  if (
    asset === "sp500"
  ) {

    if (years >= 15) {

      return {
        riskLevel: language === "he" ? "בינונית-גבוהה" : "Medium-High",
        riskEmoji: "🟡",
      };

    }

    return {
      riskLevel: language === "he" ? "גבוהה" : "High",
      riskEmoji: "🟠",
    };

  }

  if (
    asset === "world"
  ) {

    return {
      riskLevel: language === "he"
        ? "בינונית-גבוהה"
        : "Medium-High",
      riskEmoji: "🟡",
    };

  }

  return {
    riskLevel: language === "he" ? "בינונית" : "Medium",
    riskEmoji: "🟡",
  };
}

// ---------------------------------------------------------------------------
// Growth Explanation
// ---------------------------------------------------------------------------

function buildGrowthInsight(
  projection: ProjectionResult,
  language: "he" | "en" = "he"
): string {

  const finalBalance =
    Math.max(
      projection.finalBalance,
      0
    );

  const growth =
    Math.max(
      projection.growth,
      0
    );

  const growthPercentage =
    Math.round(
      clamp(
        growth /
          finalBalance *
          100,
        0,
        100
      )
    );

  if (
    finalBalance <= 0 ||
    growth <= 0
  ) {

    return language === "he"
      ? "📊 בתרחיש הנוכחי עיקר התוצאה נובע מההון שהושקע " +
        "ולא מצמיחה שנצברה."
      : "📊 In the current scenario, the main result comes from the invested capital rather than from accumulated growth.";

  }

  return language === "he"
    ? `📈 מתוך השווי הסופי, כ-${growthPercentage}% ` +
      "נובע מהצמיחה שנצברה לאורך התקופה. " +
      "ככל שההשקעה נשארת לאורך זמן, הריבית דריבית יכולה " +
      "להפוך לחלק משמעותי יותר מהתוצאה."
    : `📈 Of the final value, approximately ${growthPercentage}% ` +
      "comes from investment growth over the period. " +
      "The longer the investment remains, the more compound interest can become " +
      "a more significant part of the outcome.";
}

// ---------------------------------------------------------------------------
// Diversification Explanation
// ---------------------------------------------------------------------------

function buildDiversificationInsight(
  asset: string,
  language: "he" | "en" = "he"
): string {

  if (
    asset === "world"
  ) {

    return language === "he"
      ? "🌎 הנכס מייצג פיזור גיאוגרפי רחב יותר בין שווקים. " +
        "פיזור כזה עשוי להפחית תלות בשוק או באזור גיאוגרפי יחיד."
      : "🌎 The asset represents broader geographic diversification across markets. " +
        "Such diversification may reduce dependence on a single market or geographic region.";

  }

  if (
    asset === "sp500"
  ) {

    return language === "he"
      ? "🇺🇸 החשיפה מתמקדת במניות של חברות אמריקאיות גדולות. " +
        "למרות שקיימת שונות בין החברות, עדיין קיימת תלות " +
        "משמעותית בביצועי שוק המניות האמריקאי."
      : "🇺🇸 The exposure is focused on large US companies. " +
        "While there is variation between companies, there is still significant dependence on the performance of the US stock market.";

  }

  if (
    asset === "nasdaq"
  ) {

    return language === "he"
      ? "💻 החשיפה ממוקדת יותר בחברות צמיחה וטכנולוגיה. " +
        "מיקוד כזה עשוי להגדיל את פוטנציאל הצמיחה, אך גם " +
        "את הרגישות לתנודתיות ולשינויים בתמחור."
      : "💻 The exposure is more focused on growth and technology companies. " +
        "Such focus may increase growth potential, but also sensitivity to volatility and pricing changes.";

  }

  if (
    asset === "bonds"
  ) {

    return language === "he"
      ? "🛡️ אג״ח נוטה לספק אופי הגנתי יותר מתיק מנייתי, " +
        "אך גם כאן קיימים סיכונים כגון שינויי ריבית, אשראי ואינפלציה."
      : "🛡️ Bonds tend to provide a more defensive character than a stock portfolio, " +
        "but there are still risks such as interest rate changes, credit, and inflation.";

  }

  if (
    asset === "cash"
  ) {

    return language === "he"
      ? "💰 מזומן מספק נזילות גבוהה ותנודתיות נמוכה, " +
        "אך לאורך זמן קיימת חשיפה לסיכון אינפלציה ולעלות האלטרנטיבית " +
        "של אי-השקעת ההון."
      : "💰 Cash provides high liquidity and low volatility, " +
        "but over time there is exposure to inflation risk and the alternative cost of not investing the capital.";

  }

  return language === "he"
    ? "🧩 רמת הפיזור תלויה במבנה הנכס ובנכסים נוספים בתיק. " +
      "המערכת בוחנת את הנכס כחלק מתמונה רחבה יותר ולא כנכס מבודד."
    : "🧩 The diversification level depends on the asset structure and additional assets in the portfolio. " +
      "The system examines the asset as part of a broader picture, not as an isolated asset.";
}

// ---------------------------------------------------------------------------
// Educational Recommendation
// ---------------------------------------------------------------------------

function buildRecommendation(
  asset: string,
  years: number,
  language: "he" | "en" = "he"
): string {

  if (years < 3) {

    return language === "he"
      ? "⚠️ באופק קצר מאוד, כדאי לתת משקל משמעותי לנזילות " +
        "וליכולת לספוג ירידה בשווי לפני מועד השימוש בכסף."
      : "⚠️ In a very short horizon, significant weight should be given to liquidity " +
        "and the ability to absorb a decline in value before the money is needed.";

  }

  if (years < 5) {

    return language === "he"
      ? "⚠️ באופק קצר יחסית, חשוב לבחון האם רמת התנודתיות " +
        "של הנכס מתאימה למועד שבו צפוי להידרש הכסף."
      : "⚠️ In a relatively short horizon, it's important to examine whether " +
        "the asset's volatility level is appropriate for when the money is expected to be needed.";

  }

  if (
    asset === "nasdaq"
  ) {

    return language === "he"
      ? "📊 בגלל ריכוז יחסי בחברות צמיחה וטכנולוגיה, " +
        "חשוב להבין שהתרחיש עשוי להיות רגיש יותר לתנודות שוק. " +
        "פיזור בין נכסים יכול לשנות את פרופיל הסיכון הכולל."
      : "📊 Due to the relative concentration in growth and technology companies, " +
        "it's important to understand that the scenario may be more sensitive to market fluctuations. " +
        "Diversification across assets can change the overall risk profile.";

  }

  if (
    asset === "sp500" &&
    years >= 15
  ) {

    return language === "he"
      ? "🚀 אופק ארוך יכול לאפשר למשקיע להתמודד עם תנודתיות " +
        "ולנצל את אפקט הריבית דריבית. עם זאת, התשואה בפועל אינה מובטחת."
      : "🚀 A long horizon can allow an investor to cope with volatility " +
        "and take advantage of compound interest. However, actual returns are not guaranteed.";

  }

  if (
    asset === "world"
  ) {

    return language === "he"
      ? "🌎 פיזור גיאוגרפי רחב יכול להפחית תלות באזור יחיד. " +
        "עם זאת, מדובר עדיין בחשיפה לשוקי מניות ולכן קיימת תנודתיות."
      : "🌎 Broad geographic diversification can reduce dependence on a single region. " +
        "However, this is still exposure to stock markets, so there is volatility.";

  }

  if (
    asset === "bonds"
  ) {

    return language === "he"
      ? "🛡️ אופי אג״חי עשוי להתאים לתרחישים שבהם יציבות יחסית " +
        "חשובה יותר ממקסום פוטנציאל הצמיחה, אך גם אג״ח אינו חסר סיכון."
      : "🛡️ The bond character may be suitable for scenarios where relative stability " +
        "is more important than maximizing growth potential, but bonds are not risk-free either.";

  }

  return language === "he"
    ? "🎯 כדאי לבחון את התרחיש ביחס למטרה, לאופק ההשקעה " +
      "וליכולת האישית להתמודד עם ירידות. המערכת מציגה הדמיה חינוכית " +
      "ולא תחזית לתשואה עתידית."
    : "🎯 It's advisable to examine the scenario in relation to the goal, investment horizon, " +
      "and personal ability to cope with declines. The system presents an educational illustration " +
      "and not a forecast of future returns.";
}

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

function normalizeConfidence(
  confidence: number
): number {

  if (
    !Number.isFinite(confidence)
  ) {
    return 0;
  }

  return Math.round(
    clamp(
      confidence,
      0,
      100
    )
  );
}

// ---------------------------------------------------------------------------
// Headline
// ---------------------------------------------------------------------------

function buildHeadline(
  years: number,
  assetLabel: string,
  language: "he" | "en" = "he"
): string {

  if (years <= 0) {

    return language === "he"
      ? `ניתוח AI: תרחיש השקעה ב${assetLabel}`
      : `AI Analysis: Investment in ${assetLabel}`;

  }

  return language === "he"
    ? `ניתוח AI: ${years} שנות השקעה ב${assetLabel}`
    : `AI Analysis: ${years} years of investment in ${assetLabel}`;
}

// ---------------------------------------------------------------------------
// Main Explainable AI Engine
// ---------------------------------------------------------------------------

export function generateAIInsight(
  scenario: FinancialScenario,
  projection: ProjectionResult,
  language: "he" | "en" = "he"
): AIInsight {

  const years =
    Math.max(
      Number.isFinite(scenario.years)
        ? scenario.years
        : 0,
      0
    );

  const asset =
    scenario.assetClassKey;

  const assetLabel =
    getAssetLabel(
      asset,
      language
    );

  // -------------------------------------------------------------------------
  // Risk
  // -------------------------------------------------------------------------

  const {
    riskLevel,
    riskEmoji,
  } =
    buildRiskProfile(
      asset,
      years,
      language
    );

  // -------------------------------------------------------------------------
  // Horizon
  // -------------------------------------------------------------------------

  const horizonInsight =
    buildHorizonInsight(
      years,
      language
    );

  // -------------------------------------------------------------------------
  // Growth
  // -------------------------------------------------------------------------

  const growthInsight =
    buildGrowthInsight(
      projection,
      language
    );

  // -------------------------------------------------------------------------
  // Diversification
  // -------------------------------------------------------------------------

  const diversificationInsight =
    buildDiversificationInsight(
      asset,
      language
    );

  // -------------------------------------------------------------------------
  // Educational Recommendation
  // -------------------------------------------------------------------------

  const recommendation =
    buildRecommendation(
      asset,
      years,
      language
    );

  // -------------------------------------------------------------------------
  // Confidence
  // -------------------------------------------------------------------------

  const confidence =
    normalizeConfidence(
      scenario.confidence
    );

  // -------------------------------------------------------------------------
  // Result
  // -------------------------------------------------------------------------

  return {

    headline:
      buildHeadline(
        years,
        assetLabel,
        language
      ),

    riskLevel,

    riskEmoji,

    horizonInsight,

    growthInsight,

    recommendation,

    confidence,

    diversificationInsight,

  };
}
