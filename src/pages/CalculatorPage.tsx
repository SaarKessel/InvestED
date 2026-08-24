import { useState } from "react";

import {
  analyzeFinancialScenarioWithProjection,
  computeProjection,
  ASSET_CLASSES
} from "@/lib/calculatorEngine";

import type {
  UnifiedFinancialAnalysis
} from "@/lib/calculatorEngine";

import {
  generateAIInsight
} from "@/lib/aiExplanationEngine";

import {
  AIInsightCard
} from "@/components/AIInsightCard";

import {
  InvestmentInsightCard
} from "@/components/InvestmentInsightCard";

import {
  AIExplanationCard
} from "@/components/AIExplanationCard";

import {
  InvestmentGrowthChart
} from "@/components/InvestmentGrowthChart";

import {
  GoalPlannerCard
} from "@/components/GoalPlannerCard";


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMoney(value: number) {
  return new Intl.NumberFormat(
    "he-IL",
    {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0
    }
  ).format(value || 0);
}


function goalLabel(goal?: string) {
  switch (goal) {
    case "growth":
      return "בניית הון";

    case "retirement":
      return "פרישה מוקדמת";

    case "child":
      return "חיסכון לילדים";

    case "home":
      return "רכישת דירה";

    case "wealth":
      return "עצמאות כלכלית";

    default:
      return "השקעה כללית";
  }
}


// ---------------------------------------------------------------------------
// Calculator Page
// ---------------------------------------------------------------------------

