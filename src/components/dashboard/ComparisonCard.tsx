import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import { STRATEGIES } from "@/lib/strategies";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/context/languageContext";



const ROWS = (t: (key: string, fallback?: string) => string) => [
  {
    label: t("comparison_risk_label", "רמת סיכון"),
    render: (strategy: typeof STRATEGIES[number]) =>
      `${strategy.riskLevel}/10`,
  },


  {
    label: t("comparison_diversification_label", "פיזור"),
    render: (strategy: typeof STRATEGIES[number]) => {

      if(strategy.id === "passive")
        return t("comparison_diversification_very_high", "רחב מאוד");

      if(strategy.id === "growth")
        return t("comparison_diversification_medium_low", "בינוני-נמוך");

      return t("comparison_diversification_medium", "בינוני");

    },
  },


  {
    label: t("comparison_feature_label", "מאפיין מרכזי"),
    render: (strategy: typeof STRATEGIES[number]) => {

      switch(strategy.id){

        case "passive":
          return t("comparison_feature_low_cost", "עלות נמוכה ופשטות");

        case "dividend":
          return t("comparison_feature_income", "הכנסה שוטפת");

        case "growth":
          return t("comparison_feature_growth", "פוטנציאל תשואה גבוה");

        default:
          return t("comparison_feature_value", "חיפוש \"מציאות\" בשוק");

      }

    },
  },


  {
    label: t("comparison_main_advantage_label", "יתרון עיקרי"),
    render: (strategy: typeof STRATEGIES[number]) =>
      strategy.pros[0] ?? "",
  },


  {
    label: t("comparison_main_disadvantage_label", "חיסרון עיקרי"),
    render: (strategy: typeof STRATEGIES[number]) =>
      strategy.cons[0] ?? "",
  },

];





export function ComparisonCard(){


  const [
    selected,
    setSelected
  ] =
  useState<string[]>([
    "passive",
    "dividend",
    "growth",
  ]);

  const { t } = useLanguage();
  const rows = ROWS(t);




  const selectedStrategies =
    useMemo(

      () =>
      STRATEGIES.filter(
        strategy =>
        selected.includes(strategy.id)
      ),

      [selected]

    );





  function toggle(id:string){


    setSelected(current=>{


      if(current.includes(id)){

        return current.filter(
          item =>
          item !== id
        );

      }



      if(current.length >= 3){

        return current;

      }



      return [
        ...current,
        id
      ];


    });



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
        delay:0.3,
      }}

    >

      <Card>


        <CardHeader>


          <div className="flex items-center gap-2 text-primary">

            <Scale className="h-4 w-4"/>

            <span className="text-xs font-bold uppercase tracking-wide">

              {t("comparison_strategies_tag", "השוואת אסטרטגיות")}

            </span>

          </div>



          <CardTitle className="text-xl">

            {t("comparison_which_approach_title", "איזו גישה מתאימה לי יותר?")}

          </CardTitle>


        </CardHeader>






        <CardContent>



          <div className="mb-5 flex flex-wrap gap-2">


            {
              STRATEGIES.map(strategy=>(


                <button

                  key={strategy.id}

                  onClick={()=>
                    toggle(strategy.id)
                  }


                  className={cn(

                    "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",

                    selected.includes(strategy.id)

                    ?

                    "border-primary bg-primary/10 text-primary"

                    :

                    "border-border text-muted-foreground hover:bg-accent"

                  )}

                >

                  {strategy.name}


                </button>


              ))

            }


          </div>




          <div className="overflow-x-auto">



            <table className="w-full min-w-[500px] border-collapse text-sm">


              <thead>


                <tr>


                  <th className="w-32 border-b border-border py-2 text-right text-xs font-semibold text-muted-foreground">

                    {t("comparison_feature_column", "מאפיין")}

                  </th>



                  {
                    selectedStrategies.map(strategy=>(

                      <th

                        key={strategy.id}

                        className="border-b border-border py-2 text-right font-display font-bold"

                      >

                        {strategy.name}


                      </th>


                    ))
                  }


                </tr>


              </thead>






              <tbody>


                {
                  rows.map(row=>(


                    <tr

                      key={row.label}

                      className="border-b border-border/60 last:border-0"

                    >


                      <td className="py-3 pl-2 text-xs font-semibold text-muted-foreground">

                        {row.label}

                      </td>




                      {
                        selectedStrategies.map(strategy=>(


                          <td

                            key={strategy.id}

                            className="py-3 pl-4 leading-relaxed"

                          >

                            {row.render(strategy)}

                          </td>


                        ))
                      }


                    </tr>


                  ))
                }


              </tbody>



            </table>


          </div>


        </CardContent>


      </Card>


    </motion.div>


  );


}
