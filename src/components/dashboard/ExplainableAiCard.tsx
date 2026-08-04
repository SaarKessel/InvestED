import { motion } from "framer-motion";

import {
  BrainCircuit,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Target,
} from "lucide-react";


import type {
  AnalysisResult,
} from "@/types";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui/primitives";


import { InfoBadge } from "@/components/ui/InfoBadge";





export function ExplainableAiCard({

  result,

}:{

  result:AnalysisResult;

}) {



  const signals =
    result.explainability?.signals ?? [];



  const confidenceScore =

    Math.min(

      95,

      60 +

      signals.length * 8

    );






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
        border-primary/20
        bg-gradient-to-br
        from-primary/5
        to-transparent
        "
      >




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
              className="h-5 w-5"
            />


            <span
              className="
              text-xs
              font-bold
              uppercase
              tracking-wide
              "
            >

              Explainable AI Engine

            </span>


          </div>





          <div
            className="
            flex
            items-center
            gap-2
            "
          >


            <CardTitle
              className="text-xl"
            >

              למה AI הגיע למסקנה הזאת?

            </CardTitle>




            <InfoBadge

              description="
              המערכת מציגה את הגורמים שהשפיעו
              על ניתוח פרופיל המשקיע.
              "

            />


          </div>


        </CardHeader>







        <CardContent
          className="space-y-5"
        >






          <div
            className="
            rounded-xl
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


              <Sparkles
                className="
                h-4
                w-4
                text-primary
                "
              />


              <p
                className="font-semibold"
              >

                סיכום AI

              </p>


            </div>




            <p
              className="
              text-sm
              leading-relaxed
              text-muted-foreground
              "
            >

              {result.aiNarration.profileSummary}

            </p>


          </div>










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
              rounded-xl
              border
              bg-card
              p-4
              "
            >


              <div
                className="
                flex
                items-center
                gap-2
                mb-2
                "
              >


                <ShieldCheck
                  className="
                  h-4
                  w-4
                  text-primary
                  "
                />


                <p
                  className="font-semibold"
                >

                  סוג משקיע

                </p>


              </div>




              <Badge
                variant="outline"
              >

                {result.investor.type}

              </Badge>




              <p
                className="
                mt-3
                text-sm
                text-muted-foreground
                "
              >

                {result.investor.reason}

              </p>



            </div>









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
                flex
                items-center
                gap-2
                mb-3
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
                  className="font-semibold"
                >

                  ניתוח סיכון

                </p>


              </div>





              <div
                className="
                flex
                items-center
                justify-between
                "
              >


                <Badge
                  variant="outline"
                >

                  {result.riskScore}/10

                </Badge>



                <span
                  className="
                  text-sm
                  text-muted-foreground
                  "
                >

                  Confidence {confidenceScore}%

                </span>


              </div>


            </div>



          </div>









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

                גורמים שהשפיעו על ההחלטה

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

                לא נמצאו גורמים להצגה.

              </div>

              )


              :

              (

              <div
                className="
                flex
                flex-col
                gap-3
                "
              >


                {
                  signals.map(

                    (signal,index)=>(


                    <div

                      key={
                        `${signal.title}-${index}`
                      }

                      className="
                      rounded-xl
                      border
                      bg-background
                      p-4
                      "

                    >



                      <Badge
                        variant="outline"
                      >

                        {signal.title}

                      </Badge>





                      <p
                        className="
                        mt-2
                        text-sm
                        text-muted-foreground
                        "
                      >

                        {signal.description}

                      </p>


                    </div>


                    )

                  )
                }


              </div>

              )

            }


          </div>







          <div
            className="
            border-t
            pt-5
            "
          >


            <p
              className="
              mb-3
              text-xs
              font-bold
              text-muted-foreground
              "
            >

              מבנה תיק שנוצר ללמידה

            </p>




            <div
              className="
              flex
              flex-wrap
              gap-2
              "
            >


              {
                result.allocation.map(

                  item=>(

                    <Badge

                      key={item.name}

                      variant="outline"

                    >

                      {item.name}

                    </Badge>

                  )

                )
              }


            </div>


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


            מקור:

            {" "}

            InvestED Explainable AI Educational Engine


          </div>




        </CardContent>


      </Card>



    </motion.div>


  );


}