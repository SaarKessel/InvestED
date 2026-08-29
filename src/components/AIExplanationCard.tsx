import {
  Brain,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  Target,
} from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { formatCurrency } from "@/lib/format";

interface Props {
  initialInvestment: number;
  monthlyContribution: number;
  years: number;
  annualReturnPct: number;
  assetLabel: string;
  riskProfile?: string | null;
  goal?: string;
  confidence?: number;
  currency?: string;
}

export function AIExplanationCard({
  initialInvestment,
  monthlyContribution,
  years,
  annualReturnPct,
  assetLabel,
  riskProfile,
  goal = "growth",
  confidence = 0,
  currency = "ILS",
}: Props) {
  const { t, language } = useLanguage();

  function riskLabel(): string {
    const normalized = (safeRiskProfile ?? "medium").toLowerCase();
    const canonicalRisk =
      normalized === "נמוכה" || normalized === "low"
        ? "low"
        : normalized === "בינונית" || normalized === "medium"
          ? "medium"
          : normalized === "בינונית-גבוהה" || normalized === "medium_high" || normalized === "medium-high"
            ? "medium_high"
            : normalized === "גבוהה" || normalized === "high"
              ? "high"
              : "medium";

    const key = `ai_explanation_risk_${canonicalRisk}`;
    const fallback =
      canonicalRisk === "low"
        ? "Low"
        : canonicalRisk === "medium"
          ? "Medium"
          : canonicalRisk === "medium_high"
            ? "Medium-High"
            : "High";

    return t(key, fallback);
  }

  function goalLabel(): string {
    const normalized = (goal ?? "growth").toLowerCase();
    const canonicalGoal =
      normalized === "retirement" || normalized === "פרישה מוקדמת" || normalized === "פרישה"
        ? "retirement"
        : normalized === "home" || normalized === "רכישת דירה" || normalized === "דירה"
          ? "home"
          : normalized === "child" || normalized === "children" || normalized === "חיסכון לילדים" || normalized === "ילדים"
            ? "children"
            : normalized === "wealth" || normalized === "עצמאות כלכלית" || normalized === "פיננסית" || normalized === "financial_independence"
              ? "wealth"
              : "growth";

    const key = `ai_explanation_goal_${canonicalGoal === "children" ? "children" : canonicalGoal === "home" ? "house" : canonicalGoal === "retirement" ? "early_retirement" : canonicalGoal}`;
    const fallback =
      canonicalGoal === "retirement"
        ? "Early Retirement"
        : canonicalGoal === "home"
          ? "Home Purchase"
          : canonicalGoal === "children"
            ? "Saving for Children"
            : canonicalGoal === "wealth"
              ? "Wealth Building"
              : "General Investing";

    return t(key, fallback);
  }

  const safeRiskProfile = riskProfile ?? "medium";

  const longTerm = years >= 10;

  const initialInvestmentText =
    initialInvestment > 0
      ? t(
          "ai_explanation_base_initial",
          `Identified initial capital of ${formatCurrency(Math.max(0, initialInvestment ?? 0), currency, language)}`
        ).replace("{amount}", formatCurrency(Math.max(0, initialInvestment ?? 0), currency, language))
      : t("ai_explanation_base_no_initial", "No initial capital identified");

  const monthlyContributionText =
    monthlyContribution > 0
      ? t(
          "ai_explanation_base_monthly",
          `Monthly contribution of ${formatCurrency(Math.max(0, monthlyContribution ?? 0), currency, language)}`
        ).replace("{amount}", formatCurrency(Math.max(0, monthlyContribution ?? 0), currency, language))
      : t("ai_explanation_base_no_monthly", "No monthly contribution");

  const baseDataExplanation = `${initialInvestmentText} and ${monthlyContributionText}.`;

  return (
    <div
      className="rounded-3xl border border-border bg-card p-6 shadow-soft"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <Brain className="h-6 w-6" />
        </div>

        <div>
      <h2 className="text-2xl font-bold text-foreground">
        {t("ai_explanation_title_full", "🤖 How InvestED Analyzed Your Scenario")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("ai_explanation_subtitle_full", "Explainable AI Simulation")}
      </p>
        </div>
      </div>

      <div className="space-y-4">
        <InsightRow
          icon={<CheckCircle className="h-5 w-5" />}
          title={t("ai_explanation_base_data", "Base Data")}
          text={baseDataExplanation}
        />

        <InsightRow
          icon={<Clock className="h-5 w-5" />}
          title={t("ai_explanation_horizon_title", "Investment Horizon")}
          text={`${years} years — ${
            longTerm
              ? t("ai_explanation_horizon_long", "The system identified a long-term horizon where time and compound interest can significantly impact growth.")
              : t("ai_explanation_horizon_short", "A relatively short horizon where market volatility has a higher impact.")
          }`}
        />

        <InsightRow
          icon={<TrendingUp className="h-5 w-5" />}
          title={t("ai_explanation_path_title", "Chosen Path")}
          text={t("ai_explanation_path_text", "The scenario was analyzed based on {asset} with an estimated annual return of {return}%.").replace("{asset}", assetLabel).replace("{return}", String(annualReturnPct))}
        />

        <InsightRow
          icon={<Shield className="h-5 w-5" />}
          title={t("ai_explanation_risk_title", "Risk Level")}
          text={t("ai_explanation_risk_text", "Estimated risk profile: {risk}. The classification is based on asset type and investment horizon.").replace("{risk}", riskLabel())}
        />

        <InsightRow
          icon={<Target className="h-5 w-5" />}
          title={t("ai_explanation_goal_title", "User Goal")}
          text={t("ai_explanation_goal_text", "Identified goal: {goal}.").replace("{goal}", goalLabel())}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-muted/40 p-4 border border-border/50">
        <p className="text-sm font-medium text-foreground">
          {t("ai_explanation_confidence_title", "🧠 Confidence in this analysis:")}
        </p>

        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full gradient-brand transition-all duration-500"
            style={{
              width: `${Math.min(confidence, 100)}%`,
            }}
          />
        </div>

        <p className="mt-2 text-sm font-bold text-primary">
          {t("ai_explanation_confidence_value", "{value}%").replace("{value}", String(confidence))}
        </p>
      </div>

      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        {t("ai_explanation_disclaimer_full", "This simulation is for financial education purposes only and does not constitute investment advice or a recommendation to act.")}
      </p>
    </div>
  );
}

function InsightRow({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-muted/30 border border-border/40 p-4">
      <div className="mt-1 text-primary shrink-0">{icon}</div>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}