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


// =====================================================
// Types
// =====================================================

interface Props {
  targetAmount: number | null;

  goalDescription?: string;

  currentAmount: number;

  years: number;

  requiredMonthlyContribution: number;

  expectedFinalValue: number;

  progressPercentage: number;

  achievable: boolean;

  gap?: number;
}


// =====================================================
// Helpers
// =====================================================

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}


function formatMoney(value: number): string {
  const safeValue = safeNumber(value);

  return new Intl.NumberFormat(
    "he-IL",
    {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }
  ).format(safeValue);
}


function formatCompactMoney(value: number): string {
  const safeValue = Math.max(
    safeNumber(value),
    0
  );

  if (safeValue >= 1_000_000) {
    return `${(
      safeValue / 1_000_000
    ).toFixed(2)}M ₪`;
  }

  if (safeValue >= 1_000) {
    return `${Math.round(
      safeValue / 1_000
    )}K ₪`;
  }

  return formatMoney(safeValue);
}


function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    Math.max(
      safeNumber(value),
      min
    ),
    max
  );
}


// =====================================================
// Goal Planner Pro
// =====================================================

export function GoalPlannerCard({

  targetAmount,

  goalDescription,

  currentAmount,

  years,

  requiredMonthlyContribution,

  expectedFinalValue,

  progressPercentage,

  achievable,

  gap,

}: Props) {

  const safeCurrentAmount =
    Math.max(
      safeNumber(currentAmount),
      0
    );


  const safeExpectedFinalValue =
    Math.max(
      safeNumber(expectedFinalValue),
      0
    );


  const safeTargetAmount =
    targetAmount !== null
      ? Math.max(
          safeNumber(targetAmount),
          0
        )
      : null;


  const safeYears =
    Math.max(
      Math.round(
        safeNumber(years)
      ),
      0
    );


  const safeMonthlyContribution =
    Math.max(
      safeNumber(
        requiredMonthlyContribution
      ),
      0
    );


  // ---------------------------------------------------
  // Progress
  // ---------------------------------------------------

  const progress =
    clamp(
      progressPercentage,
      0,
      100
    );


  // ---------------------------------------------------
  // Goal Status
  // ---------------------------------------------------

  const goalReached =
    safeTargetAmount !== null &&
    safeExpectedFinalValue >=
      safeTargetAmount;


  const effectiveAchievable =
    goalReached ||
    achievable;


  // ---------------------------------------------------
  // Gap
  // ---------------------------------------------------

  const calculatedGap =
    safeTargetAmount !== null
      ? Math.max(
          safeTargetAmount -
            safeExpectedFinalValue,
          0
        )
      : 0;


  const gapToGoal =
    gap !== undefined
      ? Math.max(
          safeNumber(gap),
          0
        )
      : calculatedGap;


  // ---------------------------------------------------
  // Estimated Contributions
  //
  // Educational approximation:
  // current capital + future monthly deposits.
  // It intentionally does NOT represent investment
  // return attribution.
  // ---------------------------------------------------

  const estimatedFutureContributions =
    safeMonthlyContribution *
    12 *
    safeYears;


  const estimatedCapitalBase =
    safeCurrentAmount +
    estimatedFutureContributions;


  const estimatedGrowth =
    Math.max(
      safeExpectedFinalValue -
        estimatedCapitalBase,
      0
    );


  // ---------------------------------------------------
  // Goal Progress Label
  // ---------------------------------------------------

  const progressLabel =
    goalReached
      ? "היעד הושג"
      : progress >= 75
        ? "קרוב ליעד"
        : progress >= 40
          ? "התקדמות טובה"
          : "בתחילת הדרך";


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

      className="
        mt-6
        overflow-hidden
        rounded-3xl
        border
        border-primary/20
        bg-gradient-to-br
        from-card
        via-card
        to-primary/[0.04]
        shadow-sm
      "
    >

      {/* =================================================
          Header
      ================================================= */}

      <div
        className="
          border-b
          border-border/60
          px-6
          py-5
        "
      >

        <div
          className="
            flex
            items-start
            gap-3
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-primary/10
            "
          >

            <Target
              className="
                h-6
                w-6
                text-primary
              "
            />

          </div>


          <div className="min-w-0 flex-1">

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >

              <h3
                className="
                  text-2xl
                  font-bold
                  tracking-tight
                "
              >
                🎯 Goal Planner Pro
              </h3>

              <Sparkles
                className="
                  h-4
                  w-4
                  text-primary
                "
              />

            </div>


            <p
              className="
                mt-1
                text-sm
                leading-relaxed
                text-muted-foreground
              "
            >
              תכנון יעד פיננסי לפי הון קיים,
              זמן, הפקדות והנחות תשואה.
            </p>

          </div>

        </div>

      </div>


      {/* =================================================
          Goal Hero
      ================================================= */}

      <div
        className="
          px-6
          pt-6
        "
      >

        <div
          className="
            rounded-3xl
            border
            border-primary/20
            bg-primary/[0.04]
            p-5
          "
        >

          <div
            className="
              flex
              flex-col
              gap-6
              md:flex-row
              md:items-end
              md:justify-between
            "
          >

            {/* Goal */}

            <div className="min-w-0">

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-sm
                  font-medium
                  text-muted-foreground
                "
              >

                <Target
                  className="
                    h-4
                    w-4
                    shrink-0
                    text-primary
                  "
                />

                <span>
                  {goalDescription ??
                    "יעד פיננסי"}
                </span>

              </div>


              <p
                className="
                  mt-2
                  text-4xl
                  font-black
                  tracking-tight
                  text-primary
                  md:text-5xl
                "
              >

                {
                  safeTargetAmount !== null
                    ? formatCompactMoney(
                        safeTargetAmount
                      )
                    : goalDescription ??
                      "יעד פיננסי"
                }

              </p>


              {safeTargetAmount !== null && (

                <p
                  className="
                    mt-2
                    text-xs
                    text-muted-foreground
                  "
                >
                  יעד הון משוער בסוף התקופה
                </p>

              )}

            </div>


            {/* Progress */}

            <div
              className="
                w-full
                md:w-[260px]
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  text-sm
                "
              >

                <span
                  className="
                    text-muted-foreground
                  "
                >
                  {progressLabel}
                </span>

                <span
                  className="
                    font-bold
                  "
                >
                  {Math.round(progress)}%
                </span>

              </div>


              <div
                className="
                  mt-2
                  h-3
                  overflow-hidden
                  rounded-full
                  bg-muted
                "
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="התקדמות ליעד"
              >

                <motion.div
                  initial={{
                    width: 0,
                  }}

                  animate={{
                    width: `${progress}%`,
                  }}

                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                  }}

                  className="
                    h-full
                    rounded-full
                    bg-primary
                  "
                />

              </div>


              <div
                className="
                  mt-2
                  flex
                  justify-between
                  text-[11px]
                  text-muted-foreground
                "
              >

                <span>0%</span>

                <span>100%</span>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          Core Metrics
      ================================================= */}

      <div
        className="
          grid
          grid-cols-1
          gap-4
          px-6
          pt-4
          md:grid-cols-3
        "
      >

        {/* Future Value */}

        <MetricCard
          icon={
            <TrendingUp
              className="
                h-4
                w-4
              "
            />
          }
          label="שווי עתידי משוער"
          value={formatMoney(
            safeExpectedFinalValue
          )}
          description="לפי ההנחות הנוכחיות"
        />


        {/* Current Capital */}

        <MetricCard
          icon={
            <Wallet
              className="
                h-4
                w-4
              "
            />
          }
          label="הון קיים"
          value={formatMoney(
            safeCurrentAmount
          )}
          description="נקודת הפתיחה"
        />


        {/* Horizon */}

        <MetricCard
          icon={
            <CalendarDays
              className="
                h-4
                w-4
              "
            />
          }
          label="אופק השקעה"
          value={`${safeYears} שנים`}
          description="תקופת הסימולציה"
        />

      </div>


      {/* =================================================
          Goal Gap
      ================================================= */}

      {safeTargetAmount !== null && (

        <div
          className="
            px-6
            pt-4
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              rounded-2xl
              border
              border-border/70
              bg-muted/30
              p-4
              sm:flex-row
              sm:items-center
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-background
              "
            >

              {
                goalReached

                  ?

                  <CheckCircle2
                    className="
                      h-5
                      w-5
                      text-primary
                    "
                  />

                  :

                  <ArrowDown
                    className="
                      h-5
                      w-5
                      text-muted-foreground
                    "
                  />
              }

            </div>


            <div
              className="
                min-w-0
                flex-1
              "
            >

              <p
                className="
                  text-sm
                  text-muted-foreground
                "
              >
                {goalReached
                  ? "היעד הושג לפי הסימולציה"
                  : "פער משוער ליעד"}
              </p>


              <p
                className="
                  mt-1
                  text-xl
                  font-bold
                "
              >
                {
                  goalReached
                    ? formatMoney(0)
                    : formatMoney(
                        gapToGoal
                      )
                }
              </p>

            </div>


            <BadgeStatus
              reached={goalReached}
            />

          </div>

        </div>

      )}


      {/* =================================================
          Monthly Contribution
      ================================================= */}

      <div
        className="
          px-6
          pt-4
        "
      >

        <div
          className="
            rounded-2xl
            border
            border-primary/20
            bg-primary/[0.05]
            p-5
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              text-sm
              font-medium
              text-muted-foreground
            "
          >

            <CircleDollarSign
              className="
                h-5
                w-5
                text-primary
              "
            />

            הפקדה חודשית נדרשת

          </div>


          <div
            className="
              mt-2
              flex
              flex-col
              gap-1
              sm:flex-row
              sm:items-baseline
              sm:gap-3
            "
          >

            <p
              className="
                text-3xl
                font-black
                text-primary
              "
            >
              {formatMoney(
                safeMonthlyContribution
              )}
            </p>


            <span
              className="
                text-sm
                text-muted-foreground
              "
            >
              בחודש
            </span>

          </div>


          <p
            className="
              mt-2
              text-xs
              leading-relaxed
              text-muted-foreground
            "
          >
            הסכום המחושב הדרוש לעמידה ביעד
            לפי ההנחות הנוכחיות.
          </p>

        </div>

      </div>


      {/* =================================================
          Projection Composition
      ================================================= */}

      <div
        className="
          px-6
          pt-4
        "
      >

        <div
          className="
            rounded-2xl
            border
            bg-background/60
            p-5
          "
        >

          <div
            className="
              mb-4
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
              איך הסימולציה מגיעה לשווי הזה?
            </p>

          </div>


          <div
            className="
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-3
            "
          >

            <MiniMetric
              label="הון התחלתי"
              value={formatMoney(
                safeCurrentAmount
              )}
            />


            <MiniMetric
              label="הפקדות עתידיות"
              value={formatMoney(
                estimatedFutureContributions
              )}
            />


            <MiniMetric
              label="צמיחה משוערת"
              value={formatMoney(
                estimatedGrowth
              )}
            />

          </div>


          <div
            className="
              mt-4
              flex
              items-start
              gap-2
              text-xs
              leading-relaxed
              text-muted-foreground
            "
          >

            <Info
              className="
                mt-0.5
                h-3.5
                w-3.5
                shrink-0
              "
            />

            <span>
              הפירוט הוא המחשה חינוכית של מבנה
              הסימולציה ואינו מהווה תחזית מובטחת
              או חישוב של תשואה בפועל.
            </span>

          </div>

        </div>

      </div>


      {/* =================================================
          Status
      ================================================= */}

      <div
        className="
          px-6
          pt-4
        "
      >

        <div
          className={`
            rounded-2xl
            border
            p-5
            ${
              effectiveAchievable
                ? "border-green-500/30 bg-green-500/10"
                : "border-yellow-500/30 bg-yellow-500/10"
            }
          `}
        >

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

            {
              effectiveAchievable

                ?

                <CheckCircle2
                  className="
                    mt-0.5
                    h-6
                    w-6
                    shrink-0
                    text-green-500
                  "
                />

                :

                <AlertTriangle
                  className="
                    mt-0.5
                    h-6
                    w-6
                    shrink-0
                    text-yellow-500
                  "
                />
            }


            <div className="min-w-0">

              <p
                className="
                  font-bold
                "
              >

                {
                  goalReached

                    ? "🎉 היעד הושג לפי הסימולציה"

                    : achievable

                      ? "היעד נראה אפשרי לפי ההנחות הנוכחיות"

                      : "ייתכן שנדרש שינוי בהפקדה או בתקופה"
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

                שווי עתידי משוער:

                {" "}

                <span
                  className="
                    font-bold
                    text-foreground
                  "
                >
                  {formatMoney(
                    safeExpectedFinalValue
                  )}
                </span>

              </p>

            </div>

          </div>

        </div>

      </div>


      {/* =================================================
          Disclaimer
      ================================================= */}

      <div
        className="
          px-6
          pb-6
          pt-5
        "
      >

        <div
          className="
            border-t
            pt-4
            text-xs
            leading-relaxed
            text-muted-foreground
          "
        >

          ⚠️ סימולציה חינוכית בלבד.
          אינה מהווה ייעוץ השקעות או הבטחת תשואה.
          התוצאות תלויות בהנחות שהוזנו ובתשואה
          ההיפותטית שנבחרה.

        </div>

      </div>

    </motion.div>

  );
}