export default function CalculatorPage() {
  const [input, setInput] = useState("");

  const [analysis, setAnalysis] =
    useState<UnifiedFinancialAnalysis | null>(null);


  // -------------------------------------------------------------------------
  // Calculate Scenario
  // -------------------------------------------------------------------------

  function calculate() {
    if (!input.trim()) {
      return;
    }

    const result =
      analyzeFinancialScenarioWithProjection(
        input
      );

    if (
      !Number.isFinite(
        result.scenario.initialInvestment
      ) ||
      !Number.isFinite(
        result.scenario.monthlyContribution
      ) ||
      !Number.isFinite(
        result.scenario.years
      ) ||
      !Number.isFinite(
        result.scenario.annualReturnPct
      )
    ) {
      return;
    }

    setAnalysis(result);
  }


  // -------------------------------------------------------------------------
  // Unified Financial Analysis
  // -------------------------------------------------------------------------

  const scenario =
    analysis?.scenario ?? null;

  const projection =
    analysis?.projection ?? null;

  const goalPlan =
    analysis?.goalPlan ?? null;


  // -------------------------------------------------------------------------
  // Asset Comparison
  // -------------------------------------------------------------------------

  const comparison = scenario
    ? ASSET_CLASSES.map(asset => {
        const result =
          computeProjection(
            scenario.initialInvestment,
            scenario.monthlyContribution,
            scenario.years,
            asset.annualReturnPct
          );

        return {
          ...asset,
          result
        };
      })
    : [];


  const bestAsset =
    comparison.length > 0
      ? comparison.reduce(
          (a, b) =>
            a.result.finalBalance >
            b.result.finalBalance
              ? a
              : b
        )
      : null;


  // -------------------------------------------------------------------------
  // AI Insight
  // -------------------------------------------------------------------------

  const aiInsight =
    scenario && projection
      ? generateAIInsight(
          scenario,
          projection
        )
      : null;


  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div
      dir="rtl"
      className="
        min-h-screen
        bg-[#050B16]
        text-[#F8FAFC]
        p-4
        md:p-6
      "
    >

      <div
        className="
          mx-auto
          max-w-6xl
        "
      >

        {/* -----------------------------------------------------------------
            Hero
        ------------------------------------------------------------------ */}

        <div
          className="
            relative
            mb-10
            overflow-hidden
            text-center
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-0
              h-40
              w-80
              -translate-x-1/2
              rounded-full
              bg-emerald-400/10
              blur-3xl
            "
          />

          <div
            className="
              relative
              mb-5
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-emerald-400/30
              bg-emerald-400/10
              px-4
              py-2
              text-sm
              font-medium
              text-emerald-300
            "
          >
            <span aria-hidden="true">
              ✨
            </span>

            Smart Financial Scenario Engine
          </div>


          <h1
            className="
              relative
              mb-5
              text-3xl
              font-bold
              tracking-tight
              text-[#F8FAFC]
              sm:text-4xl
              md:text-5xl
              lg:text-6xl
            "
          >
            מחשבון ההשקעות החכם של{" "}

            <span className="gradient-text">
              InvestED
            </span>
          </h1>


          <p
            className="
              relative
              mx-auto
              max-w-2xl
              text-base
              leading-7
              text-[#CBD5E1]
              md:text-lg
              md:leading-8
            "
          >
            תאר תרחיש השקעה בשפה טבעית וקבל סימולציה,
            ניתוח של צמיחת ההון ותובנות מבוססות AI.
          </p>


          <div
            className="
              relative
              mt-4
              flex
              flex-wrap
              items-center
              justify-center
              gap-x-5
              gap-y-2
              text-sm
              text-[#CBD5E1]
            "
          >
            <span>
              📊 סימולציה
            </span>

            <span>
              📈 תחזית צמיחה
            </span>

            <span>
              🤖 Explainable AI
            </span>
          </div>

        </div>


        {/* -----------------------------------------------------------------
            Scenario Input
        ------------------------------------------------------------------ */}

        <div
          className="
            relative
            mb-8
            overflow-hidden
            rounded-3xl
            border
            border-[#334155]
            bg-[#0B1628]
            p-5
            shadow-soft
            md:p-7
          "
        >

          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-emerald-400/70
              to-transparent
            "
          />


          <div
            className="
              mb-5
              flex
              flex-col
              gap-4
              md:flex-row
              md:items-center
              md:justify-between
            "
          >

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-400/10
                    text-sm
                  "
                  aria-hidden="true"
                >
                  ✨
                </span>


                <h2
                  className="
                    text-xl
                    font-bold
                    text-[#F8FAFC]
                  "
                >
                  מה תרצה לבדוק?
                </h2>

              </div>


              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-[#CBD5E1]
                "
              >
                כתוב את תרחיש ההשקעה שלך בשפה חופשית.
              </p>

            </div>


            <span
              className="
                hidden
                items-center
                rounded-full
                border
                border-[#334155]
                bg-[#050B16]
                px-3
                py-1.5
                text-xs
                font-medium
                text-[#CBD5E1]
                md:inline-flex
              "
            >
              Natural Language
            </span>

          </div>


          {/* Scenario Input */}

          <div
            className="
              relative
              rounded-2xl
              border
              border-[#475569]
              bg-[#050B16]
              transition-all
              duration-200
              focus-within:border-emerald-400
              focus-within:ring-4
              focus-within:ring-emerald-400/10
            "
          >

            <textarea
              value={input}
              onChange={
                e => setInput(e.target.value)
              }
              placeholder='לדוגמה: "יש לי 300 אלף להשקיע ל-15 שנה במדד S&P 500"'
              aria-label="תרחיש השקעה"
              className="
                min-h-36
                w-full
                resize-none
                rounded-2xl
                bg-transparent
                p-5
                text-base
                leading-7
                text-[#F8FAFC]
                placeholder:text-[#94A3B8]
                outline-none
                focus-visible:ring-2
                focus-visible:ring-emerald-400
              "
            />


            <div
              className="
                pointer-events-none
                absolute
                bottom-3
                left-4
                text-xs
                text-[#94A3B8]
              "
            >
              כתוב טבעי — המערכת תנתח את התרחיש
            </div>

          </div>


          {/* Example scenarios */}

          <div className="mt-6">

            <div
              className="
                mb-3
                flex
                items-center
                justify-between
                gap-3
              "
            >

              <p
                className="
                  text-sm
                  font-medium
                  text-[#CBD5E1]
                "
              >
                נסה תרחיש לדוגמה
              </p>


              <span
                className="
                  text-xs
                  text-[#94A3B8]
                "
              >
                לחיצה תכניס את התרחיש אוטומטית
              </span>

            </div>


            <div
              className="
                flex
                flex-wrap
                gap-2
              "
            >

              <button
                type="button"
                onClick={() =>
                  setInput(
                    "יש לי 300 אלף שקל להשקיע ל-15 שנה במדד S&P 500"
                  )
                }
                className="
                  rounded-full
                  border
                  border-[#475569]
                  bg-[#050B16]
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-[#CBD5E1]
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-emerald-400
                  hover:bg-emerald-400/10
                  hover:text-emerald-300
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-emerald-400
                  active:translate-y-0
                "
              >
                📈 בניית הון
              </button>


              <button
                type="button"
                onClick={() =>
                  setInput(
                    "אני רוצה להגיע ל-2 מיליון שקל בעוד 15 שנה"
                  )
                }
                className="
                  rounded-full
                  border
                  border-[#475569]
                  bg-[#050B16]
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-[#CBD5E1]
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-emerald-400
                  hover:bg-emerald-400/10
                  hover:text-emerald-300
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-emerald-400
                  active:translate-y-0
                "
              >
                🎯 יעד פיננסי
              </button>


              <button
                type="button"
                onClick={() =>
                  setInput(
                    "אני רוצה להשקיע 5000 שקל בחודש במשך 20 שנה"
                  )
                }
                className="
                  rounded-full
                  border
                  border-[#475569]
                  bg-[#050B16]
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-[#CBD5E1]
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-emerald-400
                  hover:bg-emerald-400/10
                  hover:text-emerald-300
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-emerald-400
                  active:translate-y-0
                "
              >
                💰 הפקדה חודשית
              </button>

            </div>

          </div>


          {/* Bottom action row */}

          <div
            className="
              mt-7
              flex
              flex-col
              gap-4
              border-t
              border-[#334155]
              pt-5
              md:flex-row
              md:items-center
              md:justify-between
            "
          >

            <p
              className="
                max-w-xl
                text-sm
                leading-6
                text-[#CBD5E1]
              "
            >
              💡 הסימולציה מיועדת למטרות לימוד והמחשה בלבד
              ואינה מהווה ייעוץ השקעות או הבטחת תשואה.
            </p>


            <button
              type="button"
              onClick={calculate}
              disabled={!input.trim()}
              className="
                group
                w-full
                rounded-xl
                bg-emerald-400
                px-8
                py-3.5
                font-bold
                text-[#02110B]
                shadow-lg
                shadow-emerald-400/10
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:bg-emerald-300
                hover:shadow-emerald-400/20
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-emerald-300
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[#0B1628]
                active:translate-y-0
                disabled:cursor-not-allowed
                disabled:opacity-50
                disabled:hover:translate-y-0
                md:w-auto
              "
            >

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                "
              >
                נתח תרחיש

                <span
                  className="
                    transition-transform
                    duration-200
                    group-hover:translate-x-0.5
                  "
                  aria-hidden="true"
                >
                  🚀
                </span>

              </span>

            </button>

          </div>

        </div>


        {/* -----------------------------------------------------------------
            Empty State
        ------------------------------------------------------------------ */}

        {!scenario && (
          <div
            className="
              mb-8
              grid
              gap-4
              md:grid-cols-4
            "
          >

            <MiniCard
              label="📊 סימולציה"
              value="שווי עתידי של ההשקעה"
            />

            <MiniCard
              label="📈 צמיחה"
              value="השפעת הריבית דריבית"
            />

            <MiniCard
              label="🎯 יעדים"
              value="בדיקת התקדמות ליעד"
            />

            <MiniCard
              label="🤖 Explainable AI"
              value="הסבר ברור לתרחיש"
            />

          </div>
        )}


        {/* -----------------------------------------------------------------
            Results
        ------------------------------------------------------------------ */}

        {scenario && projection && (
          <div
            className="
              space-y-8
            "
          >

            {/* -------------------------------------------------------------
                Investment Insight Card
            ------------------------------------------------------------- */}

            <InvestmentInsightCard
              finalBalance={
                projection.finalBalance
              }

              totalContributed={
                projection.totalContributed
              }

              growth={
                projection.growth
              }

              years={
                scenario.years
              }

              assetLabel={
                ASSET_CLASSES.find(
                  a =>
                    a.key ===
                    scenario.assetClassKey
                )?.label ??
                scenario.assetClassKey
              }

              annualReturnPct={
                scenario.annualReturnPct
              }

              monthlyContribution={
                scenario.monthlyContribution
              }

              goal={
                scenario.goal
              }
            />


            {/* -------------------------------------------------------------
                Goal Planner
            ------------------------------------------------------------- */}

            {goalPlan && (
              <GoalPlannerCard
                targetAmount={
                  goalPlan.targetAmount
                }

                currentAmount={
                  scenario.initialInvestment
                }

                years={
                  scenario.years
                }

                requiredMonthlyContribution={
                  goalPlan.requiredMonthlyContribution
                }

                monthlyContribution={
                  goalPlan.monthlyContribution
                }

                expectedFinalValue={
                  goalPlan.expectedFinalValue
                }

                progressPercentage={
                  goalPlan.progressPercentage
                }

                achievable={
                  goalPlan.progressPercentage >= 100
                }

                gap={
                  goalPlan.gap
                }
              />
            )}


            {/* -------------------------------------------------------------
                Explainable AI
            ------------------------------------------------------------- */}

            <AIExplanationCard
              initialInvestment={
                scenario.initialInvestment
              }

              monthlyContribution={
                scenario.monthlyContribution
              }

              years={
                scenario.years
              }

              annualReturnPct={
                scenario.annualReturnPct
              }

              assetLabel={
                ASSET_CLASSES.find(
                  a =>
                    a.key ===
                    scenario.assetClassKey
                )?.label ??
                scenario.assetClassKey
              }

              riskProfile={
                aiInsight?.riskLevel
              }

              goal={
                scenario.goal
              }

              confidence={
                scenario.confidence
              }
            />


            {/* -------------------------------------------------------------
                AI Insight
            ------------------------------------------------------------- */}

            {aiInsight && (
              <AIInsightCard
                insight={aiInsight}
              />
            )}


            {/* -------------------------------------------------------------
                Growth Chart
            ------------------------------------------------------------- */}

            <div
              className="
                rounded-3xl
                border
                border-[#334155]
                bg-[#0B1628]
                p-5
                md:p-6
              "
            >

              <h2
                className="
                  mb-5
                  text-xl
                  font-bold
                  text-[#F8FAFC]
                  md:text-2xl
                "
              >
                📈 גרף צמיחת השקעה
              </h2>


              <InvestmentGrowthChart
                data={
                  projection.series
                }
              />

            </div>


            {/* -------------------------------------------------------------
                Scenario Understanding
            ------------------------------------------------------------- */}

            <div
              className="
                rounded-3xl
                border
                border-[#334155]
                bg-[#0B1628]
                p-5
                md:p-6
              "
            >

              <h2
                className="
                  mb-5
                  text-xl
                  font-bold
                  text-[#F8FAFC]
                  md:text-2xl
                "
              >
                🤖 InvestED הבין אותך
              </h2>


              <div
                className="
                  grid
                  gap-4
                  md:grid-cols-4
                "
              >

                <MiniCard
                  label="נכס"
                  value={
                    ASSET_CLASSES.find(
                      asset =>
                        asset.key ===
                        scenario.assetClassKey
                    )?.label ??
                    scenario.assetClassKey
                  }
                />


                <MiniCard
                  label="תשואה משוערת"
                  value={
                    `${scenario.annualReturnPct}%`
                  }
                />


                <MiniCard
                  label="אופק השקעה"
                  value={
                    `${scenario.years} שנים`
                  }
                />


                <MiniCard
                  label="מטרה"
                  value={
                    goalLabel(
                      scenario.goal
                    )
                  }
                />

              </div>

            </div>


            {/* -------------------------------------------------------------
                Investment Insight
            ------------------------------------------------------------- */}

            <div
              className="
                rounded-3xl
                border
                border-[#334155]
                bg-[#0B1628]
                p-5
                md:p-6
              "
            >

              <h2
                className="
                  mb-5
                  text-xl
                  font-bold
                  text-[#F8FAFC]
                  md:text-2xl
                "
              >
                🧠 תובנת InvestED
              </h2>


              <p
                className="
                  text-base
                  leading-8
                  text-[#CBD5E1]
                  md:text-lg
                "
              >

                השקעה של{" "}

                <span
                  className="
                    font-bold
                    text-[#F8FAFC]
                  "
                >
                  {
                    formatMoney(
                      scenario.initialInvestment
                    )
                  }
                </span>

                {" "}עם הפקדה חודשית של{" "}

                <span
                  className="
                    font-bold
                    text-[#F8FAFC]
                  "
                >
                  {
                    formatMoney(
                      scenario.monthlyContribution
                    )
                  }
                </span>

                {" "}צפויה להגיע לשווי עתידי של{" "}

                <span
                  className="
                    font-bold
                    text-emerald-300
                  "
                >
                  {
                    formatMoney(
                      projection.finalBalance
                    )
                  }
                </span>

              </p>

            </div>


            {/* -------------------------------------------------------------
                Asset Comparison
            ------------------------------------------------------------- */}

            <div
              className="
                rounded-3xl
                border
                border-[#334155]
                bg-[#0B1628]
                p-5
                md:p-6
              "
            >

              <h2
                className="
                  mb-6
                  text-xl
                  font-bold
                  text-[#F8FAFC]
                  md:text-2xl
                "
              >
                📈 השוואת מסלולי השקעה
              </h2>


              <p
                className="
                  mb-6
                  text-base
                  leading-7
                  text-[#CBD5E1]
                "
              >
                אותה השקעה, מסלולים שונים — לראות כיצד
                התשואה משפיעה לאורך זמן.
              </p>


              <div
                className="
                  grid
                  gap-5
                  md:grid-cols-2
                "
              >

                {comparison.map(asset => (

                  <div
                    key={
                      asset.key
                    }
                    className={`
                      rounded-2xl
                      border
                      p-5
                      transition-all
                      ${
                        asset.key ===
                        scenario.assetClassKey

                          ? "border-emerald-400 bg-emerald-400/10"

                          : asset.key ===
                            bestAsset?.key

                            ? "border-yellow-400 bg-yellow-400/10"

                            : "border-[#334155] bg-[#050B16]"
                      }
                    `}
                  >

                    <h3
                      className="
                        text-xl
                        font-bold
                        text-[#F8FAFC]
                      "
                    >
                      {
                        asset.label
                      }
                    </h3>


                    <p
                      className="
                        mt-3
                        text-sm
                        text-[#CBD5E1]
                      "
                    >
                      תשואה שנתית:
                      {" "}
                      <span
                        className="
                          font-semibold
                          text-[#F8FAFC]
                        "
                      >
                        {
                          asset.annualReturnPct
                        }%
                      </span>
                    </p>


                    <p
                      className="
                        mt-4
                        text-3xl
                        font-bold
                        tracking-tight
                        text-[#F8FAFC]
                      "
                    >
                      {
                        formatMoney(
                          asset.result.finalBalance
                        )
                      }
                    </p>


                    <p
                      className="
                        mt-3
                        text-base
                        font-bold
                        text-emerald-300
                      "
                    >
                      רווח:
                      {" "}
                      {
                        formatMoney(
                          asset.result.growth
                        )
                      }
                    </p>


                    {asset.key === bestAsset?.key && (
                      <span
                        className="
                          mt-3
                          inline-flex
                          items-center
                          gap-1
                          text-sm
                          font-bold
                          text-yellow-300
                        "
                      >
                        🏆 מוביל
                      </span>
                    )}

                  </div>

                ))}

              </div>

            </div>


            {/* -------------------------------------------------------------
                Investment Summary
            ------------------------------------------------------------- */}

            <div
              className="
                rounded-3xl
                border
                border-[#334155]
                bg-[#0B1628]
                p-5
                md:p-6
              "
            >

              <h2
                className="
                  mb-5
                  text-xl
                  font-bold
                  text-[#F8FAFC]
                  md:text-2xl
                "
              >
                📊 סיכום השקעה
              </h2>


              <div
                className="
                  grid
                  gap-5
                  md:grid-cols-3
                "
              >

                <InfoCard
                  title="סה״כ הפקדה"
                  value={
                    formatMoney(
                      projection.totalContributed
                    )
                  }
                />


                <InfoCard
                  title="רווח"
                  value={
                    formatMoney(
                      projection.growth
                    )
                  }
                />


                <InfoCard
                  title="שווי לאחר אינפלציה"
                  value={
                    formatMoney(
                      projection.realValueAfterInflation
                    )
                  }
                />

              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}


// ---------------------------------------------------------------------------
// UI Components
// ---------------------------------------------------------------------------

function InfoCard({
  title,
  value
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[#334155]
        bg-[#050B16]
        p-5
      "
    >

      <p
        className="
          mb-2
          text-sm
          font-medium
          text-[#CBD5E1]
        "
      >
        {title}
      </p>


      <p
        className="
          text-2xl
          font-bold
          tracking-tight
          text-[#F8FAFC]
        "
      >
        {value}
      </p>

    </div>
  );
}


function MiniCard({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        border-[#334155]
        bg-[#050B16]
        p-4
      "
    >

      <p
        className="
          mb-2
          text-sm
          font-medium
          leading-5
          text-[#CBD5E1]
        "
      >
        {label}
      </p>


      <p
        className="
          text-base
          font-bold
          leading-6
          text-[#F8FAFC]
        "
      >
        {value}
      </p>

    </div>
  );
}
