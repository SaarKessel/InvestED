import type { AnalysisResult, AssetAnalysis, MarketDataFreshness, MarketDataSource, StrategyFitAssessment, StrategyId } from "@/types";
import type { ClarificationRequest, ConversationIntent, ConversationLanguage, TurnResolution } from "./conversationContext";
import type { StrategyComparisonResult, StrategyExplanation, StrategyMarketExample } from "./strategy/strategyEngine";

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
  calculation: AnalysisResult["projection"] | null;
  comparison: AssetAnalysis[] | null;
  strategies: StrategyId[];
  strategyFit: StrategyFitAssessment | null;
  profileContextUsed: boolean;
  dataDependencies: CopilotDataDependency[];
  dataSources: MarketDataSource[];
  dataFreshness: MarketDataFreshness[];
  clarification: ClarificationRequest | null;
}

function money(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value) + ` ${currency}`;
}

function marketProvenance(asset: AssetAnalysis, language: ConversationLanguage): string {
  const source = asset.dataSource === "mock" ? "simulated" : asset.dataSource.replace("_", " ");
  const freshness = asset.freshness ?? (asset.isMock ? "simulated" : "unavailable");
  const when = asset.timestamp ? `, ${asset.timestamp}` : "";
  return language === "en"
    ? `Source: ${source}; freshness: ${freshness}${when}.`
    : `מקור: ${source}; עדכניות: ${freshness}${when}.`;
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
  return he ? "אסביר את הנושא במונחים פיננסיים פשוטים ובהקשר חינוכי, בלי להמציא נתונים או לתת הוראת קנייה או מכירה." : "I can explain this in clear financial terms for education, without inventing data or giving a buy/sell instruction.";
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
    const source = (example.dataSource ?? "unknown").replace("_", " ");
    const freshness = example.freshness ?? "unavailable";
    return en
      ? `${example.symbol}: latest available ${example.price?.toFixed(2)} (${(example.changePercent ?? 0).toFixed(2)}%). Source: ${source}; freshness: ${freshness}.`
      : `${example.symbol}: ערך זמין אחרון ${example.price?.toFixed(2)} (${(example.changePercent ?? 0).toFixed(2)}%). מקור: ${source}; עדכניות: ${freshness}.`;
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
  strategyOutput?: StrategyCopilotPayload | null
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

  let text = enhancedText ?? "";
  if (resolution.status === "needs_clarification") text = resolution.clarification?.question ?? "";
  else if (!text && marketNeeded && assets.length === 0) text = resolution.language === "en"
    ? "Market data is unavailable right now, so I won't invent a price or indicator. I can still explain the concept without current market values."
    : "נתוני השוק אינם זמינים כרגע, ולכן לא אמציא מחיר או מדד. אפשר עדיין להסביר את המושג בלי ערכי שוק עדכניים.";
  else if (!text && resolution.intent === "comparison" && assets.length >= 2) {
    const mostVolatile = [...assets].sort((a, b) => b.volatilityPct - a.volatilityPct)[0];
    text = resolution.language === "en"
      ? `${assets.map(a => `${a.symbol}: ${a.changePercent.toFixed(2)}% recent change, ${a.volatilityPct.toFixed(2)}% volatility`).join("; ")}. ${mostVolatile.symbol} is more volatile in the supplied history. ${assets.map(a => marketProvenance(a, resolution.language)).join(" ")}`
      : `${assets.map(a => `${a.symbol}: שינוי אחרון ${a.changePercent.toFixed(2)}%, תנודתיות ${a.volatilityPct.toFixed(2)}%`).join("; ")}. ${mostVolatile.symbol} תנודתי יותר בהיסטוריה שסופקה. ${assets.map(a => marketProvenance(a, resolution.language)).join(" ")}`;
  } else if (!text && assets.length > 0) {
    const asset = assets[0];
    const simulated = asset.isMock || asset.freshness === "simulated";
    text = resolution.language === "en"
      ? `${asset.symbol}: ${simulated ? "simulated value" : "latest available price"} ${asset.price.toFixed(2)} ${asset.currency ?? ""}, change ${asset.changePercent.toFixed(2)}%, RSI ${asset.rsi?.toFixed(1) ?? "unavailable"}, volatility ${asset.volatilityPct.toFixed(2)}%. ${marketProvenance(asset, resolution.language)}`
      : `${asset.symbol}: ${simulated ? "ערך מדומה" : "מחיר זמין אחרון"} ${asset.price.toFixed(2)} ${asset.currency ?? ""}, שינוי ${asset.changePercent.toFixed(2)}%, RSI ${asset.rsi?.toFixed(1) ?? "לא זמין"}, תנודתיות ${asset.volatilityPct.toFixed(2)}%. ${marketProvenance(asset, resolution.language)}`;
  } else if (!text && financialNeeded && result) text = resolution.language === "en"
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
  };
}
