import { useState } from "react";

import {
  analyzeFinancialScenario,
  computeProjection,
  ASSET_CLASSES
} from "@/lib/calculatorEngine";

import type {
  FinancialScenario,
  ProjectionResult
} from "@/lib/calculatorEngine";

import { InvestmentInsightCard } from "@/components/InvestmentInsightCard";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------


function formatMoney(value:number){

  return new Intl.NumberFormat(
    "he-IL",
    {
      style:"currency",
      currency:"ILS",
      maximumFractionDigits:0
    }
  ).format(value);

}



function percent(value:number){

  return Math.round(value);

}



function goalLabel(goal:string){

  switch(goal){

    case "growth":
      return "׳‘׳ ׳™׳™׳× ׳”׳•׳";

    case "retirement":
      return "׳₪׳¨׳™׳©׳” ׳׳•׳§׳“׳׳×";

    case "child":
      return "׳—׳™׳¡׳›׳•׳ ׳׳™׳׳“׳™׳";

    case "home":
      return "׳¨׳›׳™׳©׳× ׳“׳™׳¨׳”";

    case "wealth":
      return "׳¢׳¦׳׳׳•׳× ׳›׳׳›׳׳™׳×";

    default:
      return "׳”׳©׳§׳¢׳” ׳›׳׳׳™׳×";

  }

}



// ---------------------------------------------------------------------------
// Calculator Page
// ---------------------------------------------------------------------------


