import { motion } from "framer-motion";
import { PieChart as PieChartIcon, AlertTriangle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";

import type { AnalysisResult } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import { BrokerComparisonTable } from "./BrokerComparisonTable";


export function PortfolioCard({
  result,
}: {
  result: AnalysisResult;
}) {


  const allocation =
    result.allocation ?? [];



  return (

    <motion.div

      initial={{
        opacity:0,
        y:16
      }}

      animate={{
        opacity:1,
        y:0
      }}

      transition={{
        delay:0.2
      }}

    >


      <Card>


        <CardHeader>


          <div className="flex items-center gap-2 text-primary">


            <PieChartIcon className="h-4 w-4" />


            <span className="text-xs font-bold uppercase tracking-wide">

              ׳×׳™׳§ ׳׳™׳׳•׳“׳™ ׳׳“׳•׳’׳׳”

            </span>


          </div>



          <CardTitle className="text-xl">

            ׳”׳§׳¦׳׳× ׳ ׳›׳¡׳™׳ ׳׳₪׳©׳¨׳™׳× ׳׳₪׳™ ׳”׳₪׳¨׳•׳₪׳™׳ ׳©׳׳

          </CardTitle>




          <div className="
            mt-3
            flex
            items-start
            gap-2
            rounded-xl
            bg-warning/10
            border
            border-warning/20
            p-3
            text-xs
            leading-relaxed
          ">


            <AlertTriangle
              className="
                mt-0.5
                h-4
                w-4
                shrink-0
                text-warning
              "
            />


            <span>

              ׳׳“׳•׳‘׳¨ ׳‘׳”׳׳—׳©׳” ׳׳™׳׳•׳“׳™׳× ׳‘׳׳‘׳“.
              ׳׳™׳ ׳›׳׳ ׳”׳׳׳¦׳× ׳”׳©׳§׳¢׳” ׳׳• ׳”׳×׳׳׳” ׳׳™׳©׳™׳×.

            </span>


          </div>


        </CardHeader>






        <CardContent>



          {
            allocation.length === 0

            ?

            (

              <div className="
                rounded-xl
                border
                border-border
                p-5
                text-sm
                text-muted-foreground
              ">


                ׳׳ ׳ ׳׳¦׳׳” ׳”׳§׳¦׳׳× ׳ ׳›׳¡׳™׳ ׳׳”׳¦׳’׳”.


              </div>

            )


            :


            (


            <div className="
              grid
              items-center
              gap-8
              md:grid-cols-2
            ">



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
                          (entry)=>(


                            <Cell

                              key={entry.name}

                              fill={entry.color}

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
                        )=>[

                          `${value}%`,

                          name

                        ]
                      }


                      contentStyle={{

                        borderRadius:12,

                        border:
                        "1px solid hsl(var(--border))",

                        background:
                        "hsl(var(--card))",

                        fontSize:12

                      }}


                    />



                  </PieChart>


                </ResponsiveContainer>


              </div>









              <div className="
                space-y-3
              ">


                {
                  allocation.map(
                    (item)=>(


                      <div

                        key={item.name}

                        className="
                          flex
                          items-center
                          justify-between
                          rounded-xl
                          border
                          border-border
                          bg-card
                          px-4
                          py-3
                          text-sm
                        "

                      >



                        <span className="
                          flex
                          items-center
                          gap-3
                        ">



                          <span

                            className="
                              h-3
                              w-3
                              rounded-full
                            "

                            style={{
                              backgroundColor:
                              item.color
                            }}

                          />


                          {item.name}



                        </span>





                        <span className="font-bold">


                          {item.value}%


                        </span>



                      </div>


                    )

                  )
                }


              </div>



            </div>


            )

          }









          <div className="
            mt-6
            border-t
            border-border
            pt-6
          ">



            <h4 className="
              mb-2
              text-sm
              font-bold
            ">


              נ§  ׳׳׳” ׳ ׳‘׳—׳¨ ׳”׳׳‘׳ ׳” ׳”׳–׳”?


            </h4>




            <p className="
              text-sm
              leading-relaxed
              text-muted-foreground
            ">


              {
                result.aiNarration.portfolioSummary
              }


            </p>


          </div>








          <div className="mt-6">


            <BrokerComparisonTable />


          </div>





        </CardContent>



      </Card>


    </motion.div>


  );


}

