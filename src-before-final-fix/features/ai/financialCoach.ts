import { InvestmentProfile } from "../../data/investmentModels";

export interface AIInsight {
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
}

export function generateFinancialInsights(
  profile: InvestmentProfile
): AIInsight[] {

  const insights: AIInsight[] = [];

  if (profile.monthlyContribution > 0) {
    insights.push({
      title: "Consistency Advantage",
      message:
        "Regular monthly investing increases the power of compound growth over time.",
      priority: "low"
    });
  }

  if (profile.years >= 20) {
    insights.push({
      title: "Long Term Investor",
      message:
        "Your investment horizon allows market volatility to work in your favor.",
      priority: "low"
    });
  }

  if (profile.risk === "Aggressive") {
    insights.push({
      title: "Risk Awareness",
      message:
        "Higher expected returns usually come with larger temporary declines.",
      priority: "medium"
    });
  }

  if (profile.initialCapital < 50000) {
    insights.push({
      title: "Build Your Base",
      message:
        "Increasing your initial capital can accelerate future growth.",
      priority: "medium"
    });
  }

  return insights;
}