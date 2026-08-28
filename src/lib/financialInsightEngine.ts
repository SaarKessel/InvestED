import type { FinancialScenario, Projection } from "@/types";
import type { InvestorClassification } from "@/types";
import { useLanguage } from "@/context/languageContext";

export interface FinancialInsight {
  title: string;
  description: string;
  type: "growth" | "risk" | "goal" | "education";
}

export interface FinancialInsightResult {
  headline: string;
  insights: FinancialInsight[];
}

export function useFinancialInsights(
  scenario: FinancialScenario,
  projection: Projection,
  investor: InvestorClassification
): FinancialInsightResult {
  const { t } = useLanguage();

  const insights: FinancialInsight[] = [];

  if (scenario.years >= 10) {
    insights.push({
      title: t("insight_growth_title"),
      description: t("insight_growth_desc"),
      type: "growth",
    });
  }

  if (investor.type === t("investor_type_growth") || investor.type === "growth") {
    insights.push({
      title: t("insight_risk_title"),
      description: t("insight_risk_desc"),
      type: "risk",
    });
  }

  if (projection.growth > projection.totalContributed) {
    insights.push({
      title: t("insight_education_title"),
      description: t("insight_education_desc"),
      type: "education",
    });
  }

  if (scenario.goal === "retirement") {
    insights.push({
      title: t("insight_goal_title"),
      description: t("insight_goal_desc"),
      type: "goal",
    });
  }

  return {
    headline: buildHeadline(scenario, investor, t),
    insights,
  };
}

function buildHeadline(
  scenario: FinancialScenario,
  investor: InvestorClassification,
  t: (key: string, fallback?: string) => string
): string {
  if (scenario.goal === "retirement") {
    return t("headline_retirement");
  }

  if (investor.type === t("investor_type_growth") || investor.type === "growth") {
    return t("headline_growth");
  }

  return t("headline_default");
}
