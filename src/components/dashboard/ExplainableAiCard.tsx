import { motion } from "framer-motion";

import {
  BrainCircuit,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Target,
  PieChart,
  Clock3,
  CircleHelp,
} from "lucide-react";

import type {
  AnalysisResult,
  AnalysisSignal,
} from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui/primitives";

import { InfoBadge } from "@/components/ui/InfoBadge";

import { useLanguage } from "@/context/languageContext";

import {
  type ConfidenceResult,
} from "@/lib/calculatorEngine";

function investorTypeLabel(
  type: string,
  t: (key: string, fallback?: string) => string
) {
  switch (type) {
    case "conservative":
      return t("investor_type_conservative", "Conservative");
    case "balanced":
      return t("investor_type_balanced", "Balanced");
    case "growth":
      return t("investor_type_growth", "Growth");
    case "dividend":
      return t("investor_type_dividend", "Dividend");
    case "passive":
      return t("investor_type_passive", "Passive");
    case "value":
      return t("investor_type_value", "Value");
    default:
      return type;
  }
}

function riskBandLabel(
  band: string | undefined,
  t: (key: string, fallback?: string) => string
) {
  switch (band) {
    case "low":
      return t("risk_band_low", "Low");
    case "medium":
      return t("risk_band_medium", "Medium");
    case "high":
      return t("risk_band_high", "High");
    default:
      return band ?? t("risk_band_medium", "Medium");
  }
}


// =====================================================
// Explainable AI Card
// =====================================================

