import { motion } from "framer-motion";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

import {
  TrendingUp,
  Wallet,
  Coins,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Info,
} from "lucide-react";

import type {
  Projection,
} from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";


// =====================================================
// Helpers
// =====================================================

function safeNumber(
  value: number
): number {

  return Number.isFinite(value)
    ? value
    : 0;

}


function formatMoney(
  value: number
): string {

  return new Intl.NumberFormat(
    "he-IL",
    {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }
  ).format(
    safeNumber(value)
  );

}


function formatAxisValue(
  value: number
): string {

  const safeValue =
    safeNumber(value);


  if (
    Math.abs(safeValue) >=
    1_000_000
  ) {

    return `${(
      safeValue /
      1_000_000
    ).toFixed(1)}M`;

  }


  if (
    Math.abs(safeValue) >=
    1_000
  ) {

    return `${Math.round(
      safeValue /
      1_000
    )}K`;

  }


  return `${Math.round(
    safeValue
  )}`;

}


// =====================================================
// Projection Chart Card
// =====================================================

export function ProjectionChartCard({

  projection,

}: {

  projection: Projection;

}) {

  // ---------------------------------------------------
  // Empty State
  // ---------------------------------------------------

  if (
    !projection ||
    !projection.series ||
    projection.series.length === 0
  ) {

    return null;

  }


  // ---------------------------------------------------
  // Safe Metrics
  // ---------------------------------------------------

  const totalContributed =
    Math.max(
      safeNumber(
        projection.totalContributed
      ),
      0
    );


  const growth =
    Math.max(
      safeNumber(
        projection.growth
      ),
      0
    );


  const realValue =
    Math.max(
      safeNumber(
        projection.realValueAfterInflation
      ),
      0
    );


  const finalBalance =
    safeNumber(
      projection.series[
        projection.series.length - 1
      ]?.balance
    );


  const growthPercentage =
    finalBalance > 0
      ? Math.round(
          (
            growth /
            finalBalance
          ) *
          100
        )
      : 0;


  const lastYear =
    safeNumber(
      projection.series[
        projection.series.length - 1
      ]?.year
    );


  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 16,
      }}

      animate={{
        opacity: 1,
        y: 0,
      }}

      transition={{
        duration: 0.4,
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

        {/* =================================================
            Header
        ================================================= */}

        <CardHeader>

          <div
            className="
              flex
              items-center
              gap-2
              text-primary
            "
          >

            <TrendingUp
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
              Projection Intelligence
            </span>

          </div>


          <div
            className="
              mt-2
              flex
              flex-wrap
              items-center
              gap-2
            "
          >

            <CardTitle
              className="
                text-xl
              "
            >
              תחזית צמיחת ההשקעה
            </CardTitle>


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
              max-w-2xl
              text-sm
              leading-relaxed
              text-muted-foreground
            "
          >
            כיצד ההון עשוי להתפתח לאורך זמן
            לפי ההנחות שהוזנו למערכת.
          </p>

        </CardHeader>


        <CardContent
          className="
            space-y-5
          "
        >

          {/* =================================================
              Chart Summary
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-3
            "
          >

            <div
              className="
                rounded-2xl
                border
                bg-background/70
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-muted-foreground
                "
              >

                <ArrowUpRight
                  className="
                    h-4
                    w-4
                  "
                />

                שווי סופי

              </div>


              <p
                className="
                  mt-2
                  text-xl
                  font-black
                "
              >
                {formatMoney(
                  finalBalance
                )}
              </p>

            </div>


            <div
              className="
                rounded-2xl
                border
                bg-background/70
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-muted-foreground
                "
              >

                <TrendingUp
                  className="
                    h-4
                    w-4
                  "
                />

                צמיחה

              </div>


              <p
                className="
                  mt-2
                  text-xl
                  font-black
                "
              >
                {formatMoney(
                  growth
                )}
              </p>


              <p
                className="
                  mt-1
                  text-[11px]
                  text-muted-foreground
                "
              >
                {growthPercentage}% מהשווי הסופי
              </p>

            </div>


            <div
              className="
                rounded-2xl
                border
                bg-background/70
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-muted-foreground
                "
              >

                <ShieldCheck
                  className="
                    h-4
                    w-4
                  "
                />

                אופק

              </div>


              <p
                className="
                  mt-2
                  text-xl
                  font-black
                "
              >
                {lastYear} שנים
              </p>

            </div>

          </div>


          {/* =================================================
              Main Chart
          ================================================= */}

          <div
            className="
              h-[360px]
              w-full
              rounded-2xl
              border
              bg-background/40
              p-2
              sm:p-4
            "
          >

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart

                data={
                  projection.series
                }

                margin={{
                  top: 10,
                  right: 12,
                  left: 0,
                  bottom: 10,
                }}

              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.25}
                />


                <XAxis

                  dataKey="year"

                  tickFormatter={(
                    value
                  ) =>
                    `${value}`
                  }

                  tick={{
                    fontSize: 11,
                  }}

                  tickLine={false}

                  axisLine={{
                    opacity: 0.3,
                  }}

                />


                <YAxis

                  tickFormatter={(
                    value
                  ) =>
                    formatAxisValue(
                      Number(value)
                    )
                  }

                  tick={{
                    fontSize: 11,
                  }}

                  tickLine={false}

                  axisLine={{
                    opacity: 0.3,
                  }}

                  width={55}

                />


                <Tooltip

                  contentStyle={{
                    borderRadius: 14,
                    border:
                      "1px solid hsl(var(--border))",
                    background:
                      "hsl(var(--background))",
                  }}

                  formatter={(
                    value,
                    name
                  ) => [

                    formatMoney(
                      Number(value)
                    ),

                    name === "balance"
                      ? "שווי תיק"
                      : "הון שהופקד",

                  ]}

                  labelFormatter={(
                    label
                  ) =>
                    `שנה ${label}`
                  }

                />


                {/* Initial capital / zero reference */}

                <ReferenceLine
                  y={0}
                  strokeDasharray="4 4"
                  opacity={0.25}
                />


                {/* Contributions */}

                <Line

                  type="monotone"

                  dataKey="contributed"

                  strokeWidth={2}

                  dot={false}

                  strokeDasharray="6 4"

                  name="contributed"

                  animationDuration={900}

                />


                {/* Portfolio balance */}

                <Line

                  type="monotone"

                  dataKey="balance"

                  strokeWidth={3}

                  dot={false}

                  name="balance"

                  animationDuration={1100}

                />

              </LineChart>

            </ResponsiveContainer>

          </div>


          {/* =================================================
              Legend
          ================================================= */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-4
              text-xs
              text-muted-foreground
            "
          >

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <span
                className="
                  h-0.5
                  w-7
                  border-t-2
                  border-dashed
                "
              />

              הון שהופקד

            </div>


            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <span
                className="
                  h-0.5
                  w-7
                  border-t-[3px]
                "
              />

              שווי תיק

            </div>

          </div>


          {/* =================================================
              Core Metrics
          ================================================= */}

          <div
            className="
              grid
              grid-cols-1
              gap-3
              md:grid-cols-3
            "
          >

            <Metric

              icon={
                <Wallet
                  className="
                    h-4
                    w-4
                  "
                />
              }

              title="סה״כ הפקדות"

              value={
                formatMoney(
                  totalContributed
                )
              }

            />


            <Metric

              icon={
                <Coins
                  className="
                    h-4
                    w-4
                  "
                />
              }

              title="צמיחה"

              value={
                formatMoney(
                  growth
                )
              }

            />


            <Metric

              icon={
                <ShieldCheck
                  className="
                    h-4
                    w-4
                  "
                />
              }

              title="ערך ריאלי"

              value={
                formatMoney(
                  realValue
                )
              }

            />

          </div>


          {/* =================================================
              Explainability
          ================================================= */}

          <div
            className="
              rounded-2xl
              border
              border-primary/15
              bg-primary/[0.035]
              p-4
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
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-primary/10
                "
              >

                <Sparkles
                  className="
                    h-4
                    w-4
                    text-primary
                  "
                />

              </div>


              <div>

                <p
                  className="
                    font-semibold
                  "
                >
                  מה אנחנו רואים בגרף?
                </p>


                <p
                  className="
                    mt-1
                    text-sm
                    leading-relaxed
                    text-muted-foreground
                  "
                >
                  הקו המקווקו מציג את ההון שהופקד
                  לאורך התקופה, בעוד שהקו הרציף מציג
                  את השווי המשוער של התיק בהתאם להנחות
                  הסימולציה. הפער ביניהם ממחיש את
                  השפעת הצמיחה ההיפותטית לאורך זמן.
                </p>

              </div>

            </div>

          </div>


          {/* =================================================
              Educational Note
          ================================================= */}

          <div
            className="
              flex
              items-start
              gap-2
              border-t
              pt-4
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
              ⚠️ התחזית היא סימולציה חינוכית בלבד.
              התשואה המוצגת מבוססת על ההנחות שהוזנו
              למערכת ואינה תחזית מובטחת. תשואות בפועל
              עשויות להיות שונות משמעותית.
            </span>

          </div>

        </CardContent>

      </Card>

    </motion.div>

  );

}


// =====================================================
// Metric Component
// =====================================================

function Metric({

  icon,

  title,

  value,

}: {

  icon: React.ReactNode;

  title: string;

  value: string;

}) {

  return (

    <div
      className="
        rounded-xl
        border
        bg-background
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
          text-xs
          text-muted-foreground
        "
      >

        {icon}

        {title}

      </div>


      <p
        className="
          mt-2
          break-words
          text-lg
          font-bold
        "
      >
        {value}
      </p>

    </div>

  );

}