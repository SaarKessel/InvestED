// ---------------------------------------------------------------------------
// InvestED — AI Explanation Engine v3
// Explainable Financial Insights Engine
// ---------------------------------------------------------------------------

import type {
  FinancialScenario,
  ProjectionResult
} from "@/lib/calculatorEngine";

import {
  ASSET_CLASSES
} from "@/lib/calculatorEngine";

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

export function generateAIInsight(
  scenario: FinancialScenario,
  projection: ProjectionResult
): AIInsight {

  const years = scenario.years;
  const asset = scenario.assetClassKey;

  const assetLabel =
    ASSET_CLASSES.find(
      a => a.key === asset
    )?.label ?? asset;

  const growthPercentage =
    projection.finalBalance > 0
      ? Math.round(
          projection.growth /
          projection.finalBalance *
          100
        )
      : 0;

  // -------------------------------------------------------------------------
  // Horizon Analysis
  // -------------------------------------------------------------------------

  let horizonInsight = "";

  if (years < 5) {

    horizonInsight =
      "⏳ אופק השקעה קצר יחסית. תנודתיות השוק יכולה להשפיע בצורה משמעותית ולכן חשוב להתחשב ברמת הסיכון.";

  }

  else if (years < 15) {

    horizonInsight =
      "📈 אופק השקעה בינוני מאפשר לשלב בין פוטנציאל צמיחה לבין ניהול סיכונים בהתאם למטרת ההשקעה.";

  }

  else {

    horizonInsight =
      "🚀 אופק השקעה ארוך מאפשר לריבית דריבית להשפיע משמעותית על צמיחת ההון, אך עדיין חשוב להתאים את רמת הסיכון למטרת ההשקעה.";

  }

  // -------------------------------------------------------------------------
  // Risk Analysis
  // -------------------------------------------------------------------------

  let riskLevel = "בינונית";
  let riskEmoji = "🟡";

  if (asset === "bonds") {

    riskLevel = "נמוכה";
    riskEmoji = "🟢";

  }

  else if (asset === "nasdaq") {

    riskLevel = "גבוהה";
    riskEmoji = "🔴";

  }

  else if (
    asset === "sp500" &&
    years >= 15
  ) {

    riskLevel = "בינונית-גבוהה";
    riskEmoji = "🟡";

  }

  // -------------------------------------------------------------------------
  // Growth Explanation
  // -------------------------------------------------------------------------

  const growthInsight = `
מתוך השווי הסופי,
כ־${growthPercentage}% נוצר מצמיחת ההשקעה.

המשמעות:
הזמן בשוק והריבית דריבית תרמו חלק משמעותי לצמיחת ההון.
`;

  // -------------------------------------------------------------------------
  // Diversification Insight
  // -------------------------------------------------------------------------

  let diversificationInsight = "";

  if (
    asset === "sp500" ||
    asset === "nasdaq"
  ) {

    diversificationInsight =
      "🌎 החשיפה מתמקדת בשוק המניות ולכן קיימת תלות בביצועי שוק ההון.";

  }

  else if (asset === "world") {

    diversificationInsight =
      "🌎 המסלול מעניק פיזור גיאוגרפי רחב יותר בין שווקים שונים.";

  }

  else {

    diversificationInsight =
      "🛡️ המסלול בעל אופי הגנתי יותר עם תנודתיות נמוכה יחסית.";

  }

  // -------------------------------------------------------------------------
  // Recommendation
  // -------------------------------------------------------------------------

  let recommendation = "";

  if (years < 5) {

    recommendation =
      "⚠️ באופק קצר יחסית, חשוב במיוחד לבחון את רמת הסיכון ואת התנודתיות האפשרית ביחס למועד שבו יהיה צורך בכסף.";

  }

  else if (years < 15) {

    recommendation =
      "📈 אופק של מספר שנים מאפשר להתמקד בצמיחה תוך בחינה של רמת הסיכון וההתאמה למטרת ההשקעה.";

  }

  else {

    recommendation =
      "🚀 אופק של " +
      years +
      " שנים מאפשר לריבית דריבית להשפיע משמעותית על צמיחת ההון, אך חשוב עדיין להתאים את רמת הסיכון למטרת ההשקעה וליכולת להתמודד עם תנודתיות.";

  }

  // -------------------------------------------------------------------------
  // Confidence
  // -------------------------------------------------------------------------

  const confidence =
    scenario.confidence;

  // -------------------------------------------------------------------------
  // Result
  // -------------------------------------------------------------------------

  return {

    headline:
      `ניתוח AI: ${years} שנות השקעה ב${assetLabel}`,

    riskLevel,

    riskEmoji,

    horizonInsight,

    growthInsight,

    recommendation,

    confidence,

    diversificationInsight

  };

}
