import { motion } from "framer-motion";

import {
  PieChart as PieChartIcon,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Coins,
  CalendarDays,
  ShieldCheck,
  BarChart3,
  Sparkles,
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";

import type { ReactNode } from "react";

import type {
  AnalysisResult,
} from "@/types";

import {
  calculatePortfolioMetrics,
} from "@/lib/portfolioIntelligence";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import { BrokerComparisonTable } from "./BrokerComparisonTable";

import { useLanguage } from "@/context/languageContext";
import { formatCurrency } from "@/lib/format";

// =====================================================
// Portfolio Card
// =====================================================

export function PortfolioCard({
  result,
}: {
  result: AnalysisResult;
}) {
  const { t, language } = useLanguage();

  const allocation = result.allocation ?? [];

  const projection = result.projection;

  const metrics = calculatePortfolioMetrics(allocation);

  const currency = result.scenario?.currency ?? result.currency ?? "ILS";

  const growthPercentage =
    projection && projection.finalBalance > 0
      ? Math.min(
          100,
          Math.round(
            (projection.growth / projection.finalBalance) * 100
          )
        )
      : 0;

  const riskLevelKey =
    metrics.riskLevel === "high"
      ? "portfolio_risk_high"
      : metrics.riskLevel === "low"
        ? "portfolio_risk_low"
        : "portfolio_risk_medium";

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
      }}
    >
      <Card className="overflow-hidden border-primary/20">
        {/* =====================================================
        HEADER
        ===================================================== */}

        <CardHeader className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-transparent pb-6">
          <div className="flex items-center gap-2 text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <PieChartIcon className="h-4 w-4" />
            </div>

            <span className="text-xs font-bold uppercase tracking-wide">
              {t("portfolio_intelligence_tag", "Portfolio Intelligence")}
            </span>
          </div>

          <div className="mt-3">
            <CardTitle className="text-2xl md:text-3xl">
              {t("portfolio_title", "הקצאת נכסים וניתוח תיק AI")}
            </CardTitle>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("portfolio_subtitle", "המחשה לימודית של פיזור הנכסים, החשיפה המנייתית וההשפעה האפשרית של זמן וצמיחה על התיק.")}
            </p>
          </div>

          {/* Educational disclaimer */}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/10 p-3.5 text-xs leading-relaxed">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />

            <span>
              {t("portfolio_disclaimer", "הנתונים מוצגים לצורכי לימוד פיננסית בלבד ואינם מהווים המלצת השקעה.")}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* =====================================================
          PROJECTION METRICS
          ===================================================== */}

          {projection && (
            <section>
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />

                  <h3 className="text-sm font-bold">
                    {t("portfolio_projection_title", "תחזית פיננסית")}
                  </h3>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  {t("portfolio_projection_subtitle", "המחשה של התוצאה האפשרית לאורך תקופת ההשקעה.")}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  icon={<Wallet className="h-4 w-4" />}
                  title={t("portfolio_metric_total_contributions", "סה״כ הפקדות")}
                  value={formatCurrency(projection.totalContributed, currency, language)}
                />

                <MetricCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  title={t("portfolio_metric_future_value", "שווי עתידי")}
                  value={formatCurrency(projection.finalBalance, currency, language)}
                  highlight
                />

                <MetricCard
                  icon={<Coins className="h-4 w-4" />}
                  title={t("portfolio_metric_investment_profit", "רווח מהשקעה")}
                  value={formatCurrency(projection.growth, currency, language)}
                  highlight
                />

                <MetricCard
                  icon={<CalendarDays className="h-4 w-4" />}
                  title={t("portfolio_metric_period", "תקופה")}
                  value={
                    result.scenario?.years
                      ? `${result.scenario.years} ${t("xai_horizon_years", "שנים")}`
                      : "-"
                  }
                />
              </div>
            </section>
          )}

          {/* =====================================================
          GROWTH BAR
          ===================================================== */}

          {projection && (
            <section className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">
                    {t("portfolio_growth_contribution_title", "תרומת הצמיחה לשווי הסופי")}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("portfolio_growth_contribution_subtitle", "החלק היחסי של הצמיחה מתוך השווי הסופי.")}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-bold text-primary">
                  {growthPercentage}%
                </span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{
                    width: 0,
                  }}
                  animate={{
                    width: `${growthPercentage}%`,
                  }}
                  transition={{
                    duration: 0.8,
                  }}
                  className="h-full rounded-full gradient-brand"
                />
              </div>
            </section>
          )}

          {/* =====================================================
          PORTFOLIO HEALTH METRICS
          ===================================================== */}

          <section>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />

                <h3 className="text-sm font-bold">
                  {t("portfolio_health_metrics_title", "מדדי תיק")}
                </h3>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {t("portfolio_health_metrics_subtitle", "מדדים חישוביים להמחשת מבנה התיק ורמת החשיפה.")}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard
                icon={
                  <ShieldCheck className="h-4 w-4" />
                }
                title={t("portfolio_metric_diversification", "פיזור תיק")}
                value={`${metrics.diversification}%`}
              />

              <MetricCard
                icon={
                  <BarChart3 className="h-4 w-4" />
                }
                title={t("portfolio_metric_equity_exposure", "חשיפה מנייתית")}
                value={`${metrics.equityExposure}%`}
              />

              <MetricCard
                icon={
                  <ShieldCheck className="h-4 w-4" />
                }
                title={t("portfolio_metric_risk_level", "רמת סיכון")}
                value={t(riskLevelKey, metrics.riskLevel)}
              />
            </div>
          </section>

          {/* =====================================================
          ALLOCATION
          ===================================================== */}

          <section>
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-primary" />

                <h3 className="text-sm font-bold">
                  {t("portfolio_allocation_title", "הקצאת נכסים")}
                </h3>
              </div>

              <p className="mt-1 text-xs text-muted-foreground">
                {t("portfolio_allocation_subtitle", "המחשה ויזואלית של חלוקת הנכסים בתרחיש הלימודי.")}
              </p>
            </div>

            {allocation.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("portfolio_allocation_empty", "No asset allocation found to display.")}
              </div>
            ) : (
              <div className="grid items-center gap-8 md:grid-cols-[minmax(280px,1fr)_minmax(260px,0.9fr)]">
                {/* Chart */}

                <div className="relative h-72 min-w-0">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={allocation}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={62}
                        outerRadius={100}
                        paddingAngle={3}
                        animationDuration={900}
                      >
                        {allocation.map((item) => (
                          <Cell
                            key={item.name}
                            fill={item.color}
                            stroke="transparent"
                          />
                        ))}
                      </Pie>

                      <RTooltip
                        formatter={(
                          value: number,
                          name: string
                        ) => [`${value}%`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center label */}

                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {t("portfolio_assets_label", "נכסים")}
                      </p>

                      <p className="text-xl font-extrabold">
                        {allocation.length}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Allocation list */}

                <div className="space-y-2.5">
                  {allocation.map(
                    (item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{
                          opacity: 0,
                          x: 10,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                        }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.05,
                        }}
                        className="
                          group
                          flex
                          items-center
                          justify-between
                          rounded-xl
                          border
                          bg-card
                          px-4
                          py-3
                          text-sm
                          transition-all
                          duration-200
                          hover:-translate-y-0.5
                          hover:border-primary/30
                          hover:shadow-sm
                        "
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full ring-4 ring-muted/50"
                            style={{
                              backgroundColor:
                                item.color,
                            }}
                          />

                          <span className="truncate font-medium">
                            {item.name}
                          </span>
                        </div>

                        <span className="ml-4 shrink-0 font-bold text-primary">
                          {item.value}%
                        </span>
                      </motion.div>
                    )
                  )}
                </div>
              </div>
            )}
          </section>

          {/* =====================================================
          AI EXPLANATION
          ===================================================== */}

          <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-background to-transparent p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>

              <div>
                <h4 className="text-sm font-bold">
                  {t("portfolio_ai_explanation_title", "למה נבחר המבנה הזה?")}
                </h4>

                <p className="text-xs text-muted-foreground">
                  {t("portfolio_ai_explanation_subtitle", "הסבר לימודי מבוסס AI")}
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground">
              {result.aiNarration.portfolioSummary}
            </p>
          </section>

          {/* =====================================================
          BROKER COMPARISON
          ===================================================== */}

          <section className="border-t border-border/60 pt-7">
            <div className="mb-5">
              <h3 className="text-sm font-bold">
                {t("portfolio_broker_comparison_title", "השוואת ברוקרים")}
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                {t("portfolio_broker_comparison_subtitle", "מידע השוואתי לצורכי למידה והיכרות עם מבנה העלויות.")}
              </p>
            </div>

            <BrokerComparisonTable />
          </section>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Metric Card Component
// =====================================================

function MetricCard({
  icon,
  title,
  value,
  highlight = false,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`
        group
        rounded-2xl
        border
        p-4
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
        ${
          highlight
            ? "border-primary/20 bg-primary/5"
            : "bg-card"
        }
      `}
    >
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={`
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            ${
              highlight
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }
          `}
        >
          {icon}
        </span>

        <span>{title}</span>
      </div>

      <div
        className={`
          text-xl
          font-extrabold
          tracking-tight
          ${
            highlight
              ? "text-primary"
              : "text-foreground"
          }
        `}
      >
        {value}
      </div>
    </div>
  );
}
