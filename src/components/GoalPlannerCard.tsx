import { motion } from "framer-motion";

import {
  Target,
  TrendingUp,
  Wallet,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  ArrowDown,
  CircleDollarSign
} from "lucide-react";



// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {

  targetAmount:number | null;

  goalDescription?:string;

  currentAmount:number;

  years:number;

  requiredMonthlyContribution:number;

  expectedFinalValue:number;

  progressPercentage:number;

  achievable:boolean;

}



// ---------------------------------------------------------------------------
// Money Formatter
// ---------------------------------------------------------------------------

function formatMoney(
  value:number
){

  return new Intl.NumberFormat(
    "he-IL",
    {
      style:"currency",
      currency:"ILS",
      maximumFractionDigits:0
    }
  ).format(value);

}



// ---------------------------------------------------------------------------
// Compact Money Formatter
// ---------------------------------------------------------------------------

function formatCompactMoney(
  value:number
){

  if(value >= 1_000_000){

    return `${(value / 1_000_000).toFixed(2)}M ₪`;

  }

  if(value >= 1_000){

    return `${Math.round(value / 1_000)}K ₪`;

  }

  return formatMoney(value);

}



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoalPlannerCard({

  targetAmount,

  goalDescription,

  currentAmount,

  years,

  requiredMonthlyContribution,

  expectedFinalValue,

  progressPercentage,

  achievable

}:Props){



  const progress = Math.min(
    Math.max(progressPercentage,0),
    100
  );



  const gapToGoal =
    targetAmount !== null
      ? Math.max(targetAmount - expectedFinalValue,0)
      : 0;



  return (

    <motion.div

      initial={{
        opacity:0,
        y:20
      }}

      animate={{
        opacity:1,
        y:0
      }}

      transition={{
        duration:0.4
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

      {/* ----------------------------------------------------------------- */}
      {/* Header */}
      {/* ----------------------------------------------------------------- */}

      <div className="
        border-b
        border-border/60
        px-6
        py-5
      ">

        <div className="
          flex
          items-start
          gap-3
        ">

          <div className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-primary/10
          ">

            <Target className="
              h-6
              w-6
              text-primary
            "/>

          </div>


          <div>

            <h3 className="
              text-2xl
              font-bold
              tracking-tight
            ">

              🎯 Goal Planner

            </h3>


            <p className="
              mt-1
              text-sm
              text-muted-foreground
            ">

              תכנון יעד פיננסי לפי הון קיים, זמן ותשואה משוערת.

            </p>

          </div>

        </div>

      </div>



      {/* ----------------------------------------------------------------- */}
      {/* Main Goal Summary */}
      {/* ----------------------------------------------------------------- */}

      <div className="
        px-6
        pt-6
      ">

        <div className="
          rounded-3xl
          border
          border-primary/20
          bg-primary/[0.04]
          p-5
        ">

          <div className="
            flex
            flex-col
            gap-5
            md:flex-row
            md:items-end
            md:justify-between
          ">

            {/* Target */}

            <div>

              <div className="
                flex
                items-center
                gap-2
                text-sm
                font-medium
                text-muted-foreground
              ">

                <Target className="
                  h-4
                  w-4
                  text-primary
                "/>

                יעד פיננסי

              </div>


              <p className="
                mt-2
                text-4xl
                font-black
                tracking-tight
                text-primary
                md:text-5xl
              ">

                {

                  targetAmount !== null

                    ?

                    formatCompactMoney(targetAmount)

                    :

                    goalDescription ?? "יעד פיננסי"

                }

              </p>

            </div>



            {/* Progress */}

            <div className="
              min-w-[160px]
              md:text-left
            ">

              <div className="
                flex
                items-center
                justify-between
                text-sm
              ">

                <span className="
                  text-muted-foreground
                ">

                  התקדמות

                </span>


                <span className="
                  font-bold
                ">

                  {Math.round(progress)}%

                </span>

              </div>


              <div className="
                mt-2
                h-3
                overflow-hidden
                rounded-full
                bg-muted
              ">

                <motion.div

                  initial={{
                    width:0
                  }}

                  animate={{
                    width:`${progress}%`
                  }}

                  transition={{
                    duration:0.8,
                    ease:"easeOut"
                  }}

                  className="
                    h-full
                    rounded-full
                    bg-primary
                  "

                />

              </div>

            </div>

          </div>

        </div>

      </div>



      {/* ----------------------------------------------------------------- */}
      {/* Core Metrics */}
      {/* ----------------------------------------------------------------- */}

      <div className="
        grid
        grid-cols-1
        gap-4
        px-6
        pt-4
        md:grid-cols-3
      ">


        {/* Projected */}

        <div className="
          rounded-2xl
          border
          bg-background/70
          p-4
        ">

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <TrendingUp className="
              h-4
              w-4
            "/>

            שווי עתידי משוער

          </div>


          <p className="
            mt-3
            text-2xl
            font-bold
          ">

            {formatMoney(expectedFinalValue)}

          </p>


          <p className="
            mt-1
            text-xs
            text-muted-foreground
          ">

            לפי ההנחות הנוכחיות

          </p>

        </div>



        {/* Current */}

        <div className="
          rounded-2xl
          border
          bg-background/70
          p-4
        ">

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <Wallet className="
              h-4
              w-4
            "/>

            הון קיים

          </div>


          <p className="
            mt-3
            text-2xl
            font-bold
          ">

            {formatMoney(currentAmount)}

          </p>


          <p className="
            mt-1
            text-xs
            text-muted-foreground
          ">

            נקודת הפתיחה

          </p>

        </div>



        {/* Years */}

        <div className="
          rounded-2xl
          border
          bg-background/70
          p-4
        ">

          <div className="
            flex
            items-center
            gap-2
            text-sm
            text-muted-foreground
          ">

            <CalendarDays className="
              h-4
              w-4
            "/>

            אופק השקעה

          </div>


          <p className="
            mt-3
            text-2xl
            font-bold
          ">

            {years} שנים

          </p>


          <p className="
            mt-1
            text-xs
            text-muted-foreground
          ">

            עד להשגת היעד

          </p>

        </div>

      </div>



      {/* ----------------------------------------------------------------- */}
      {/* Gap To Goal */}
      {/* ----------------------------------------------------------------- */}

      {targetAmount !== null && (

        <div className="
          px-6
          pt-4
        ">

          <div className="
            flex
            items-center
            gap-4
            rounded-2xl
            border
            border-border/70
            bg-muted/30
            p-4
          ">

            <div className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-background
            ">

              <ArrowDown className="
                h-5
                w-5
                text-muted-foreground
              "/>

            </div>


            <div className="
              min-w-0
            ">

              <p className="
                text-sm
                text-muted-foreground
              ">

                פער משוער ליעד

              </p>


              <p className="
                mt-1
                text-xl
                font-bold
              ">

                {formatMoney(gapToGoal)}

              </p>

            </div>

          </div>

        </div>

      )}



      {/* ----------------------------------------------------------------- */}
      {/* Required Monthly Contribution */}
      {/* ----------------------------------------------------------------- */}

      <div className="
        px-6
        pt-4
      ">

        <div className="
          rounded-2xl
          border
          border-primary/20
          bg-primary/[0.05]
          p-5
        ">

          <div className="
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-muted-foreground
          ">

            <CircleDollarSign className="
              h-5
              w-5
              text-primary
            "/>

            הפקדה חודשית נדרשת

          </div>


          <div className="
            mt-2
            flex
            flex-col
            gap-1
            sm:flex-row
            sm:items-baseline
            sm:gap-3
          ">

            <p className="
              text-3xl
              font-black
              text-primary
            ">

              {formatMoney(requiredMonthlyContribution)}

            </p>


            <span className="
              text-sm
              text-muted-foreground
            ">

              בחודש

            </span>

          </div>


          <p className="
            mt-2
            text-xs
            text-muted-foreground
          ">

            הסכום המחושב הדרוש לעמידה ביעד לפי ההנחות הנוכחיות.

          </p>

        </div>

      </div>



      {/* ----------------------------------------------------------------- */}
      {/* Status */}
      {/* ----------------------------------------------------------------- */}

      <div className="
        px-6
        pt-4
      ">

        <div

          className={`
            rounded-2xl
            border
            p-5

            ${
              achievable

                ?

                "border-green-500/30 bg-green-500/10"

                :

                "border-yellow-500/30 bg-yellow-500/10"
            }
          `}

        >

          <div className="
            flex
            items-start
            gap-3
          ">

            {

              achievable

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


            <div>

              <p className="
                font-bold
              ">

                {

                  achievable

                    ?

                    "היעד נראה אפשרי לפי ההנחות הנוכחיות"

                    :

                    "ייתכן שנדרש שינוי בהפקדה או בתקופה"

                }

              </p>


              <p className="
                mt-2
                text-sm
                text-muted-foreground
              ">

                שווי עתידי משוער:{" "}

                <span className="
                  font-bold
                  text-foreground
                ">

                  {formatMoney(expectedFinalValue)}

                </span>

              </p>

            </div>

          </div>

        </div>

      </div>



      {/* ----------------------------------------------------------------- */}
      {/* Disclaimer */}
      {/* ----------------------------------------------------------------- */}

      <div className="
        px-6
        pb-6
        pt-5
      ">

        <div className="
          border-t
          pt-4
          text-xs
          leading-relaxed
          text-muted-foreground
        ">

          ⚠️ סימולציה חינוכית בלבד. אינה מהווה ייעוץ השקעות או הבטחת תשואה.

        </div>

      </div>

    </motion.div>

  );

}