// =====================================================
// Reusable Metric Card
// =====================================================

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

    <div
      className="
        rounded-2xl
        border
        bg-background/70
        p-4
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-primary/20
        hover:shadow-sm
      "
    >

      <div
        className="
          flex
          items-center
          gap-2
          text-sm
          text-muted-foreground
        "
      >

        {icon}

        {label}

      </div>


      <p
        className="
          mt-3
          break-words
          text-2xl
          font-bold
        "
      >
        {value}
      </p>


      <p
        className="
          mt-1
          text-xs
          text-muted-foreground
        "
      >
        {description}
      </p>

    </div>

  );
}


// =====================================================
// Mini Metric
// =====================================================

function MiniMetric({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div
      className="
        rounded-xl
        border
        bg-muted/20
        p-3
      "
    >

      <p
        className="
          text-xs
          text-muted-foreground
        "
      >
        {label}
      </p>


      <p
        className="
          mt-1
          break-words
          font-bold
        "
      >
        {value}
      </p>

    </div>

  );
}


// =====================================================
// Goal Status Badge
// =====================================================

function BadgeStatus({

  reached,

}: {

  reached: boolean;

}) {

  return (

    <div
      className={`
        shrink-0
        rounded-full
        border
        px-3
        py-1
        text-xs
        font-semibold
        ${
          reached
            ? "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400"
            : "border-border bg-background text-muted-foreground"
        }
      `}
    >

      {
        reached
          ? "היעד הושג"
          : "בתהליך"
      }

    </div>

  );
}
