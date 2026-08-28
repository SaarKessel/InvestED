import { motion } from "framer-motion";
import {
  Target,
  TrendingUp,
  Wallet,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  CircleDollarSign,
  Sparkles,
  Info,
} from "lucide-react";
import { useLanguage } from "@/context/languageContext";

interface Props {
  targetAmount: number | null;
  goalDescription?: string;
  currentAmount: number;
  years: number;
  requiredMonthlyContribution: number;
  monthlyContribution: number;
  expectedFinalValue: number;
  progressPercentage: number;
  achievable: boolean;
  gap?: number;
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(safeNumber(value), min), max);
}

export function GoalPlannerCard({
  targetAmount,
  goalDescription,
  currentAmount,
  years,
  requiredMonthlyContribution,
  monthlyContribution,
  expectedFinalValue,
  progressPercentage,
  achievable,
  gap,
}: Props) {
  const { t, language } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

  function formatMoney(value: number): string {
    const safeValue = safeNumber(value);
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(safeValue);
  }

  function formatCompactMoney(value: number): string {
    const safeValue = Math.max(safeNumber(value), 0);
    if (safeValue >= 1_000_000) {
      return `${(safeValue / 1_000_000).toFixed(2)}M ₪`;
    }
    if (safeValue >= 1_000) {
      return `${Math.round(safeValue / 1_000)}K ₪`;
    }
    return formatMoney(safeValue);
  }

  const safeCurrentAmount = Math.max(safeNumber(currentAmount), 0);
  const safeExpectedFinalValue = Math.max(safeNumber(expectedFinalValue), 0);
  const safeTargetAmount = targetAmount !== null ? Math.max(safeNumber(targetAmount), 0) : null;
  const safeYears = Math.max(Math.round(safeNumber(years)), 0);
  const safeMonthlyContribution = Math.max(safeNumber(monthlyContribution), 0);
  const safeRequiredMonthlyContribution = Math.max(safeNumber(requiredMonthlyContribution), 0);

  const estimatedFutureContributions = safeMonthlyContribution * 12 * safeYears;
  const estimatedCapitalBase = safeCurrentAmount + estimatedFutureContributions;
  const estimatedGrowth = Math.max(safeExpectedFinalValue - estimatedCapitalBase, 0);

  const progress = clamp(progressPercentage, 0, 100);

  const goalReached = safeTargetAmount !== null && safeExpectedFinalValue >= safeTargetAmount;
  const effectiveAchievable = goalReached || achievable;

  const gapToGoal = Math.max(safeNumber(gap ?? 0), 0);

  const progressLabel = goalReached
    ? t("goal_status_achieved")
    : progress >= 75
      ? t("goal_status_close")
      : progress >= 40
        ? t("goal_status_progress")
        : t("goal_status_start");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-sm"
    >
      {/* Header */}
      <div className="border-b border-border/60 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-bold tracking-tight">
                {t("goal_planner_title_full")}
              </h3>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("goal_planner_subtitle_full")}
            </p>
          </div>
        </div>
      </div>

      {/* Goal Hero */}
      <div className="px-6 pt-6">
        <div className="rounded-3xl border border-primary/20 bg-primary/[0.04] p-5">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4 shrink-0 text-primary" />
                <span>{goalDescription ?? t("goal_planner_default_goal")}</span>
              </div>
              <p className="mt-2 text-4xl font-black tracking-tight text-primary md:text-5xl">
                {safeTargetAmount !== null
                  ? formatCompactMoney(safeTargetAmount)
                  : goalDescription ?? t("goal_planner_default_goal")}
              </p>
              {safeTargetAmount !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("goal_planner_estimated_target")}
                </p>
              )}
            </div>

            <div className="w-full md:w-[260px]">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{progressLabel}</span>
                <span className="font-bold">{Math.round(progress)}%</span>
              </div>
              <div
                className="mt-2 h-3 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("goal_progress_aria")}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-1 gap-4 px-6 pt-4 md:grid-cols-3">
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label={t("goal_planner_future_value")}
          value={formatMoney(safeExpectedFinalValue)}
          description={t("goal_planner_future_value_desc")}
        />
        <MetricCard
          icon={<Wallet className="h-4 w-4" />}
          label={t("goal_planner_current_capital")}
          value={formatMoney(safeCurrentAmount)}
          description={t("goal_planner_current_capital_desc")}
        />
        <MetricCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={t("goal_planner_horizon_label_full")}
          value={t("goal_planner_horizon_value_full").replace("{years}", String(safeYears))}
          description={t("goal_planner_horizon_desc")}
        />
      </div>

      {/* Goal Gap */}
      {safeTargetAmount !== null && (
        <div className="px-6 pt-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background">
              {goalReached ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <ArrowDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                {goalReached ? t("goal_planner_achieved") : t("goal_planner_gap")}
              </p>
              <p className="mt-1 text-xl font-bold">
                {goalReached ? formatMoney(0) : formatMoney(gapToGoal)}
              </p>
            </div>
            <BadgeStatus reached={goalReached} />
          </div>
        </div>
      )}

      {/* Monthly Contribution */}
      <div className="px-6 pt-4">
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            {t("goal_planner_required_monthly")}
          </div>
          <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
            <p className="text-3xl font-black text-primary">
              {formatMoney(safeRequiredMonthlyContribution)}
            </p>
            <span className="text-sm text-muted-foreground">
              {t("goal_planner_per_month")}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t("goal_planner_required_desc")}
          </p>
        </div>
      </div>

      {/* Projection Composition */}
      <div className="px-6 pt-4">
        <div className="rounded-2xl border bg-background/60 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-semibold">{t("goal_planner_composition_title")}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniMetric label={t("goal_planner_initial")} value={formatMoney(safeCurrentAmount)} />
            <MiniMetric label={t("goal_planner_future_deposits")} value={formatMoney(estimatedFutureContributions)} />
            <MiniMetric label={t("goal_planner_estimated_growth")} value={formatMoney(estimatedGrowth)} />
          </div>
          <div className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{t("goal_planner_composition_note")}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="px-6 pt-4">
        <div
          className={`rounded-2xl border p-5 ${
            effectiveAchievable
              ? "border-green-500/30 bg-green-500/10"
              : "border-yellow-500/30 bg-yellow-500/10"
          }`}
        >
          <div className="flex items-start gap-3">
            {effectiveAchievable ? (
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-500" />
            ) : (
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-yellow-500" />
            )}
            <div className="min-w-0">
              <p className="font-bold">
                {goalReached
                  ? t("goal_planner_status_achieved")
                  : achievable
                    ? t("goal_planner_status_achievable")
                    : t("goal_planner_status_unachievable")}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("goal_planner_status_future_value")}{" "}
                <span className="font-bold text-foreground">
                  {formatMoney(safeExpectedFinalValue)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-6 pb-6 pt-5">
        <div className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
          {t("goal_planner_disclaimer_full")}
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-3 break-words text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-bold">{value}</p>
    </div>
  );
}

function BadgeStatus({ reached }: { reached: boolean }) {
  const { t } = useLanguage();
  return (
    <div
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
        reached
          ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
          : "border-border bg-background text-muted-foreground"
      }`}
    >
      {reached ? t("goal_planner_badge_achieved") : t("goal_planner_badge_in_progress")}
    </div>
  );
}
