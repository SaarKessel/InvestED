import { useState } from "react";
import {
  analyzeFinancialScenarioWithProjection,
  computeProjection,
  ASSET_CLASSES
} from "@/lib/calculatorEngine";
import type { UnifiedFinancialAnalysis } from "@/lib/calculatorEngine";
import { generateAIInsight } from "@/lib/aiExplanationEngine";
import { AIInsightCard } from "@/components/AIInsightCard";
import { InvestmentInsightCard } from "@/components/InvestmentInsightCard";
import { AIExplanationCard } from "@/components/AIExplanationCard";
import { InvestmentGrowthChart } from "@/components/InvestmentGrowthChart";
import { GoalPlannerCard } from "@/components/GoalPlannerCard";
import { useLanguage } from "@/context/languageContext";

function goalLabel(goal?: string, t?: (key: string, fallback?: string) => string) {
  switch (goal) {
    case "growth":
      return t ? t("calc_ex_growth", "Wealth Building") : "Wealth Building";
    case "retirement":
      return t ? t("calc_ex_early_retirement", "Early Retirement") : "Early Retirement";
    case "child":
      return t ? t("calc_ex_children", "Saving for Children") : "Saving for Children";
    case "home":
      return t ? t("calc_ex_house", "Home Purchase") : "Home Purchase";
    case "wealth":
      return t ? t("calc_ex_independence", "Financial Independence") : "Financial Independence";
    default:
      return t ? t("calc_ex_general", "General Investing") : "General Investing";
  }
}

