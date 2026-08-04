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



const ROWS: {
  label: string;
  render: (strategy: typeof STRATEGIES[number]) => string;
}[] = [

  {
    label: "׳¨׳׳× ׳¡׳™׳›׳•׳",
    render: (strategy) =>
      `${strategy.riskLevel}/10`,
  },


  {
    label: "׳₪׳™׳–׳•׳¨",
    render: (strategy) => {

      if(strategy.id === "passive")
        return "׳¨׳—׳‘ ׳׳׳•׳“";

      if(strategy.id === "growth")
        return "׳‘׳™׳ ׳•׳ ׳™-׳ ׳׳•׳";

      return "׳‘׳™׳ ׳•׳ ׳™";

    },
  },


  {
    label: "׳׳׳₪׳™׳™׳ ׳׳¨׳›׳–׳™",
    render: (strategy) => {

      switch(strategy.id){

        case "passive":
          return "׳¢׳׳•׳× ׳ ׳׳•׳›׳” ׳•׳₪׳©׳˜׳•׳×";

        case "dividend":
          return "׳”׳›׳ ׳¡׳” ׳©׳•׳˜׳₪׳×";

        case "growth":
          return "׳₪׳•׳˜׳ ׳¦׳™׳׳ ׳×׳©׳•׳׳” ׳’׳‘׳•׳”";

        default:
          return '׳—׳™׳₪׳•׳© "׳׳¦׳™׳׳•׳×" ׳‘׳©׳•׳§';

      }

    },
  },


  {
    label: "׳™׳×׳¨׳•׳ ׳¢׳™׳§׳¨׳™",
    render: (strategy) =>
      strategy.pros[0] ?? "",
  },


  {
    label: "׳—׳™׳¡׳¨׳•׳ ׳¢׳™׳§׳¨׳™",
    render: (strategy) =>
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

              ׳”׳©׳•׳•׳׳× ׳׳¡׳˜׳¨׳˜׳’׳™׳•׳×

            </span>

          </div>



          <CardTitle className="text-xl">

            ׳׳™׳–׳• ׳’׳™׳©׳” ׳׳×׳׳™׳׳” ׳׳™ ׳™׳•׳×׳¨?

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

                    ׳׳׳₪׳™׳™׳

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
                  ROWS.map(row=>(


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
