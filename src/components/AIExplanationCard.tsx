import {
  Brain,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  Target,
} from "lucide-react";
import { useLanguage } from "@/context/languageContext";

interface Props {
  initialInvestment: number;
  monthlyContribution: number;
  years: number;
  annualReturnPct: number;
  assetLabel: string;
  riskProfile?: string | null;
  goal?: string;
  confidence?: number;
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
}: Props) {
  const { t, language } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

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
          `זוהה סכום התחלתי של ${Math.max(0, initialInvestment ?? 0).toLocaleString(locale)} ₪`
        ).replace("{amount}", new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.max(0, initialInvestment ?? 0)))
      : t("ai_explanation_base_no_initial", "לא זוהה הון התחלתי");

  const monthlyContributionText =
    monthlyContribution > 0
      ? t(
          "ai_explanation_base_monthly",
          `הפקדה חודשית של ${Math.max(0, monthlyContribution ?? 0).toLocaleString(locale)} ₪`
        ).replace("{amount}", new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.max(0, monthlyContribution ?? 0)))
      : t("ai_explanation_base_no_monthly", "ללא הפקדה חודשית");

  const baseDataExplanation = `${initialInvestmentText} ו-${monthlyContributionText}.`;

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
            {t("ai_explanation_title_full", "🤖 איך InvestED ניתח את התרחיש")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("ai_explanation_subtitle_full", "Explainable AI Simulation")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <InsightRow
          icon={<CheckCircle className="h-5 w-5" />}
          title={t("ai_explanation_base_data", "נתוני בסיס")}
          text={baseDataExplanation}
        />

        <InsightRow
          icon={<Clock className="h-5 w-5" />}
          title={t("ai_explanation_horizon_title", "אופק השקעה")}
          text={`${years} שנים — ${
            longTerm
              ? t("ai_explanation_horizon_long", "המערכת מזהה טווח המאפשר להשפעת הזמן והריבית דריבית לבוא לידי ביטוי.")
              : t("ai_explanation_horizon_short", "טווח קצר יחסית שבו לתנודתיות השוק יש משמעות גבוהה יותר.")
          }`}
        />

        <InsightRow
          icon={<TrendingUp className="h-5 w-5" />}
          title={t("ai_explanation_path_title", "מסלול שנבחר")}
          text={t("ai_explanation_path_text", "התרחיש נותח לפי {asset} עם תשואה שנתית משוערת של {return}%.").replace("{asset}", assetLabel).replace("{return}", String(annualReturnPct))}
        />

        <InsightRow
          icon={<Shield className="h-5 w-5" />}
          title={t("ai_explanation_risk_title", "רמת סיכון")}
          text={t("ai_explanation_risk_text", "פרופיל סיכון משוער: {risk}. הסיווג מבוסס על סוג הנכס ואופק ההשקעה.").replace("{risk}", riskLabel())}
        />

        <InsightRow
          icon={<Target className="h-5 w-5" />}
          title={t("ai_explanation_goal_title", "מטרת המשתמש")}
          text={t("ai_explanation_goal_text", "המטרה שזוהתה: {goal}.").replace("{goal}", goalLabel())}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-muted/40 p-4 border border-border/50">
        <p className="text-sm font-medium text-foreground">
          {t("ai_explanation_confidence_title", "🧠 רמת ביטחון בניתוח:")}
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
        {t("ai_explanation_disclaimer_full", "הדמיה זו מיועדת ללמידה פיננסית בלבד ואינה מהווה ייעוץ השקעות או המלצה לפעולה.")}
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