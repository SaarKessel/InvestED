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

function getAssetLabel(
  assetKey: string
): string {
  return (
    ASSET_CLASSES.find(
      asset => asset.key === assetKey
    )?.label ?? assetKey
  );
}

// ---------------------------------------------------------------------------
// Horizon Explanation
// ---------------------------------------------------------------------------

function buildHorizonInsight(
  years: number
): string {

  if (years < 3) {

    return (
      "⏳ אופק השקעה קצר מאוד. " +
      "בטווח כזה לתנודתיות בשוק יכולה להיות השפעה משמעותית " +
      "על התוצאה בזמן שבו ייתכן שהכסף יידרש."
    );

  }

  if (years < 5) {

    return (
      "⏳ אופק השקעה קצר יחסית. " +
      "הזמן שנותר לצבירת תשואה מוגבל יותר, ולכן חשוב לבחון " +
      "את הקשר בין רמת הסיכון לבין מועד השימוש בכסף."
    );

  }

  if (years < 10) {

    return (
      "📊 אופק השקעה בינוני. " +
      "יש יותר זמן להתמודד עם תנודות שוק, אך עדיין חשוב " +
      "לבחון את רמת הסיכון ביחס למטרה ולמועד היעד."
    );

  }

  if (years < 15) {

    return (
      "📈 אופק השקעה בינוני-ארוך. " +
      "פרק זמן כזה מאפשר לתשואה מצטברת ולריבית דריבית " +
      "להפוך לגורם משמעותי בתוצאה."
    );

  }

  return (
    "🚀 אופק השקעה ארוך. " +
    "מספר רב של שנים מאפשר לריבית דריבית ולצבירת תשואה " +
    "להשפיע משמעותית על צמיחת ההון, תוך יכולת טובה יותר " +
    "להתמודד עם תנודתיות לאורך הדרך."
  );
}

// ---------------------------------------------------------------------------
// Risk Analysis
// ---------------------------------------------------------------------------

function buildRiskProfile(
  asset: string,
  years: number
): {
  riskLevel: string;
  riskEmoji: string;
} {

  // Defensive assets

  if (
    asset === "bonds" ||
    asset === "cash"
  ) {

    return {
      riskLevel: "נמוכה",
      riskEmoji: "🟢",
    };

  }

  // Higher volatility assets

  if (
    asset === "nasdaq"
  ) {

    return {
      riskLevel: "גבוהה",
      riskEmoji: "🔴",
    };

  }

  // Broad equity exposure

  if (
    asset === "sp500"
  ) {

    if (years >= 15) {

      return {
        riskLevel: "בינונית-גבוהה",
        riskEmoji: "🟡",
      };

    }

    return {
      riskLevel: "גבוהה",
      riskEmoji: "🟠",
    };

  }

  // Globally diversified equity

  if (
    asset === "world"
  ) {

    return {
      riskLevel:
        years >= 10
          ? "בינונית-גבוהה"
          : "גבוהה",

      riskEmoji: "🟡",
    };

  }

  // Balanced / unknown assets

  return {
    riskLevel: "בינונית",
    riskEmoji: "🟡",
  };
}

// ---------------------------------------------------------------------------
// Growth Explanation
// ---------------------------------------------------------------------------

function buildGrowthInsight(
  projection: ProjectionResult
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

  if (
    finalBalance <= 0 ||
    growth <= 0
  ) {

    return (
      "📊 בתרחיש הנוכחי עיקר התוצאה נובע מההון שהושקע " +
      "ולא מצמיחה שנצברה."
    );

  }

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

  return (
    `📈 מתוך השווי הסופי, כ-${growthPercentage}% ` +
    "נובע מהצמיחה שנצברה לאורך התקופה. " +
    "ככל שההשקעה נשארת לאורך זמן, הריבית דריבית יכולה " +
    "להפוך לחלק משמעותי יותר מהתוצאה."
  );
}

// ---------------------------------------------------------------------------
// Diversification Explanation
// ---------------------------------------------------------------------------

