import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  RotateCcw,
  BrainCircuit,
  Target,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Activity,
  ArrowDown,
} from "lucide-react";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";
import { useAnalysis } from "@/context/useAnalysis";
import { useLanguage } from "@/context/languageContext";
import { confidenceLabel, dashboardGoalLabel } from "@/lib/format";
import {
  WelcomeCard,
  InvestorTypeCard,
  RiskScoreCard,
  HorizonCard,
  InterestsCard,
} from "@/components/dashboard/ProfileSummaryCards";
import { ExplainableAiCard } from "@/components/dashboard/ExplainableAiCard";
import { StrategiesCard } from "@/components/dashboard/StrategiesCard";
import { PortfolioCard } from "@/components/dashboard/PortfolioCard";
import { MarketDataCard } from "@/components/dashboard/MarketDataCard";
import { ComparisonCard } from "@/components/dashboard/ComparisonCard";
import { ConceptsCard, MistakesCard, RoadmapCard } from "@/components/dashboard/LearningCards";
import { QuizCard } from "@/components/dashboard/QuizCard";
import { GoalPlannerCard } from "@/components/GoalPlannerCard";

export function DashboardPage() {
  const { result, reset } = useAnalysis();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!result) {
      navigate("/start", { replace: true });
    }
  }, [result, navigate]);

  if (!result) return null;

  return (
    <Layout>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-primary/8 via-transparent to-transparent" />

        <div className="container max-w-6xl py-8 md:py-12">
          {/* DASHBOARD HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-8"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
                  <Activity className="h-3.5 w-3.5" />
                  {t("dashboard_intelligence_tag")}
                </div>

                <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  {t("dashboard_header_title")}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                  {t("dashboard_header_subtitle")}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 sm:w-auto"
                onClick={() => {
                  reset();
                  navigate("/start");
                }}
              >
                <RotateCcw className="h-4 w-4" />
                {t("dashboard_reanalyze")}
              </Button>
            </div>
          </motion.div>

          <DisclaimerBanner className="mb-8" />

          {/* AI PROFILE INTELLIGENCE SUMMARY */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <Card className="relative mb-10 overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-transparent shadow-lg">
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

              <CardContent className="relative p-5 sm:p-6 md:p-7">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
                    <BrainCircuit className="h-6 w-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold md:text-xl">
                        {t("dashboard_ai_card_title_full")}
                      </h2>

                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                        {t("dashboard_ai_card_badge")}
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {t("dashboard_ai_card_subtitle_full")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Investor style */}
                  <div className="group rounded-2xl border border-border/80 bg-background/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <TrendingUp className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("dashboard_metric_style")}</p>
                    <p className="mt-1.5 truncate font-bold">
                      {result.investor?.type ?? t("dashboard_metric_default_style")}
                    </p>
                  </div>

                  {/* Risk score */}
                  <div className="group rounded-2xl border border-border/80 bg-background/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("dashboard_metric_risk")}</p>
                    <p className="mt-1.5 text-xl font-extrabold">
                      {result.riskScore ?? 0}
                      <span className="mr-1 text-sm font-medium text-muted-foreground">
                        {t("dashboard_metric_risk_suffix")}
                      </span>
                    </p>
                  </div>

                  {/* Financial goal */}
                  <div className="group rounded-2xl border border-border/80 bg-background/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Target className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("dashboard_metric_goal")}</p>
                    <p className="mt-1.5 truncate font-bold">
                      {dashboardGoalLabel(result.scenario?.goal, t)}
                    </p>
                  </div>

                  {/* AI confidence */}
                  <div className="group rounded-2xl border border-border/80 bg-background/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Sparkles className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs text-muted-foreground">{t("dashboard_metric_confidence")}</p>
                    <p className="mt-1.5 font-bold">
                      {confidenceLabel(result.scenario?.confidence, t)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 hidden items-center justify-center gap-2 text-[11px] text-muted-foreground sm:flex">
                  <span>{t("dashboard_scroll_cue")}</span>
                  <ArrowDown className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* MAIN DASHBOARD */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="grid grid-cols-1 gap-5 lg:grid-cols-2"
          >
            <div className="lg:col-span-2">
              <WelcomeCard result={result} />
            </div>

            <InvestorTypeCard result={result} />
            <RiskScoreCard result={result} />
            <HorizonCard result={result} />
            <InterestsCard result={result} />

            <div className="lg:col-span-2">
              <ExplainableAiCard result={result} />
            </div>

            <div className="lg:col-span-2">
              <PortfolioCard result={result} />
            </div>

            {result.goalPlan && (
              <div className="lg:col-span-2">
                <GoalPlannerCard
                  targetAmount={result.goalPlan.targetAmount}
                  currentAmount={result.goalPlan.currentAmount}
                  years={result.goalPlan.years}
                  requiredMonthlyContribution={result.goalPlan.requiredMonthlyContribution}
                  monthlyContribution={result.goalPlan.monthlyContribution}
                  expectedFinalValue={result.goalPlan.expectedFinalValue}
                  progressPercentage={result.goalPlan.progressPercentage}
                  achievable={result.goalPlan.achievable}
                  gap={result.goalPlan.gap}
                  currency={result.goalPlan.currency}
                />
              </div>
            )}

            <div className="lg:col-span-2">
              <StrategiesCard />
            </div>

            <div className="lg:col-span-2">
              <MarketDataCard interests={result.flags.interests} />
            </div>

            <div className="lg:col-span-2">
              <ComparisonCard />
            </div>

            <div className="lg:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <GraduationCap className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">{t("dashboard_learning_title_full")}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t("dashboard_learning_subtitle_full")}
                    </p>
                  </div>
                </div>
              </div>

              <ConceptsCard />
            </div>

            <div>
              <MistakesCard />
            </div>

            <div>
              <RoadmapCard result={result} />
            </div>

            <div className="lg:col-span-2">
              <QuizCard />
            </div>
          </motion.div>

          <div className="mt-10 text-center">
            <p className="mx-auto max-w-2xl text-xs leading-relaxed text-muted-foreground">
              {t("dashboard_footer_note")}
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
