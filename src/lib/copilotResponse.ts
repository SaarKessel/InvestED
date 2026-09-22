import type { AnalysisResult, AssetAnalysis, MarketDataFreshness, MarketDataSource, StrategyFitAssessment, StrategyId } from "@/types";
import type { ClarificationRequest, ConversationIntent, ConversationLanguage, TurnResolution } from "./conversationContext";
import type { AssetResearch } from "./research/assetResearchEngine";
import type { StrategyComparisonResult, StrategyExplanation, StrategyMarketExample } from "./strategy/strategyEngine";
import { explainFinancialConcepts, isGuaranteeQuestion, isPredictionQuestion, type HoldingValuation, type PurchasePowerResult } from "./financialEducation";
import type { QAOutcome, QAToolResult } from "./financialQA";

export type CopilotDataDependency = "market" | "financial_engine" | "investor_profile" | "strategy_engine";

/**
 * Phase 6: validated Strategy Engine output handed to the
 * response builder. Ollama may rephrase this content, never
 * extend it with new facts.
 */
export interface StrategyCopilotPayload {
  kind: "explain" | "compare";
  explanation: StrategyExplanation | null;
  comparison: StrategyComparisonResult | null;
  fit: StrategyFitAssessment | null;
  marketExamples: StrategyMarketExample[];
}

export interface CopilotResponse {
  text: string;
  language: ConversationLanguage;
  intent: ConversationIntent;
  assets: AssetAnalysis[];
  /** Structured validated research is attached by the orchestrator when available. */
  assetResearch?: AssetResearch[];
  calculation: AnalysisResult["projection"] | null;
  comparison: AssetAnalysis[] | null;
  strategies: StrategyId[];
  strategyFit: StrategyFitAssessment | null;
  profileContextUsed: boolean;
  dataDependencies: CopilotDataDependency[];
  dataSources: MarketDataSource[];
  dataFreshness: MarketDataFreshness[];
  clarification: ClarificationRequest | null;
  holdingValuation: HoldingValuation | null;
  purchasePower: PurchasePowerResult | null;
  toolResult: QAToolResult | null;
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + ` ${currency}`;
}

function educationalFallback(message: string, language: ConversationLanguage): string {
  const he = language !== "en";
  if (/\betf\b/i.test(message)) return he
    ? "ETF היא קרן סל שעוקבת בדרך כלל אחרי מדד או סל נכסים ונסחרת בבורסה כמו מניה. היא מאפשרת פיזור רחב בעסקה אחת, אך עדיין כרוכה בסיכון ובדמי ניהול."
    : "An ETF is a fund that usually tracks an index or basket of assets and trades on an exchange like a stock. It can provide broad diversification in one holding, but it still carries risk and fees.";
  if (/\brsi\b/i.test(message)) return he
    ? "RSI הוא מדד מומנטום בין 0 ל-100 שמשווה את עוצמת העליות והירידות האחרונות. הוא כלי תיאורי, לא תחזית ולא הוראת קנייה או מכירה."
    : "RSI is a 0-100 momentum indicator that compares the strength of recent gains and losses. It is descriptive, not a forecast or a buy/sell instruction.";
  if (/volatil|תנודתיות/i.test(message)) return he
    ? "תנודתיות מתארת עד כמה ובאיזו תדירות מחיר משתנה. תנודתיות גבוהה פירושה טווח שינויים רחב יותר, לא בהכרח תשואה גבוהה יותר."
    : "Volatility describes how much and how often a price changes. Higher volatility means a wider range of outcomes, not necessarily a higher return.";
  if (/diversif|פיזור/i.test(message)) return he
    ? "פיזור מפחית תלות בנכס, חברה או שוק יחיד. הוא לא מבטל הפסדים, אבל יכול לצמצם את הנזק מאירוע נקודתי."
    : "Diversification reduces dependence on one asset, company, or market. It cannot prevent losses, but it can limit the impact of a single event.";
  if (/dollar.?cost|מיצוע/i.test(message)) return he
    ? "מיצוע עלויות הוא השקעת סכום קבוע במרווחי זמן קבועים. כך קונים יותר יחידות כשהמחיר נמוך ופחות כשהוא גבוה, בלי לנסות לתזמן את השוק."
    : "Dollar-cost averaging means investing a fixed amount on a regular schedule. You buy more units when prices are lower and fewer when they are higher, without trying to time the market.";
  return he
    ? "זו שאלה שאין לי עליה מענה מהימן — אני בנויה לחינוך פיננסי: מושגים, חישובים, נתוני שוק והשוואות. שאלו אותי אחת מהאלה."
    : "That's outside what I can reliably answer — I'm built for financial education: concepts, calculations, market data and comparisons. Ask me one of those.";
}

