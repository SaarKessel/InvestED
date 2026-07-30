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
      bg-[#050B16]
      text-white
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

          🧮 InvestED Calculator

        </h1>



        <p

          className="
          text-slate-300
          mb-8
          "

        >

          הזן תרחיש השקעה בשפה טבעית וקבל ניתוח פיננסי חכם.

        </p>




        <div

          className="
          bg-[#0B1628]
          border
          border-[#1E3A5F]
          rounded-3xl
          p-6
          shadow-xl
          mb-8
          "

        >



          <textarea


            value={input}


            onChange={
              e=>setInput(e.target.value)
            }


            placeholder='לדוגמה: "יש לי 300 אלף להשקיע ל-15 שנה במדד S&P 500"'



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

            חשב תרחיש 🚀


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


              <InfoCard

                title="השקעה התחלתית"

                value={
                  formatMoney(
                    scenario.initialInvestment
                  )
                }

              />


              <InfoCard
  title="שווי עתידי"
  value={
    formatMoney(
      projection.finalBalance
    )
  }
/>

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
                        asset.key === scenario.assetClassKey

                    )?.label

                    ??

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






            <div

              className="
              bg-gradient-to-br
              from-[#0B1628]
              to-[#102A43]
              border
              border-emerald-500/30
              rounded-3xl
              p-6
              mb-8
              "

            >


              <h2

                className="
                text-2xl
                font-bold
                mb-4
                "

              >

                🧠 תובנת InvestED

              </h2>





              <p

                className="
                text-slate-300
                leading-8
                "

              >


              {

                scenario.initialInvestment > 0 &&
                scenario.monthlyContribution > 0

                ?

                <>
                  השקעה התחלתית של{" "}

                  <span className="text-white font-bold">

                    {
                      formatMoney(
                        scenario.initialInvestment
                      )
                    }

                  </span>


                  {" "}והפקדה חודשית של{" "}


                  <span className="text-white font-bold">

                    {
                      formatMoney(
                        scenario.monthlyContribution
                      )
                    }

                  </span>


                  צפויות להגיע לשווי עתידי של{" "}


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

                  השקעה התחלתית של{" "}


                  <span className="text-white font-bold">

                    {
                      formatMoney(
                        scenario.initialInvestment
                      )
                    }

                  </span>


                  צפויה להגיע לשווי עתידי של{" "}


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

                  הפקדה חודשית של{" "}


                  <span className="text-white font-bold">

                    {
                      formatMoney(
                        scenario.monthlyContribution
                      )
                    }

                  </span>


                  לאורך{" "}


                  <span className="text-white font-bold">

                    {
                      scenario.years
                    }

                    {" "}שנים

                  </span>


                  צפויה להגיע לשווי עתידי של{" "}


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

                💰 מתוך השווי הסופי:


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


                {" "}נוצר מצמיחת ההשקעה.


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

                        תשואה שנתית משוערת:
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

                        רווח:

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

                          🏆 מוביל

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







            <div

              className="
              text-center
              text-xs
              text-slate-500
              leading-6
              mb-8
              "

            >

              לצורכי לימוד בלבד.

              <br/>

              InvestED אינה מייעצת בהשקעות ואינה ממליצה לקנות או למכור נכס כלשהו.

              <br/>

              יש להתייעץ עם בעל רישיון מוסמך לפני קבלת החלטות השקעה.

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