export function ExplainableAiCard({

  result,

}:{

  result:AnalysisResult;

}){

  const { t } = useLanguage();

  const signals =
    result.explainability?.signals ?? [];


  const scenario =
    result.scenario;


  const metrics =
    result.portfolioMetrics;


  const goal =
    result.goalPlan;


  /*
   * Confidence is now derived primarily from the
   * scenario engine instead of artificially counting
   * explanation signals.
   */
  const confidence =
    clamp(
      Number(
        scenario?.confidence ?? 0
      ),
      0,
      100
    );

  const confidenceLevel =
    (scenario?.confidenceLevel as ConfidenceResult["level"]) ?? "medium";

  const confidenceReasons =
    scenario?.confidenceReasons ?? [];


  const riskScore =
    clamp(
      Number(
        result.riskScore ?? 0
      ),
      0,
      10
    );


  const progress =
    goal
      ? clamp(
          Number(
            goal.progressPercentage ?? 0
          ),
          0,
          100
        )
      : 0;


  function signalLabel(
    signal:AnalysisSignal
  ){

    switch(signal.type){

      case "risk":
        return t("xai_signal_type_risk", "Risk");

      case "horizon":
        return t("xai_signal_type_horizon", "Investment Horizon");

      case "portfolio":
        return t("xai_signal_type_portfolio", "Investment Portfolio");

      case "goal":
        return t("xai_signal_type_goal", "Goal");

      case "rule":
        return t("xai_signal_type_rule", "Analysis");

      default:
        return signal.title;

    }

  }


  return (

    <motion.div

      initial={{
        opacity:0,
        y:16,
      }}

      animate={{
        opacity:1,
        y:0,
      }}

      transition={{
        duration:0.4,
      }}

    >

      <Card
        className="
          overflow-hidden
          border-primary/20
          bg-gradient-to-br
          from-primary/5
          via-card
          to-transparent
        "
      >

        {/* =====================================================
            Header
        ===================================================== */}

        <CardHeader>

          <div
            className="
              flex
              items-center
              gap-2
              text-primary
            "
          >

            <BrainCircuit
              className="
                h-5
                w-5
              "
            />

            <span
              className="
                text-xs
                font-bold
                uppercase
                tracking-wide
              "
            >
              {t("xai_title", "Explainable AI Engine")}
            </span>

          </div>


          <div
            className="
              mt-2
              flex
              items-center
              gap-2
            "
          >

            <CardTitle
              className="
                text-xl
              "
            >
              {t("xai_subtitle", "Why did the system reach this conclusion?")}
            </CardTitle>

            <InfoBadge
              description={t("xai_info", "The Explainable AI layer displays the key factors that influenced the investor analysis, portfolio allocation, and financial planning.")}
            />

          </div>


          <p
            className="
              mt-2
              max-w-2xl
              text-sm
              leading-relaxed
              text-muted-foreground
            "
          >
            {t("xai_desc", "The system breaks down the analysis process into understandable factors instead of showing only a final result.")}
          </p>

        </CardHeader>


        <CardContent
          className="
            space-y-5
          "
        >

          {/* =====================================================
              AI Summary
          ===================================================== */}

          <div
            className="
              rounded-2xl
              border
              border-primary/20
              bg-primary/[0.04]
              p-5
            "
          >

            <div
              className="
                mb-3
                flex
                items-center
                gap-2
              "
            >

              <Sparkles
                className="
                  h-4
                  w-4
                  text-primary
                "
              />

              <p
                className="
                  font-semibold
                "
              >
                {t("xai_summary", "AI Summary")}
              </p>

            </div>


            <p
              className="
                text-sm
                leading-relaxed
                text-muted-foreground
              "
            >
              {
                result.aiNarration.profileSummary ??
                result.explainability.summary ??
                t("xai_summary_default", "The system completed an investor profile analysis.")
              }
            </p>

          </div>


          {/* =====================================================
              Core Explainability Metrics
          ===================================================== */}

          <div
            className="
              grid
              grid-cols-1
              gap-4
              md:grid-cols-2
              lg:grid-cols-4
            "
          >

            {/* Risk */}

            <div
              className="
                rounded-2xl
                border
                bg-background
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-muted-foreground
                "
              >

                <ShieldCheck
                  className="
                    h-4
                    w-4
                  "
                />

                <span
                  className="
                    text-xs
                  "
                >
                  {t("xai_risk_label", "Risk Score")}
                </span>

              </div>


              <p
                className="
                  mt-3
                  text-2xl
                  font-black
                "
              >
                {riskScore}/10
              </p>


              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                {
                  riskBandLabel(
                    result.riskDescription?.band,
                    t
                  ) ??
                  t("xai_risk_default", "Educational risk level")
                }
              </p>

            </div>


            {/* Confidence */}

            <div
              className="
                rounded-2xl
                border
                bg-background
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-muted-foreground
                "
              >

                <CircleHelp
                  className="
                    h-4
                    w-4
                  "
                />

                <span
                  className="
                    text-xs
                  "
                >
                  {t("xai_confidence_label", "Confidence")}
                </span>

              </div>


              <p
                className="
                  mt-3
                  text-2xl
                  font-black
                "
              >
                {confidence}%
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  font-medium
                  text-muted-foreground
                "
              >
                {confidenceLevel === "high"
                  ? t("dashboard_confidence_high", "High")
                  : confidenceLevel === "medium"
                    ? t("dashboard_confidence_medium", "Medium")
                    : t("dashboard_confidence_low", "Low")}
              </p>

              {confidenceReasons.length > 0 && (
                <div
                  className="
                    mt-3
                    flex
                    flex-wrap
                    gap-1.5
                  "
                >
                  {confidenceReasons.map((reason) => (
                    <span
                      key={reason}
                      className="
                        rounded-full
                        border
                        border-border
                        bg-muted/50
                        px-2
                        py-0.5
                        text-[10px]
                        font-medium
                        text-muted-foreground
                      "
                    >
                      {reason.endsWith("_missing")
                        ? t(`confidence_reason_${reason}`, reason)
                        : t(`confidence_reason_${reason}`, reason)}
                    </span>
                  ))}
                </div>
              )}


              <div
                className="
                  mt-2
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-muted
                "
              >

                <motion.div
                  initial={{
                    width:0,
                  }}
                  animate={{
                    width:`${confidence}%`,
                  }}
                  transition={{
                    duration:0.8,
                  }}
                  className="
                    h-full
                    rounded-full
                    bg-primary
                  "
                />

              </div>

            </div>


            {/* Portfolio */}

            <div
              className="
                rounded-2xl
                border
                bg-background
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-muted-foreground
                "
              >

                <PieChart
                  className="
                    h-4
                    w-4
                  "
                />

                <span
                  className="
                    text-xs
                  "
                >
                  {t("xai_equity_label", "Equity Exposure")}
                </span>

              </div>


              <p
                className="
                  mt-3
                  text-2xl
                  font-black
                "
              >
                {
                  metrics
                    ? `${Math.round(metrics.equityExposure)}%`
                    : "-"
                }
              </p>


              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                {t("xai_equity_sub", "Based on asset allocation")}
              </p>

            </div>


            {/* Goal */}

            <div
              className="
                rounded-2xl
                border
                bg-background
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-muted-foreground
                "
              >

                <Target
                  className="
                    h-4
                    w-4
                  "
                />

                <span
                  className="
                    text-xs
                  "
                >
                  {t("xai_progress_label", "Progress to Goal")}
                </span>

              </div>


              <p
                className="
                  mt-3
                  text-2xl
                  font-black
                "
              >
                {
                  goal
                    ? `${Math.round(progress)}%`
                    : "-"
                }
              </p>


              <p
                className="
                  mt-1
                  text-xs
                  text-muted-foreground
                "
              >
                {
                  goal
                    ? formatMoney(
                        goal.expectedFinalValue
                      )
                    : t("xai_progress_sub_no_goal", "No goal defined")
                }
              </p>

            </div>

          </div>


          {/* =====================================================
              Investor Classification
          ===================================================== */}

          <div
            className="
              grid
              grid-cols-1
              gap-4
              md:grid-cols-2
            "
          >

            <div
              className="
                rounded-2xl
                border
                bg-background
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <TrendingUp
                  className="
                    h-4
                    w-4
                    text-primary
                  "
                />

                <p
                  className="
                    font-semibold
                  "
                >
                  {t("xai_investor_type", "Investor Type")}
                </p>

              </div>


              <div
                className="
                  mt-3
                "
              >

                <Badge
                  variant="outline"
                >
                  {investorTypeLabel(result.investor.type, t)}
                </Badge>

              </div>


              <p
                className="
                  mt-3
                  text-sm
                  leading-relaxed
                  text-muted-foreground
                "
              >
                {result.investor.reason}
              </p>

            </div>


            <div
              className="
                rounded-2xl
                border
                bg-background
                p-5
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <Clock3
                  className="
                    h-4
                    w-4
                    text-primary
                  "
                />

                <p
                  className="
                    font-semibold
                  "
                >
                  {t("xai_horizon", "Investment Horizon")}
                </p>

              </div>


              <p
                className="
                  mt-3
                  text-lg
                  font-bold
                "
              >
                {
                  scenario?.years
                    ? `${scenario.years} ${t("xai_horizon_years", "years")}`
                    : t("xai_horizon_unset", "Not set")
                }
              </p>


              <p
                className="
                  mt-2
                  text-sm
                  leading-relaxed
                  text-muted-foreground
                "
              >
                {
                  result.horizonExplanation ??
                  t("xai_horizon_default", "The horizon affects how the system interprets volatility and time.")
                }
              </p>

            </div>

          </div>


          {/* =====================================================
              Decision Signals
          ===================================================== */}

          <div>

            <div
              className="
                mb-3
                flex
                items-center
                gap-2
              "
            >

              <Target
                className="
                  h-4
                  w-4
                  text-primary
                "
              />

              <p
                className="
                  text-xs
                  font-bold
                  text-muted-foreground
                "
              >
                {t("xai_signals_title", "Factors that influenced the analysis")}
              </p>

            </div>


            {
              signals.length === 0

                ?

                (
                  <div
                    className="
                      rounded-xl
                      border
                      p-4
                      text-sm
                      text-muted-foreground
                    "
                  >
                    {t("xai_signals_empty", "No factors found to display.")}
                  </div>
                )

                :

                (
                  <div
                    className="
                      grid
                      grid-cols-1
                      gap-3
                      md:grid-cols-2
                    "
                  >

                    {
                      signals.map(
                        (
                          signal,
                          index
                        ) => (

                          <motion.div
                            key={
                              `${signal.title}-${index}`
                            }

                            initial={{
                              opacity:0,
                              y:8,
                            }}

                            animate={{
                              opacity:1,
                              y:0,
                            }}

                            transition={{
                              duration:0.25,
                              delay:index * 0.04,
                            }}

                            className="
                              rounded-xl
                              border
                              bg-background
                              p-4
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                justify-between
                                gap-2
                              "
                            >

                              <Badge
                                variant="outline"
                              >
                                {
                                  signalLabel(
                                    signal
                                  )
                                }
                              </Badge>

                              <span
                                className="
                                  text-[10px]
                                  text-muted-foreground
                                "
                              >
                                {signal.type ?? "analysis"}
                              </span>

                            </div>


                            <p
                              className="
                                mt-3
                                text-sm
                                leading-relaxed
                                text-muted-foreground
                              "
                            >
                              {signal.description}
                            </p>

                          </motion.div>

                        )
                      )
                    }

                  </div>
                )

            }

          </div>


          {/* =====================================================
              Portfolio Explanation
          ===================================================== */}

          <div
            className="
              rounded-2xl
              border
              bg-card
              p-5
            "
          >

            <div
              className="
                mb-3
                flex
                items-center
                gap-2
              "
            >

              <PieChart
                className="
                  h-4
                  w-4
                  text-primary
                "
              />

              <p
                className="
                  font-semibold
                "
              >
                {t("xai_portfolio_title", "Why does the portfolio look like this?")}
              </p>

            </div>


            <p
              className="
                text-sm
                leading-relaxed
                text-muted-foreground
              "
            >
              {
                result.aiNarration.portfolioSummary
              }
            </p>


            {
              metrics &&

              (
                <div
                  className="
                    mt-4
                    grid
                    grid-cols-1
                    gap-3
                    sm:grid-cols-3
                  "
                >

                  <div
                    className="
                      rounded-xl
                      border
                      bg-background
                      p-3
                    "
                  >

                    <p
                      className="
                        text-xs
                        text-muted-foreground
                      "
                    >
                      {t("xai_metric_diversification", "Diversification")}
                    </p>

                    <p
                      className="
                        mt-1
                        font-bold
                      "
                    >
                      {metrics.diversification}
                    </p>

                  </div>


                  <div
                    className="
                      rounded-xl
                      border
                      bg-background
                      p-3
                    "
                  >

                    <p
                      className="
                        text-xs
                        text-muted-foreground
                      "
                    >
                      {t("xai_metric_expected_return", "Expected Return")}
                    </p>

                    <p
                      className="
                        mt-1
                        font-bold
                      "
                    >
                      {metrics.expectedReturn}%
                    </p>

                  </div>


                  <div
                    className="
                      rounded-xl
                      border
                      bg-background
                      p-3
                    "
                  >

                    <p
                      className="
                        text-xs
                        text-muted-foreground
                      "
                    >
                      {t("xai_metric_largest_position", "Key Position")}
                    </p>

                    <p
                      className="
                        mt-1
                        font-bold
                      "
                    >
                      {metrics.largestPosition}
                    </p>

                  </div>

                </div>
              )
            }

          </div>


          {/* =====================================================
              Educational Disclaimer
          ===================================================== */}

          <div
            className="
              border-t
              pt-5
              text-xs
              leading-relaxed
              text-muted-foreground
            "
          >
            {t("xai_disclaimer", "⚠️ The Explainable AI layer is for educational explanation of the analysis process only. It does not constitute investment advice, a guaranteed forecast, or financial consulting.")}
          </div>


          <div
            className="
              flex
              items-center
              gap-2
              text-xs
              text-muted-foreground
            "
          >

            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-primary
              "
            />

            {t("xai_source_label", "Source:")}
            {" "}
            {t("xai_source", "InvestED Explainable AI Educational Engine")}

          </div>

        </CardContent>

      </Card>

    </motion.div>

  );

}


// =====================================================
// Helpers
// =====================================================

function formatMoney(
  value:number
){

  return new Intl.NumberFormat(
    "he-IL",
    {
      style:"currency",
      currency:"ILS",
      maximumFractionDigits:0,
    }
  ).format(value);

}


function clamp(
  value:number,
  min:number,
  max:number
){

  return Math.min(
    Math.max(value,min),
    max
  );

}