function strategyMarketText(examples: StrategyMarketExample[], language: ConversationLanguage): string {
  if (examples.length === 0) return "";
  const en = language === "en";
  const parts = examples.map((example) => {
    if (!example.available) {
      return en
        ? `${example.symbol}: market data unavailable right now (no value invented).`
        : `${example.symbol}: נתוני השוק אינם זמינים כרגע (לא הומצא ערך).`;
    }
    const simulated = example.isMock || example.freshness === "simulated";
    return en
      ? `${example.symbol}: ${simulated ? "simulated value" : "latest available"} ${example.price?.toFixed(2)} (${(example.changePercent ?? 0).toFixed(2)}%).`
      : `${example.symbol}: ${simulated ? "ערך מדומה" : "ערך זמין אחרון"} ${example.price?.toFixed(2)} (${(example.changePercent ?? 0).toFixed(2)}%).`;
  });
  const header = en ? "Market examples (educational): " : "דוגמאות מהשוק (ללמידה): ";
  return header + parts.join(" ");
}

function strategyCopilotText(payload: StrategyCopilotPayload, language: ConversationLanguage): string {
  const en = language === "en";
  const segments: string[] = [];

  if (payload.kind === "compare" && payload.comparison) {
    const comparison = payload.comparison;
    segments.push(comparison.summary);
    const riskRow = comparison.rows.find((row) => row.dimension === "risk");
    if (riskRow) {
      const pairs = comparison.strategies.map((strategy, index) => `${strategy.name}: ${riskRow.values[index]}`);
      segments.push(`${riskRow.label}: ${pairs.join("; ")}.`);
    }
    const horizonRow = comparison.rows.find((row) => row.dimension === "timeHorizon");
    if (horizonRow) {
      const pairs = comparison.strategies.map((strategy, index) => `${strategy.name}: ${horizonRow.values[index]}`);
      segments.push(`${horizonRow.label}: ${pairs.join("; ")}.`);
    }
    segments.push(comparison.disclaimer);
  } else if (payload.explanation) {
    const explanation = payload.explanation;
    segments.push(`${explanation.name} (${explanation.riskLabel}, ${en ? "risk" : "סיכון"} ${explanation.riskLevel}/10).`);
    segments.push(explanation.description);
    segments.push(explanation.philosophy);
    segments.push((en ? "Suitable for: " : "למי זה מתאים: ") + explanation.suitableFor);
    if (explanation.strengths.length > 0) {
      segments.push((en ? "Strengths: " : "חוזקות: ") + explanation.strengths.join("; ") + ".");
    }
    if (explanation.limitations.length > 0) {
      segments.push((en ? "Limitations: " : "מגבלות: ") + explanation.limitations.join("; ") + ".");
    }
    segments.push(explanation.historicalContext);
    segments.push(explanation.disclaimer);
  }

  if (payload.fit) {
    if (payload.fit.status === "assessed" && payload.fit.fit) {
      const fitLabel = en
        ? { high: "high", moderate: "partial", low: "low" }[payload.fit.fit]
        : { high: "גבוהה", moderate: "חלקית", low: "נמוכה" }[payload.fit.fit];
      segments.push(
        (en ? `Educational fit with your profile: ${fitLabel}. ` : `התאמה לימודית לפרופיל שלך: ${fitLabel}. `) +
        payload.fit.reasons.join(" ")
      );
    }
    segments.push(payload.fit.disclaimer);
  }

  const marketText = strategyMarketText(payload.marketExamples, language);
  if (marketText) segments.push(marketText);

  return segments.join(" ").trim();
}