export default function CalculatorPage(){


  const [input,setInput] =
    useState<string>("");


  const [scenario,setScenario] =
    useState<FinancialScenario | null>(null);


  const [projection,setProjection] =
    useState<ProjectionResult | null>(null);



  function calculate(){


    if(!input.trim()){
      return;
    }


    const parsed =
      analyzeFinancialScenario(input);



    const result =
      computeProjection(
        parsed.initialInvestment,
        parsed.monthlyContribution,
        parsed.years,
        parsed.annualReturnPct
      );


    setScenario(parsed);

    setProjection(result);


  }





  const comparison =

    scenario

    ?

    ASSET_CLASSES.map(asset=>{


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

      (a,b)=>

        a.result.finalBalance >
        b.result.finalBalance

        ?

        a

        :

        b

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



        <h1

          className="
          text-4xl
          font-bold
          mb-3
          "

        >

נ§® ׳׳—׳©׳‘׳•׳ ׳”׳”׳©׳§׳¢׳•׳× ׳”׳—׳›׳ ׳©׳ InvestED
        </h1>



        <p

          className="
          text-slate-300
          mb-8
          "

        >

          ׳×׳׳¨ ׳×׳¨׳—׳™׳© ׳”׳©׳§׳¢׳” ׳‘׳©׳₪׳” ׳˜׳‘׳¢׳™׳× ׳•׳§׳‘׳ ׳”׳“׳׳™׳”, ׳”׳©׳•׳•׳׳× ׳׳¡׳׳•׳׳™׳ ׳•׳×׳•׳‘׳ ׳•׳× ׳׳‘׳•׳¡׳¡׳•׳× AI.

        </p>




        <div

          className="
          bg-card
border
border-border
rounded-3xl
p-6
shadow-soft
mb-8
          "

        >



          <textarea


            value={input}


            onChange={
              e=>setInput(e.target.value)
            }


            placeholder='׳׳“׳•׳’׳׳”: "׳™׳© ׳׳™ 300 ׳׳׳£ ׳׳”׳©׳§׳™׳¢ ׳-15 ׳©׳ ׳” ׳‘׳׳“׳“ S&P 500"'



            className="
            w-full
            h-32
            bg-[#050B16]
            border
            border-[#1E3A5F]
            rounded-xl
            p-4
            text-white
            outline-none
            resize-none
            "


          />



          <button


            onClick={calculate}


            className="
            mt-5
            bg-emerald-400
            hover:bg-emerald-500
            text-black
            font-bold
            px-8
            py-3
            rounded-xl
            transition
            "


          >

            ׳—׳©׳‘ ׳×׳¨׳—׳™׳© נ€


          </button>


        </div>





        {
          scenario && projection && (

            <>

            <div

              className="
              grid
              md:grid-cols-4
              gap-5
              mb-8
              "

            >

<InvestmentInsightCard
  finalBalance={projection.finalBalance}
  totalContributed={projection.totalContributed}
  growth={projection.growth}
  years={scenario.years}
  assetLabel={
    ASSET_CLASSES.find(
      a => a.key === scenario.assetClassKey
    )?.label
  }
  annualReturnPct={scenario.annualReturnPct}
  monthlyContribution={scenario.monthlyContribution}
  goal={scenario.goal}
/>    

              <InfoCard

                title="׳”׳©׳§׳¢׳” ׳”׳×׳—׳׳×׳™׳×"

                value={
                  formatMoney(
                    scenario.initialInvestment
                  )
                }

              />


              <InfoCard
  title="׳©׳•׳•׳™ ׳¢׳×׳™׳“׳™"
  value={
    formatMoney(
      projection.finalBalance
    )
  }
/>
      
            </div>





<div
  className="
  bg-[#050B16]
  border
  border-[#1E3A5F]
  rounded-2xl
  p-5
  "
>


              <h2

                className="
                text-2xl
                font-bold
                mb-5
                "

              >

                נ₪– InvestED ׳”׳‘׳™׳ ׳׳•׳×׳

              </h2>



              <div

                className="
                grid
                md:grid-cols-4
                gap-4
                "

              >


                <MiniCard

                  label="׳ ׳›׳¡"

                  value={

                    ASSET_CLASSES.find(

                      asset =>
                        asset.key === scenario.assetClassKey

                    )?.label

                    ??

                    scenario.assetClassKey

                  }

                />



                <MiniCard

                  label="׳×׳©׳•׳׳” ׳׳©׳•׳¢׳¨׳×"

                  value={
                    `${scenario.annualReturnPct}%`
                  }

                />



                <MiniCard

                  label="׳׳•׳₪׳§ ׳”׳©׳§׳¢׳”"

                  value={
                    `${scenario.years} ׳©׳ ׳™׳`
                  }

                />



                <MiniCard

                  label="׳׳˜׳¨׳”"

                  value={
                    goalLabel(
                      scenario.goal
                    )
                  }

                />


              </div>


            </div>


<div
  className="
  bg-card
  border
  border-border
  rounded-xl
  p-4
  shadow-sm
  "
>




              <h2

                className="
                text-2xl
                font-bold
                mb-4
                "

              >

                נ§  ׳×׳•׳‘׳ ׳× InvestED

              </h2>





              <p

                className="
                text-muted-foreground
                leading-8
                "

              >


              {

                scenario.initialInvestment > 0 &&
                scenario.monthlyContribution > 0

                ?

                <>
                  ׳”׳©׳§׳¢׳” ׳”׳×׳—׳׳×׳™׳× ׳©׳{" "}

                  <span className="text-white font-bold">

                    {
                      formatMoney(
                        scenario.initialInvestment
                      )
                    }

                  </span>


                  {" "}׳•׳”׳₪׳§׳“׳” ׳—׳•׳“׳©׳™׳× ׳©׳{" "}


                  <span className="text-white font-bold">

                    {
                      formatMoney(
                        scenario.monthlyContribution
                      )
                    }

                  </span>


                  ׳¦׳₪׳•׳™׳•׳× ׳׳”׳’׳™׳¢ ׳׳©׳•׳•׳™ ׳¢׳×׳™׳“׳™ ׳©׳{" "}


                  <span className="text-emerald-400 font-bold">

                    {
                      formatMoney(
                        projection.finalBalance
                      )
                    }

                  </span>

                </>



                :


                scenario.initialInvestment > 0


                ?

                <>

                  ׳”׳©׳§׳¢׳” ׳”׳×׳—׳׳×׳™׳× ׳©׳{" "}


                  <span className="text-white font-bold">

                    {
                      formatMoney(
                        scenario.initialInvestment
                      )
                    }

                  </span>


                  ׳¦׳₪׳•׳™׳” ׳׳”׳’׳™׳¢ ׳׳©׳•׳•׳™ ׳¢׳×׳™׳“׳™ ׳©׳{" "}


                  <span className="text-emerald-400 font-bold">

                    {
                      formatMoney(
                        projection.finalBalance
                      )
                    }

                  </span>

                </>



                :


                <>

                  ׳”׳₪׳§׳“׳” ׳—׳•׳“׳©׳™׳× ׳©׳{" "}


                  <span className="text-white font-bold">

                    {
                      formatMoney(
                        scenario.monthlyContribution
                      )
                    }

                  </span>


                  ׳׳׳•׳¨׳{" "}


                  <span className="text-white font-bold">

                    {
                      scenario.years
                    }

                    {" "}׳©׳ ׳™׳

                  </span>


                  ׳¦׳₪׳•׳™׳” ׳׳”׳’׳™׳¢ ׳׳©׳•׳•׳™ ׳¢׳×׳™׳“׳™ ׳©׳{" "}


                  <span className="text-emerald-400 font-bold">

                    {
                      formatMoney(
                        projection.finalBalance
                      )
                    }

                  </span>

                </>

              }


              </p>





              <p

                className="
                mt-4
                text-slate-300
                "

              >

                נ’° ׳׳×׳•׳ ׳”׳©׳•׳•׳™ ׳”׳¡׳•׳₪׳™:


                <span

                  className="
                  text-emerald-400
                  font-bold
                  "

                >

                  {" "}

                  {

                    projection.finalBalance > 0

                    ?

                    percent(

                      projection.growth /

                      projection.finalBalance *

                      100

                    )

                    :

                    0

                  }

                  %

                </span>


                {" "}׳ ׳•׳¦׳¨ ׳׳¦׳׳™׳—׳× ׳”׳”׳©׳§׳¢׳”.


              </p>


            </div>






            <div

              className="
              bg-[#0B1628]
              border
              border-[#1E3A5F]
              rounded-3xl
              p-6
              mb-8
              "

            >


              <h2

                className="
                text-2xl
                font-bold
                mb-3
                "

              >

                נ“ˆ ׳”׳©׳•׳•׳׳× ׳׳¡׳׳•׳׳™ ׳”׳©׳§׳¢׳”

              </h2>



              <p

                className="
                text-slate-400
                mb-6
                "

              >

                ׳׳•׳×׳” ׳”׳©׳§׳¢׳”, ׳׳¡׳׳•׳׳™׳ ׳©׳•׳ ׳™׳ ג€” ׳׳¨׳׳•׳× ׳›׳™׳¦׳“ ׳”׳×׳©׳•׳׳” ׳׳©׳₪׳™׳¢׳” ׳׳׳•׳¨׳ ׳–׳׳.

              </p>





              <div

                className="
                grid
                md:grid-cols-2
                gap-5
                "

              >


                {
                  comparison.map(asset=>(

                    <div

                      key={asset.key}

                      className={`

                      rounded-2xl
                      p-5
                      border

                      ${
                        asset.key === scenario.assetClassKey

                        ?

                        "border-emerald-400 bg-emerald-400/10"

                        :

                        asset.key === bestAsset?.key

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

                        {asset.label}

                      </h3>


                      <p className="text-slate-400 mt-2">

                        ׳×׳©׳•׳׳” ׳©׳ ׳×׳™׳× ׳׳©׳•׳¢׳¨׳×:
                        {" "}
                        {asset.annualReturnPct}%

                      </p>


                      <p

                        className="
                        text-2xl
                        font-bold
                        mt-4
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
                        text-emerald-400
                        mt-2
                        "

                      >

                        ׳¨׳•׳•׳—:

                        {" "}

                        {
                          formatMoney(
                            asset.result.growth
                          )
                        }

                      </p>


                      {
                        asset.key === bestAsset?.key &&

                        <span className="text-yellow-400 text-sm">

                          נ† ׳׳•׳‘׳™׳

                        </span>
                      }


                    </div>

                  ))
                }


              </div>


            </div>

            <div

              className="
              bg-[#0B1628]
              border
              border-[#1E3A5F]
              rounded-3xl
              p-6
              mb-8
              "

            >


              <h2

                className="
                text-2xl
                font-bold
                mb-5
                "

              >

                נ“ ׳¡׳™׳›׳•׳ ׳”׳©׳§׳¢׳”

              </h2>




              <div

                className="
                grid
                md:grid-cols-3
                gap-5
                "

              >


                <InfoCard

                  title="׳¡׳”׳´׳› ׳”׳₪׳§׳“׳”"

                  value={
                    formatMoney(
                      projection.totalContributed
                    )
                  }

                />



                <InfoCard

                  title="׳¨׳•׳•׳—"

                  value={
                    formatMoney(
                      projection.growth
                    )
                  }

                />



                <InfoCard

                  title="׳©׳•׳•׳™ ׳׳׳—׳¨ ׳׳™׳ ׳₪׳׳¦׳™׳”"

                  value={
                    formatMoney(
                      projection.realValueAfterInflation
                    )
                  }

                />


              </div>


            </div>







            <div

              className="
              text-center
              text-xs
              text-slate-500
              leading-6
              mb-8
              "

            >

              ׳׳¦׳•׳¨׳›׳™ ׳׳™׳׳•׳“ ׳‘׳׳‘׳“.

              <br/>

              InvestED ׳׳™׳ ׳” ׳׳™׳™׳¢׳¦׳× ׳‘׳”׳©׳§׳¢׳•׳× ׳•׳׳™׳ ׳” ׳׳׳׳™׳¦׳” ׳׳§׳ ׳•׳× ׳׳• ׳׳׳›׳•׳¨ ׳ ׳›׳¡ ׳›׳׳©׳”׳•.

              <br/>

              ׳™׳© ׳׳”׳×׳™׳™׳¢׳¥ ׳¢׳ ׳‘׳¢׳ ׳¨׳™׳©׳™׳•׳ ׳׳•׳¡׳׳ ׳׳₪׳ ׳™ ׳§׳‘׳׳× ׳”׳—׳׳˜׳•׳× ׳”׳©׳§׳¢׳”.

            </div>



            </>

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

}:{

  title:string;

  value:string;

}){


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

}:{

  label:string;

  value:string;

}){


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
