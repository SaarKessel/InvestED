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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import { BrokerComparisonTable } from "./BrokerComparisonTable";



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



// =====================================================
// Internal Portfolio Metrics
// =====================================================

function calculateLocalMetrics(
  allocation:any[]
){

  const largest =
    [...allocation]
      .sort(
        (a,b)=>
          b.value-a.value
      )[0];


  const equityExposure =
    allocation
      .filter(
        item =>
          item.name.includes("מניות") ||
          item.name.includes("סקטור")
      )
      .reduce(
        (sum,item)=>
          sum + item.value,
        0
      );


  const diversification =
    largest
      ?
      Math.max(
        0,
        100 - largest.value
      )
      :
      0;



  let riskLevel =
    "בינוני";


  if(equityExposure >= 70){

    riskLevel =
      "גבוה";

  }


  if(equityExposure <= 35){

    riskLevel =
      "נמוך";

  }



  return {

    diversification:
      Math.round(
        diversification
      ),

    equityExposure:
      Math.round(
        equityExposure
      ),

    riskLevel,


  };


}





// =====================================================
// Portfolio Card
// =====================================================


export function PortfolioCard({

  result,

}:{

  result:AnalysisResult;

}) {


  const allocation =
    result.allocation ?? [];



  const projection =
    result.projection;



  const metrics =
    calculateLocalMetrics(
      allocation
    );



  const growthPercentage =
    projection &&
    projection.finalBalance > 0

      ?

      Math.min(
        100,
        Math.round(
          (
            projection.growth /
            projection.finalBalance
          )
          *
          100
        )
      )

      :

      0;



  return (

    <motion.div

      initial={{
        opacity:0,
        y:20,
      }}

      animate={{
        opacity:1,
        y:0,
      }}

      transition={{
        duration:0.4,
      }}

    >


      <Card>


        <CardHeader>


          <div className="flex items-center gap-2 text-primary">


            <PieChartIcon
              className="h-4 w-4"
            />


            <span className="text-xs font-bold uppercase">

              Portfolio Intelligence

            </span>


          </div>



          <CardTitle className="text-xl">

            הקצאת נכסים וניתוח תיק AI

          </CardTitle>



          <div
            className="
            mt-4
            flex
            gap-2
            rounded-xl
            border
            border-warning/20
            bg-warning/10
            p-3
            text-xs
            "
          >


            <AlertTriangle
              className="
              h-4
              w-4
              shrink-0
              text-warning
              "
            />


            <span>

              הנתונים מוצגים לצורכי למידה פיננסית בלבד
              ואינם מהווים המלצת השקעה.

            </span>


          </div>


        </CardHeader>

        <CardContent>


        {
          projection &&

          (

          <div
            className="
            mb-8
            grid
            grid-cols-1
            gap-4
            md:grid-cols-4
            "
          >


            <MetricCard

              icon={
                <Wallet className="h-4 w-4"/>
              }

              title="סה״כ הפקדות"

              value={
                formatMoney(
                  projection.totalContributed
                )
              }

            />



            <MetricCard

              icon={
                <TrendingUp className="h-4 w-4"/>
              }

              title="שווי עתידי"

              value={
                formatMoney(
                  projection.finalBalance
                )
              }

            />



            <MetricCard

              icon={
                <Coins className="h-4 w-4"/>
              }

              title="רווח מהשקעה"

              value={
                formatMoney(
                  projection.growth
                )
              }

            />



            <MetricCard

              icon={
                <CalendarDays className="h-4 w-4"/>
              }

              title="תקופה"

              value={
                result.scenario?.years
                  ?
                  `${result.scenario.years} שנים`
                  :
                  "-"
              }

            />


          </div>

          )

        }







        {
          projection &&

          (

          <div className="mb-8">


            <div
              className="
              mb-2
              flex
              justify-between
              text-xs
              text-muted-foreground
              "
            >

              <span>

                תרומת צמיחה להשקעה

              </span>


              <span>

                {growthPercentage}%

              </span>


            </div>



            <div
              className="
              h-3
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
                  width:`${growthPercentage}%`,
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

          )

        }







        <div
          className="
          mb-8
          grid
          grid-cols-1
          gap-4
          md:grid-cols-3
          "
        >


          <MetricCard

            icon={
              <ShieldCheck className="h-4 w-4"/>
            }

            title="פיזור תיק"

            value={
              `${metrics.diversification}%`
            }

          />



          <MetricCard

            icon={
              <BarChart3 className="h-4 w-4"/>
            }

            title="חשיפה מנייתית"

            value={
              `${metrics.equityExposure}%`
            }

          />



          <MetricCard

            icon={
              <ShieldCheck className="h-4 w-4"/>
            }

            title="רמת סיכון"

            value={
              metrics.riskLevel
            }

          />


        </div>








        {
          allocation.length === 0

          ?

          (

          <div
            className="
            rounded-xl
            border
            p-5
            text-sm
            text-muted-foreground
            "
          >

            לא נמצאה הקצאת נכסים להצגה.

          </div>

          )


          :

          (

          <div
            className="
            grid
            items-center
            gap-8
            md:grid-cols-2
            "
          >


            <div className="h-72">


              <ResponsiveContainer

                width="100%"

                height="100%"

              >


                <PieChart>


                  <Pie

                    data={allocation}

                    dataKey="value"

                    nameKey="name"

                    innerRadius={60}

                    outerRadius={100}

                    paddingAngle={3}

                    animationDuration={900}

                  >


                    {
                      allocation.map(
                        item =>

                        (

                        <Cell

                          key={
                            item.name
                          }

                          fill={
                            item.color
                          }

                          stroke="transparent"

                        />

                        )

                      )
                    }


                  </Pie>


                  <RTooltip

                    formatter={
                      (
                        value:number,
                        name:string
                      ) => [

                        `${value}%`,

                        name

                      ]
                    }

                  />


                </PieChart>


              </ResponsiveContainer>


            </div>

            <div className="space-y-3">


              {
                allocation.map(

                  item =>

                  (

                  <motion.div

                    key={item.name}

                    initial={{
                      opacity:0,
                      x:10,
                    }}

                    animate={{
                      opacity:1,
                      x:0,
                    }}

                    transition={{
                      duration:0.3,
                    }}

                    className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    bg-card
                    px-4
                    py-3
                    text-sm
                    "

                  >


                    <div
                      className="
                      flex
                      items-center
                      gap-3
                      "
                    >


                      <span

                        className="
                        h-3
                        w-3
                        rounded-full
                        "

                        style={{
                          backgroundColor:
                            item.color,
                        }}

                      />


                      <span>

                        {item.name}

                      </span>


                    </div>




                    <span className="font-bold">

                      {item.value}%

                    </span>


                  </motion.div>

                  )

                )
              }


            </div>


          </div>

          )

        }








        <div
          className="
          mt-8
          border-t
          pt-6
          "
        >


          <h4
            className="
            mb-3
            text-sm
            font-bold
            "
          >

            🧠 למה נבחר המבנה הזה?

          </h4>



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


        </div>








        <div className="mt-8">


          <BrokerComparisonTable/>


        </div>




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

}:{

  icon:ReactNode;

  title:string;

  value:string;

}){


  return (

    <div
      className="
      rounded-xl
      border
      bg-card
      p-4
      "
    >


      <div
        className="
        mb-2
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




      <div
        className="
        text-lg
        font-bold
        "
      >

        {value}

      </div>


    </div>

  );


}