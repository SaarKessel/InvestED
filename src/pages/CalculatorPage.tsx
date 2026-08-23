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

  const [input, setInput] =
    useState("");

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
  //
  // All primary calculator outputs now come from one analysis object.
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

    ?

    ASSET_CLASSES.map(asset => {

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

    :

    [];


  const bestAsset =

    comparison.length > 0

      ?

      comparison.reduce(
        (a, b) =>
          a.result.finalBalance >
          b.result.finalBalance
            ? a
            : b
      )

      :

      null;


  // -------------------------------------------------------------------------
  // AI Insight
  // -------------------------------------------------------------------------

  const aiInsight =

    scenario && projection

      ?

      generateAIInsight(
        scenario,
        projection
      )

      :

      null;





  return (

    <div
      dir="rtl"
      className="
        min-h-screen
        bg-background
        text-foreground
        p-6
      "
    >

      <div
        className="
          max-w-6xl
          mx-auto
        "
      >

        {/* -----------------------------------------------------------------
    Hero
------------------------------------------------------------------ */}

<div
  className="
    mb-10
    text-center
  "
>
  <div
    className="
      inline-flex
      items-center
      gap-2
      rounded-full
      border
      border-emerald-400/20
      bg-emerald-400/10
      px-4
      py-2
      text-sm
      font-medium
      text-emerald-300
      mb-5
    "
  >
    <span>✨</span>
    Smart Financial Scenario Engine
  </div>

  <h1
    className="
      text-4xl
      md:text-5xl
      font-bold
      tracking-tight
      mb-4
    "
  >
    מחשבון ההשקעות החכם של InvestED
  </h1>

  <p
    className="
      max-w-2xl
      mx-auto
      text-base
      md:text-lg
      leading-8
      text-slate-300
    "
  >
    תאר תרחיש השקעה בשפה טבעית וקבל סימולציה,
    ניתוח של צמיחת ההון ותובנות מבוססות AI.
  </p>
</div>


{/* -----------------------------------------------------------------
    Scenario Input
------------------------------------------------------------------ */}

<div
  className="
    bg-card
    border
    border-border
    rounded-3xl
    p-5
    md:p-7
    shadow-soft
    mb-8
  "
>
  <div
    className="
      flex
      items-center
      justify-between
      gap-4
      mb-4
    "
  >
    <div>
      <h2
        className="
          text-xl
          font-bold
          text-white
        "
      >
        מה תרצה לבדוק?
      </h2>

      <p
        className="
          mt-1
          text-sm
          text-slate-400
        "
      >
        כתוב את תרחיש ההשקעה שלך בשפה חופשית.
      </p>
    </div>

    <span
      className="
        hidden
        md:inline-flex
        items-center
        rounded-full
        border
        border-[#1E3A5F]
        bg-[#050B16]
        px-3
        py-1
        text-xs
        text-slate-400
      "
    >
      Natural Language
    </span>
  </div>


  <textarea
    value={input}
    onChange={
      e => setInput(e.target.value)
    }
    placeholder='לדוגמה: "יש לי 300 אלף להשקיע ל-15 שנה במדד S&P 500"'
    className="
      w-full
      min-h-36
      bg-[#050B16]
      border
      border-[#1E3A5F]
      rounded-2xl
      p-5
      text-white
      placeholder:text-slate-500
      outline-none
      resize-none
      transition
      focus:border-emerald-400
      focus:ring-2
      focus:ring-emerald-400/10
    "
  />


  {/* Example scenarios */}

  <div className="mt-5">

    <p
      className="
        text-xs
        font-medium
        text-slate-500
        mb-3
      "
    >
      נסה תרחיש לדוגמה
    </p>

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
          border-[#1E3A5F]
          bg-[#050B16]
          px-4
          py-2
          text-sm
          text-slate-300
          transition
          hover:border-emerald-400/50
          hover:text-emerald-300
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
          border-[#1E3A5F]
          bg-[#050B16]
          px-4
          py-2
          text-sm
          text-slate-300
          transition
          hover:border-emerald-400/50
          hover:text-emerald-300
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
          border-[#1E3A5F]
          bg-[#050B16]
          px-4
          py-2
          text-sm
          text-slate-300
          transition
          hover:border-emerald-400/50
          hover:text-emerald-300
        "
      >
        💰 הפקדה חודשית
      </button>

    </div>

  </div>


  <div
    className="
      mt-6
      flex
      flex-col
      md:flex-row
      md:items-center
      md:justify-between
      gap-4
    "
  >

    <p
      className="
        text-xs
        leading-5
        text-slate-500
        max-w-xl
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
        w-full
        md:w-auto
        bg-emerald-400
        hover:bg-emerald-500
        disabled:opacity-40
        disabled:cursor-not-allowed
        text-black
        font-bold
        px-8
        py-3
        rounded-xl
        transition
        shadow-lg
        shadow-emerald-400/10
      "
    >
      נתח תרחיש 🚀
    </button>

  </div>

</div>


{/* -----------------------------------------------------------------
    Empty State
------------------------------------------------------------------ */}

{
  !scenario &&

  <div
    className="
      grid
      md:grid-cols-4
      gap-4
      mb-8
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
}



        {/* -----------------------------------------------------------------
            Results
        ------------------------------------------------------------------ */}

        {
          scenario &&
          projection &&

          (

            <div
              className="
                space-y-8
              "
            >

              {/* -----------------------------------------------------------
                  Investment Insight Card
              ------------------------------------------------------------ */}

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


              {/* -----------------------------------------------------------
                  Goal Planner
                  
                  Render ONLY when calculatorEngine has
                  resolved a real financial target.

                  This includes:
                  - Explicit target
                  - Retirement income target

                  Normal simulations do NOT display Goal Planner.
              ------------------------------------------------------------ */}

              {
                goalPlan &&

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

              }


              {/* -----------------------------------------------------------
                  Explainable AI
              ------------------------------------------------------------ */}

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


riskLevel={
  aiInsight?.riskLevel
}

goal={
  scenario.goal
}

                confidence={
                  scenario.confidence
                }

              />


              {/* -----------------------------------------------------------
                  AI Insight
              ------------------------------------------------------------ */}

              {
                aiInsight &&

                <AIInsightCard
                  insight={aiInsight}
                />

              }


              {/* -----------------------------------------------------------
                  Growth Chart
              ------------------------------------------------------------ */}

              <div
                className="
                  bg-[#0B1628]
                  border
                  border-[#1E3A5F]
                  rounded-3xl
                  p-6
                "
              >

                <h2
                  className="
                    text-2xl
                    font-bold
                    mb-5
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


              {/* -----------------------------------------------------------
                  Scenario Understanding
              ------------------------------------------------------------ */}

              <div
                className="
                  bg-[#0B1628]
                  border
                  border-[#1E3A5F]
                  rounded-3xl
                  p-6
                "
              >

                <h2
                  className="
                    text-2xl
                    font-bold
                    mb-5
                  "
                >
                  🤖 InvestED הבין אותך
                </h2>


                <div
                  className="
                    grid
                    md:grid-cols-4
                    gap-4
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


              {/* -----------------------------------------------------------
                  Investment Insight
              ------------------------------------------------------------ */}

              <div
                className="
                  bg-card
                  border
                  border-border
                  rounded-3xl
                  p-6
                "
              >

                <h2
                  className="
                    text-2xl
                    font-bold
                    mb-5
                  "
                >
                  🧠 תובנת InvestED
                </h2>


                <p
                  className="
                    leading-8
                    text-slate-300
                  "
                >

                  השקעה של{" "}

                  <span
                    className="
                      font-bold
                      text-white
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
                      text-white
                    "
                  >
                    {
                      formatMoney(
                        scenario.monthlyContribution
                      )
                    }
                  </span>

                  צפויה להגיע לשווי עתידי של{" "}

                  <span
                    className="
                      font-bold
                      text-emerald-400
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


              {/* -----------------------------------------------------------
                  Asset Comparison
              ------------------------------------------------------------ */}

              <div
                className="
                  bg-[#0B1628]
                  border
                  border-[#1E3A5F]
                  rounded-3xl
                  p-6
                "
              >

                <h2
                  className="
                    text-2xl
                    font-bold
                    mb-6
                  "
                >
                  📈 השוואת מסלולי השקעה
                </h2>


                <p
                  className="
                    text-slate-400
                    mb-6
                  "
                >
                  אותה השקעה, מסלולים שונים — לראות כיצד התשואה משפיעה לאורך זמן.
                </p>


                <div
                  className="
                    grid
                    md:grid-cols-2
                    gap-5
                  "
                >

                  {
                    comparison.map(asset => (

                      <div

                        key={
                          asset.key
                        }

                        className={`

                          rounded-2xl

                          border

                          p-5

                          ${
                            asset.key ===
                            scenario.assetClassKey

                              ?

                              "border-emerald-400 bg-emerald-400/10"

                              :

                              asset.key ===
                              bestAsset?.key

                                ?

                                "border-yellow-400 bg-yellow-400/10"

                                :

                                "border-[#1E3A5F] bg-[#050B16]"

                          }

                        `}

                      >

                        <h3
                          className="
                            text-xl
                            font-bold
                          "
                        >
                          {
                            asset.label
                          }
                        </h3>


                        <p
                          className="
                            mt-3
                            text-slate-400
                          "
                        >
                          תשואה שנתית:

                          {" "}

                          {
                            asset.annualReturnPct
                          }%

                        </p>


                        <p
                          className="
                            mt-4
                            text-3xl
                            font-bold
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
                            text-emerald-400
                            font-bold
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


                        {
                          asset.key ===
                          bestAsset?.key &&

                          <span
                            className="
                              text-yellow-400
                              font-bold
                            "
                          >
                            🏆 מוביל
                          </span>
                        }

                      </div>

                    ))
                  }

                </div>

              </div>


              {/* -----------------------------------------------------------
                  Investment Summary
              ------------------------------------------------------------ */}

              <div
                className="
                  bg-[#0B1628]
                  border
                  border-[#1E3A5F]
                  rounded-3xl
                  p-6
                "
              >

                <h2
                  className="
                    text-2xl
                    font-bold
                    mb-5
                  "
                >
                  📊 סיכום השקעה
                </h2>


                <div
                  className="
                    grid
                    md:grid-cols-3
                    gap-5
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

          )
        }

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
        bg-[#050B16]
        border
        border-[#1E3A5F]
        rounded-2xl
        p-5
      "
    >

      <p
        className="
          text-slate-400
          text-sm
          mb-2
        "
      >
        {title}
      </p>


      <p
        className="
          text-2xl
          font-bold
          text-white
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
        bg-[#050B16]
        border
        border-[#1E3A5F]
        rounded-xl
        p-4
      "
    >

      <p
        className="
          text-xs
          text-slate-400
          mb-2
        "
      >
        {label}
      </p>


      <p
        className="
          font-bold
          text-white
        "
      >
        {value}
      </p>

    </div>

  );

}
