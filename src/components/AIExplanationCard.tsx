import {
  Brain,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  Target,
} from "lucide-react";

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
  const safeRiskProfile = riskProfile ?? "medium";

  function riskLabel(): string {
    if (
      safeRiskProfile === "נמוכה" ||
      safeRiskProfile === "בינונית" ||
      safeRiskProfile === "בינונית-גבוהה" ||
      safeRiskProfile === "גבוהה"
    ) {
      return safeRiskProfile;
    }

    switch (safeRiskProfile) {
      case "low":
        return "נמוכה";
      case "medium":
        return "בינונית";
      case "high":
        return "גבוהה";
      default:
        return "בינונית";
    }
  }

  function goalLabel() {
    switch (goal) {
      case "retirement":
        return "פרישה מוקדמת";
      case "home":
        return "רכישת דירה";
      case "child":
        return "חיסכון לילדים";
      case "wealth":
      case "financial_independence":
        return "עצמאות כלכלית";
      case "growth":
      default:
        return "בניית הון";
    }
  }

  const longTerm = years >= 10;

  const initialInvestmentText =
    initialInvestment > 0
      ? `זוהה סכום התחלתי של ${Math.max(0, initialInvestment ?? 0).toLocaleString("he-IL")} ₪`
      : "לא זוהה הון התחלתי";

  const monthlyContributionText =
    monthlyContribution > 0
      ? `הפקדה חודשית של ${Math.max(0, monthlyContribution ?? 0).toLocaleString("he-IL")} ₪`
      : "ללא הפקדה חודשית";

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
            🤖 איך InvestED ניתח את התרחיש
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Explainable AI Simulation
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <InsightRow
          icon={<CheckCircle className="h-5 w-5" />}
          title="נתוני בסיס"
          text={baseDataExplanation}
        />

        <InsightRow
          icon={<Clock className="h-5 w-5" />}
          title="אופק השקעה"
          text={`${years} שנים — ${
            longTerm
              ? "המערכת מזהה טווח המאפשר להשפעת הזמן והריבית דריבית לבוא לידי ביטוי."
              : "טווח קצר יחסית שבו לתנודתיות השוק יש משמעות גבוהה יותר."
          }`}
        />

        <InsightRow
          icon={<TrendingUp className="h-5 w-5" />}
          title="מסלול שנבחר"
          text={`התרחיש נותח לפי ${assetLabel} עם תשואה שנתית משוערת של ${annualReturnPct}%.`}
        />

        <InsightRow
          icon={<Shield className="h-5 w-5" />}
          title="רמת סיכון"
          text={`פרופיל סיכון משוער: ${riskLabel()}. הסיווג מבוסס על סוג הנכס ואופק ההשקעה.`}
        />

        <InsightRow
          icon={<Target className="h-5 w-5" />}
          title="מטרת המשתמש"
          text={`המטרה שזוהתה: ${goalLabel()}.`}
        />
      </div>

      <div className="mt-6 rounded-2xl bg-muted/40 p-4 border border-border/50">
        <p className="text-sm font-medium text-foreground">
          🧠 רמת ביטחון בניתוח:
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
          {confidence}%
        </p>
      </div>

      <p className="mt-5 text-xs leading-6 text-muted-foreground">
        הדמיה זו מיועדת ללמידה פיננסית בלבד ואינה מהווה ייעוץ השקעות או המלצה לפעולה.
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