function buildDiversificationInsight(
  asset: string
): string {

  if (
    asset === "world"
  ) {

    return (
      "🌎 הנכס מייצג פיזור גיאוגרפי רחב יותר בין שווקים. " +
      "פיזור כזה עשוי להפחית תלות בשוק או באזור גיאוגרפי יחיד."
    );

  }

  if (
    asset === "sp500"
  ) {

    return (
      "🇺🇸 החשיפה מתמקדת במניות של חברות אמריקאיות גדולות. " +
      "למרות שקיימת שונות בין החברות, עדיין קיימת תלות " +
      "משמעותית בביצועי שוק המניות האמריקאי."
    );

  }

  if (
    asset === "nasdaq"
  ) {

    return (
      "💻 החשיפה ממוקדת יותר בחברות צמיחה וטכנולוגיה. " +
      "מיקוד כזה עשוי להגדיל את פוטנציאל הצמיחה, אך גם " +
      "את הרגישות לתנודתיות ולשינויים בתמחור."
    );

  }

  if (
    asset === "bonds"
  ) {

    return (
      "🛡️ אג״ח נוטה לספק אופי הגנתי יותר מתיק מנייתי, " +
      "אך גם כאן קיימים סיכונים כגון שינויי ריבית, אשראי ואינפלציה."
    );

  }

  if (
    asset === "cash"
  ) {

    return (
      "💰 מזומן מספק נזילות גבוהה ותנודתיות נמוכה, " +
      "אך לאורך זמן קיימת חשיפה לסיכון אינפלציה ולעלות האלטרנטיבית " +
      "של אי-השקעת ההון."
    );

  }

  return (
    "🧩 רמת הפיזור תלויה במבנה הנכס ובנכסים נוספים בתיק. " +
    "המערכת בוחנת את הנכס כחלק מתמונה רחבה יותר ולא כנכס מבודד."
  );
}

// ---------------------------------------------------------------------------
// Educational Recommendation
// ---------------------------------------------------------------------------

function buildRecommendation(
  asset: string,
  years: number
): string {

  if (years < 3) {

    return (
      "⚠️ באופק קצר מאוד, כדאי לתת משקל משמעותי לנזילות " +
      "וליכולת לספוג ירידה בשווי לפני מועד השימוש בכסף."
    );

  }

  if (years < 5) {

    return (
      "⚠️ באופק קצר יחסית, חשוב לבחון האם רמת התנודתיות " +
      "של הנכס מתאימה למועד שבו צפוי להידרש הכסף."
    );

  }

  if (
    asset === "nasdaq"
  ) {

    return (
      "📊 בגלל ריכוז יחסי בחברות צמיחה וטכנולוגיה, " +
      "חשוב להבין שהתרחיש עשוי להיות רגיש יותר לתנודות שוק. " +
      "פיזור בין נכסים יכול לשנות את פרופיל הסיכון הכולל."
    );

  }

  if (
    asset === "sp500" &&
    years >= 15
  ) {

    return (
      "🚀 אופק ארוך יכול לאפשר למשקיע להתמודד עם תנודתיות " +
      "ולנצל את אפקט הריבית דריבית. עם זאת, התשואה בפועל אינה מובטחת."
    );

  }

  if (
    asset === "world"
  ) {

    return (
      "🌎 פיזור גיאוגרפי רחב יכול להפחית תלות באזור יחיד. " +
      "עם זאת, מדובר עדיין בחשיפה לשוקי מניות ולכן קיימת תנודתיות."
    );

  }

  if (
    asset === "bonds"
  ) {

    return (
      "🛡️ אופי אג״חי עשוי להתאים לתרחישים שבהם יציבות יחסית " +
      "חשובה יותר ממקסום פוטנציאל הצמיחה, אך גם אג״ח אינו חסר סיכון."
    );

  }

  return (
    "🎯 כדאי לבחון את התרחיש ביחס למטרה, לאופק ההשקעה " +
    "וליכולת האישית להתמודד עם ירידות. המערכת מציגה הדמיה חינוכית " +
    "ולא תחזית לתשואה עתידית."
  );
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
  assetLabel: string
): string {

  if (years <= 0) {

    return (
      `ניתוח AI: תרחיש השקעה ב${assetLabel}`
    );

  }

  return (
    `ניתוח AI: ${years} שנות השקעה ב${assetLabel}`
  );
}

// ---------------------------------------------------------------------------
// Main Explainable AI Engine
// ---------------------------------------------------------------------------

export function generateAIInsight(
  scenario: FinancialScenario,
  projection: ProjectionResult
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
      asset
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
      years
    );

  // -------------------------------------------------------------------------
  // Horizon
  // -------------------------------------------------------------------------

  const horizonInsight =
    buildHorizonInsight(
      years
    );

  // -------------------------------------------------------------------------
  // Growth
  // -------------------------------------------------------------------------

  const growthInsight =
    buildGrowthInsight(
      projection
    );

  // -------------------------------------------------------------------------
  // Diversification
  // -------------------------------------------------------------------------

  const diversificationInsight =
    buildDiversificationInsight(
      asset
    );

  // -------------------------------------------------------------------------
  // Educational Recommendation
  // -------------------------------------------------------------------------

  const recommendation =
    buildRecommendation(
      asset,
      years
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
        assetLabel
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