export default function CalculatorPage() {
  const { t, language } = useLanguage();
  const locale = language === "he" ? "he-IL" : "en-US";

  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<UnifiedFinancialAnalysis | null>(null);

  function formatMoney(value: number) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0
    }).format(value || 0);
  }

  function calculate() {
    if (!input.trim()) return;

    const result = analyzeFinancialScenarioWithProjection(input, language);

    if (
      !Number.isFinite(result.scenario.initialInvestment) ||
      !Number.isFinite(result.scenario.monthlyContribution) ||
      !Number.isFinite(result.scenario.years) ||
      !Number.isFinite(result.scenario.annualReturnPct)
    ) {
      return;
    }

    setAnalysis(result);
  }

  const scenario = analysis?.scenario ?? null;
  const projection = analysis?.projection ?? null;
  const goalPlan = analysis?.goalPlan ?? null;

  const assetLabel = t(
    ASSET_CLASSES.find(a => a.key === scenario?.assetClassKey)?.i18nKey ?? `asset_${scenario?.assetClassKey}`,
    ASSET_CLASSES.find(a => a.key === scenario?.assetClassKey)?.label ?? scenario?.assetClassKey ?? ""
  );

  const comparison = scenario
    ? ASSET_CLASSES.map(asset => {
        const result = computeProjection(
          scenario.initialInvestment,
          scenario.monthlyContribution,
          scenario.years,
          asset.annualReturnPct
        );
        return { ...asset, result };
      })
    : [];

  const bestAsset = comparison.length > 0
    ? comparison.reduce((a, b) => a.result.finalBalance > b.result.finalBalance ? a : b)
    : null;

  const aiInsight = scenario && projection ? generateAIInsight(scenario, projection, language) : null;

  return (
    <div dir={language === "he" ? "rtl" : "ltr"} className="min-h-screen bg-background text-foreground p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <div className="relative mb-10 overflow-hidden text-center">
          <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <span aria-hidden="true">✨</span>
            {t("calc_hero_badge")}
          </div>
          <h1 className="relative mb-5 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {t("calc_hero_title")}{" "}
            <span className="gradient-text">InvestED</span>
          </h1>
          <p className="relative mx-auto max-w-2xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
            {t("calc_hero_desc")}
          </p>
          <div className="relative mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>{t("calc_hero_sim_full")}</span>
            <span>{t("calc_hero_growth_full")}</span>
            <span>{t("calc_hero_xai_full")}</span>
          </div>
        </div>

        {/* Scenario Input */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-soft md:p-7">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-sm" aria-hidden="true">✨</span>
                <h2 className="text-xl font-bold">{t("calc_box_title_what")}</h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("calc_box_subtitle")}
              </p>
            </div>
            <span className="hidden items-center rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground md:inline-flex">
              {t("calc_natural_language")}
            </span>
          </div>

          <div className="relative rounded-2xl border border-border bg-background transition-all duration-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t("calc_box_placeholder")}
              aria-label={t("calc_aria_scenario")}
              className="min-h-36 w-full resize-none rounded-2xl bg-transparent p-5 text-base leading-7 text-foreground placeholder:text-muted-foreground/60 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <div className="pointer-events-none absolute bottom-3 left-4 text-xs text-muted-foreground">
              {t("calc_hint_natural")}
            </div>
          </div>

          {/* Example scenarios */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-muted-foreground">
                {t("calc_try_example")}
              </p>
              <span className="text-xs text-muted-foreground">
                {t("calc_click_to_load")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInput(t("calc_example_growth_text"))}
                className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-0"
              >
                {t("calc_example_growth_label")}
              </button>
              <button
                type="button"
                onClick={() => setInput(t("calc_example_goal_text"))}
                className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-0"
              >
                {t("calc_example_goal_label")}
              </button>
              <button
                type="button"
                onClick={() => setInput(t("calc_example_monthly_text"))}
                className="rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:translate-y-0"
              >
                {t("calc_example_monthly_label")}
              </button>
            </div>
          </div>

          {/* Bottom action row */}
          <div className="mt-7 flex flex-col gap-4 border-t border-border pt-5 md:flex-row md:items-center md:justify-between">
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {t("calc_disclaimer_full")}
            </p>
            <button
              type="button"
              onClick={calculate}
              disabled={!input.trim()}
              className="group w-full rounded-xl bg-primary px-8 py-3.5 font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                {t("calc_btn_run_full")}
                <span className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                  🚀
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {!scenario && (
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <MiniCard label={t("calc_empty_sim_label")} value={t("calc_empty_sim_value")} />
            <MiniCard label={t("calc_empty_growth_label")} value={t("calc_empty_growth_value")} />
            <MiniCard label={t("calc_empty_goals_label")} value={t("calc_empty_goals_value")} />
            <MiniCard label={t("calc_empty_xai_label")} value={t("calc_empty_xai_value")} />
          </div>
        )}

        {/* Results */}
        {scenario && projection && (
          <div className="space-y-8">
            <InvestmentInsightCard
              finalBalance={projection.finalBalance}
              totalContributed={projection.totalContributed}
              growth={projection.growth}
              years={scenario.years}
              assetLabel={assetLabel}
              annualReturnPct={scenario.annualReturnPct}
              monthlyContribution={scenario.monthlyContribution}
              goal={scenario.goal}
            />

            {goalPlan && (
              <GoalPlannerCard
                targetAmount={goalPlan.targetAmount}
                currentAmount={scenario.initialInvestment}
                years={scenario.years}
                requiredMonthlyContribution={goalPlan.requiredMonthlyContribution}
                monthlyContribution={goalPlan.monthlyContribution}
                expectedFinalValue={goalPlan.expectedFinalValue}
                progressPercentage={goalPlan.progressPercentage}
                achievable={goalPlan.progressPercentage >= 100}
                gap={goalPlan.gap}
              />
            )}

            <AIExplanationCard
              initialInvestment={scenario.initialInvestment}
              monthlyContribution={scenario.monthlyContribution}
              years={scenario.years}
              annualReturnPct={scenario.annualReturnPct}
              assetLabel={assetLabel}
              riskProfile={aiInsight?.riskLevel}
              goal={scenario.goal}
              confidence={scenario.confidence}
            />

            {aiInsight && <AIInsightCard insight={aiInsight} />}

            <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
              <h2 className="mb-5 text-xl font-bold md:text-2xl">
                {t("calc_chart_title_full")}
              </h2>
              <InvestmentGrowthChart data={projection.series} />
            </div>

            {/* Scenario Understanding */}
            <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
              <h2 className="mb-5 text-xl font-bold md:text-2xl">
                {t("calc_scenario_understood_title")}
              </h2>
              <div className="grid gap-4 md:grid-cols-4">
                <MiniCard
                  label={t("calc_mini_asset")}
                  value={assetLabel}
                />
                <MiniCard
                  label={t("calc_mini_expected_return")}
                  value={`${scenario.annualReturnPct}%`}
                />
                <MiniCard
                  label={t("calc_mini_horizon")}
                  value={t("calc_mini_horizon_value").replace("{years}", String(scenario.years))}
                />
                <MiniCard
                  label={t("calc_mini_goal")}
                  value={goalLabel(scenario.goal, t)}
                />
              </div>
            </div>

            {/* Investment Insight */}
            <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
              <h2 className="mb-5 text-xl font-bold md:text-2xl">
                {t("calc_insight_title_full")}
              </h2>
              <p className="text-base leading-8 text-muted-foreground md:text-lg">
                {t("calc_insight_intro")}{" "}
                <span className="font-bold text-foreground">{formatMoney(scenario.initialInvestment)}</span>
                {" "}{t("calc_insight_monthly_with")}{" "}
                <span className="font-bold text-foreground">{formatMoney(scenario.monthlyContribution)}</span>
                {" "}{t("calc_insight_future")}{" "}
                <span className="font-bold text-success">{formatMoney(projection.finalBalance)}</span>
              </p>
            </div>

            {/* Asset Comparison */}
            <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
              <h2 className="mb-6 text-xl font-bold md:text-2xl">
                {t("calc_comparison_title_full")}
              </h2>
              <p className="mb-6 text-base leading-7 text-muted-foreground">
                {t("calc_comparison_subtitle_full")}
              </p>
              <div className="grid gap-5 md:grid-cols-2">
                {comparison.map(asset => (
                  <div
                    key={asset.key}
                    className={`rounded-2xl border p-5 transition-all ${
                      asset.key === scenario.assetClassKey
                        ? "border-primary bg-primary/10"
                        : asset.key === bestAsset?.key
                          ? "border-yellow-400 bg-yellow-400/10"
                          : "border-border bg-background"
                    }`}
                  >
                     <h3 className="text-xl font-bold text-foreground">{t(asset.i18nKey, asset.label)}</h3>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {t("calc_comparison_annual")}{" "}
                      <span className="font-semibold text-foreground">{asset.annualReturnPct}%</span>
                    </p>
                    <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                      {formatMoney(asset.result.finalBalance)}
                    </p>
                    <p className="mt-3 text-base font-bold text-success">
                      {t("calc_comparison_profit")}{" "}
                      {formatMoney(asset.result.growth)}
                    </p>
                     {asset.key === scenario.assetClassKey && (
                       <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary">
                         {t("calc_comparison_selected", "Your selected scenario")}
                       </span>
                     )}
                  </div>
                ))}
              </div>
            </div>

            {/* Investment Summary */}
            <div className="rounded-3xl border border-border bg-card p-5 md:p-6">
              <h2 className="mb-5 text-xl font-bold md:text-2xl">
                {t("calc_summary_title_full")}
              </h2>
              <div className="grid gap-5 md:grid-cols-3">
                <InfoCard title={t("calc_summary_total_contributed")} value={formatMoney(projection.totalContributed)} />
                <InfoCard title={t("calc_summary_profit")} value={formatMoney(projection.growth)} />
                <InfoCard title={t("calc_summary_real_value")} value={formatMoney(projection.realValueAfterInflation)} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="mb-2 text-sm font-medium leading-5 text-muted-foreground">{label}</p>
      <p className="text-base font-bold leading-6 text-foreground">{value}</p>
    </div>
  );
}