export function buildCopilotResponse(
  message: string,
  resolution: TurnResolution,
  result: AnalysisResult | null,
  assets: AssetAnalysis[],
  enhancedText?: string | null,
  strategyOutput?: StrategyCopilotPayload | null,
  qaOutcome: QAOutcome | null = null
): CopilotResponse {
  const marketNeeded = assets.length > 0 || resolution.currentAsset !== null || resolution.comparisonSet.length > 0;
  const financialNeeded = resolution.scenario !== null;
  const profileUsed = resolution.investorProfileContext !== null;
  const dataDependencies: CopilotDataDependency[] = [];
  if (marketNeeded) dataDependencies.push("market");
  if (financialNeeded) dataDependencies.push("financial_engine");
  if (profileUsed) dataDependencies.push("investor_profile");
  if (strategyOutput) dataDependencies.push("strategy_engine");
  const dataSources = [...new Set(assets.map((asset) => asset.dataSource))];
  const dataFreshness = [...new Set(assets.map((asset) => asset.freshness ?? (asset.isMock ? "simulated" : "unavailable")))];

  const holdingValuation = qaOutcome?.holdingValuation ?? null;
  const conceptExplanation = explainFinancialConcepts(message, resolution.language);

  // Zero-input financial questions ("give me a guaranteed investment")
  // must never render as a projection of zeros — ask for real inputs.
  const noFinancialInputs =
    resolution.scenario !== null &&
    resolution.financialParameters.initialInvestment === null &&
    resolution.financialParameters.monthlyContribution === null &&
    resolution.financialParameters.years === null &&
    resolution.financialParameters.annualReturnPct === null;

  let text = enhancedText ?? "";
  if (isGuaranteeQuestion(message)) {
    text = resolution.language === "en"
      ? "There is no such thing as a guaranteed high-return investment — a promise like that is a classic fraud red flag. Higher expected return always comes with higher risk. I can explain the risk/return trade-off or walk you through lower-risk options like deposits and bonds."
      : "אין דבר כזה השקעה בטוחה עם תשואה גבוהה מובטחת — הבטחה כזו היא סימן אזהרה קלאסי להונאה. תשואה צפויה גבוהה יותר מגיעה תמיד עם סיכון גבוה יותר. אני יכולה להסביר את היחס בין סיכון לתשואה או להציג אפשרויות בסיכון נמוך כמו פיקדונות ואג״ח.";
  } else if (isPredictionQuestion(message) && resolution.intent !== "financial_projection") {
    const base = resolution.language === "en"
      ? "I can't predict where prices will go — nobody reliably can, and anyone who claims otherwise is guessing."
      : "אני לא יכולה לנבא לאן המחירים ילכו — אף אחד לא יכול באופן מהימן, ומי שטוען אחרת מנחש.";
    const asset = assets[0];
    if (asset && !asset.isMock && asset.freshness !== "simulated") {
      text = resolution.language === "en"
        ? `${base} What I can give you is the latest real data: ${asset.symbol} at ${asset.price.toFixed(2)} ${asset.currency ?? ""} (${asset.changePercent.toFixed(2)}%), from the provider's latest data — which says nothing about tomorrow. I can also explain volatility and risk, or run an educational scenario.`
        : `${base} מה שכן אפשר לתת זה את הנתון האמיתי האחרון: ${asset.symbol} ב-${asset.price.toFixed(2)} ${asset.currency ?? ""} (${asset.changePercent.toFixed(2)}%), לפי נתון הספק האחרון — והוא לא אומר דבר על מחר. אפשר גם להסביר תנודתיות וסיכון, או להריץ תרחיש לימודי.`;
    } else {
      text = resolution.language === "en"
        ? `${base} I can explain the concepts that actually drive long-term outcomes (diversification, horizon, costs) or run an educational scenario with explicit assumptions.`
        : `${base} אני כן יכולה להסביר את המושגים שבאמת מניעים תוצאות ארוכות טווח (פיזור, אופק, עלויות) או להריץ תרחיש לימודי עם הנחות מפורשות.`;
    }
  } else if (qaOutcome) {
    text = qaOutcome.text;
  } else if (resolution.status === "needs_clarification") {
    text = resolution.clarification?.question ?? "";
  } else if (noFinancialInputs) {
    text = resolution.language === "en"
      ? "To run that calculation I need the real inputs: how much (one-time and/or monthly), for how many years, and what annual return assumption. For example: '500 ILS a month for 10 years at 7%'."
      : "כדי להריץ את החישוב אני צריכה את הקלטים האמיתיים: כמה כסף (חד-פעמי ו/או חודשי), לכמה שנים, ובאיזו הנחת תשואה שנתית. למשל: '500 ש״ח בחודש ל-10 שנים ב-7%'.";
  } else if (conceptExplanation && !strategyOutput && assets.length === 0) text = conceptExplanation;
  else if (!text && marketNeeded && assets.length === 0) text = resolution.language === "en"
    ? "Market data is unavailable right now, so I won't invent a price or indicator. I can still explain the concept without current market values."
    : "נתוני השוק אינם זמינים כרגע, ולכן לא אמציא מחיר או מדד. אפשר עדיין להסביר את המושג בלי ערכי שוק עדכניים.";
  else if (!text && resolution.intent === "comparison" && assets.length >= 2) {
    const mostVolatile = [...assets].sort((a, b) => b.volatilityPct - a.volatilityPct)[0];
    text = resolution.language === "en"
      ? `${assets.map(a => `${a.symbol}: ${a.changePercent.toFixed(2)}% recent change, ${a.volatilityPct.toFixed(2)}% volatility`).join("; ")}. ${mostVolatile.symbol} is more volatile in the supplied history. Based on the latest market data available from the provider.`
      : `${assets.map(a => `${a.symbol}: שינוי אחרון ${a.changePercent.toFixed(2)}%, תנודתיות ${a.volatilityPct.toFixed(2)}%`).join("; ")}. ${mostVolatile.symbol} תנודתי יותר בהיסטוריה שסופקה. לפי נתוני השוק האחרונים הזמינים מהספק.`;
  } else if (!text && assets.length > 0) {
    const asset = assets[0];
    const simulated = asset.isMock || asset.freshness === "simulated";
    text = resolution.language === "en"
      ? `${asset.symbol}: ${simulated ? "simulated value" : "latest available price"} ${asset.price.toFixed(2)} ${asset.currency ?? ""}, change ${asset.changePercent.toFixed(2)}%, RSI ${asset.rsi?.toFixed(1) ?? "unavailable"}, volatility ${asset.volatilityPct.toFixed(2)}%.`
      : `${asset.symbol}: ${simulated ? "ערך מדומה" : "מחיר זמין אחרון"} ${asset.price.toFixed(2)} ${asset.currency ?? ""}, שינוי ${asset.changePercent.toFixed(2)}%, RSI ${asset.rsi?.toFixed(1) ?? "לא זמין"}, תנודתיות ${asset.volatilityPct.toFixed(2)}%.`;
  } else if (!text && financialNeeded && result && !noFinancialInputs) text = resolution.language === "en"
    ? `Using the financial engine: projected final balance ${money(result.projection.finalBalance, result.projection.currency)} after ${result.scenario?.years} years, from ${money(result.projection.totalContributed, result.projection.currency)} contributed. This is an educational projection based on the stated return assumption.`
    : `לפי המנוע הפיננסי: יתרה חזויה של ${money(result.projection.finalBalance, result.projection.currency)} אחרי ${result.scenario?.years} שנים, מתוך הפקדות של ${money(result.projection.totalContributed, result.projection.currency)}. זו תחזית לימודית המבוססת על הנחת התשואה שנמסרה.`;
  else if (!text && resolution.intent === "investor_profile_fit" && profileUsed) text = resolution.language === "en"
    ? `The fit assessment uses your saved in-session investor profile (${resolution.investorProfileContext?.classification ?? "profile available"}). It is educational and does not create or infer missing profile details.`
    : `בדיקת ההתאמה משתמשת בפרופיל המשקיע הקיים בסשן (${resolution.investorProfileContext?.classification ?? "פרופיל קיים"}). היא לימודית ואינה ממציאה פרטי פרופיל חסרים.`;
  else if (!text && strategyOutput) text = strategyCopilotText(strategyOutput, resolution.language);
  else if (!text) text = educationalFallback(message, resolution.language);

  return {
    text,
    language: resolution.language,
    intent: resolution.intent,
    assets,
    calculation: financialNeeded && result ? result.projection : null,
    comparison: resolution.intent === "comparison" ? assets : null,
    strategies: strategyOutput
      ? (strategyOutput.kind === "compare" && strategyOutput.comparison
          ? strategyOutput.comparison.strategies.map((item) => item.strategy.id)
          : strategyOutput.explanation
            ? [strategyOutput.explanation.strategy.id]
            : [])
      : [],
    strategyFit: strategyOutput?.fit ?? null,
    profileContextUsed: profileUsed,
    dataDependencies,
    dataSources,
    dataFreshness,
    clarification: resolution.clarification,
    holdingValuation,
    purchasePower: qaOutcome?.purchasePower ?? null,
    toolResult: qaOutcome?.toolResult ?? null,
  };
}
