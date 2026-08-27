import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Radio,
  ChartCandlestick,
} from "lucide-react";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
} from "recharts";

import type {
  InterestArea,
  MarketAsset,
} from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui/primitives";

import { fetchMarketAssets } from "@/lib/marketData";
import { cn } from "@/lib/utils";

import { CandlestickChart } from "./CandlestickChart";

import { useLanguage } from "@/context/languageContext";



export function MarketDataCard({
  interests,
}: {
  interests: InterestArea[];
}) {

  const { t } = useLanguage();


  const [
    assets,
    setAssets
  ] =
  useState<MarketAsset[] | null>(null);



  const [
    isLive,
    setIsLive
  ] =
  useState(false);



  const [
    activeSymbol,
    setActiveSymbol
  ] =
  useState<string | null>(null);



  const [
    chartMode,
    setChartMode
  ] =
  useState<"line" | "candle">("candle");




  useEffect(() => {


    let mounted = true;


    async function loadMarketData(){


      setAssets(null);


      try {


        const {
          assets:data,
          isLive:live

        } =
        await fetchMarketAssets(interests);



        if(!mounted)
          return;



        setAssets(data);

        setIsLive(live);

        setActiveSymbol(
          data[0]?.symbol ?? null
        );


      }

      catch(error){


        console.error(
          "Market data error:",
          error
        );


        if(mounted){

          setAssets([]);

        }


      }



    }



    loadMarketData();



    return ()=>{

      mounted=false;

    };


  }, [interests]);





  const active =
    assets?.find(
      asset =>
      asset.symbol === activeSymbol
    )
    ??
    null;




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
        delay:0.25
      }}

    >


      <Card>


        <CardHeader>


          <div className="flex items-center justify-between">


            <div>


              <div className="flex items-center gap-2 text-primary">

                <LineChartIcon className="h-4 w-4"/>

                <span className="text-xs font-bold uppercase tracking-wide">

                  {t("market_data_title", "גרפים ונתוני שוק")}

                </span>

              </div>



              <CardTitle className="mt-1 text-xl">

                {t("market_data_subtitle", "נכסים לפי תחומי העניין שלך")}

              </CardTitle>


            </div>




            {assets && (


              <span

                className={cn(

                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",

                  isLive

                  ?

                  "bg-success/10 text-success"

                  :

                  "bg-muted text-muted-foreground"

                )}

              >


                <Radio className="h-3 w-3"/>


                {

                  isLive

                  ?

                  t("market_data_live", "נתונים חיים")

                  :

                  t("market_data_mock", "נתונים מדומים")

                }


              </span>


            )}


          </div>


        </CardHeader>






        <CardContent>




          {!assets ? (


            <div className="space-y-4">


              <div className="flex gap-2">

                {[1,2,3,4].map(i=>(

                  <Skeleton
                    key={i}
                    className="h-9 w-20"
                  />

                ))}


              </div>



              <Skeleton className="h-56 w-full"/>


            </div>


          )

          : assets.length===0 ? (


            <div className="rounded-xl border border-border p-5 text-center text-sm text-muted-foreground">

              {t("market_data_empty", "לא נמצאו נתוני שוק להצגה כרגע.")}

            </div>


          )

          : (


            <>



              <div className="flex flex-wrap gap-2">


                {
                  assets.map(asset=>(


                    <button


                      key={asset.symbol}


                      onClick={()=>
                        setActiveSymbol(asset.symbol)
                      }


                      className={cn(

                        "rounded-lg border px-3.5 py-2 text-right text-xs font-semibold transition-colors",

                        activeSymbol===asset.symbol

                        ?

                        "border-primary bg-primary/10 text-primary"

                        :

                        "border-border text-muted-foreground hover:bg-accent"

                      )}

                    >


                      <div>

                        {asset.symbol}

                      </div>



                      <div

                        className={cn(

                          "mt-0.5 flex items-center gap-1",

                          asset.changePercent>=0

                          ?

                          "text-success"

                          :

                          "text-danger"

                        )}

                      >


                        {
                          asset.changePercent>=0

                          ?

                          <TrendingUp className="h-3 w-3"/>

                          :

                          <TrendingDown className="h-3 w-3"/>
                        }


                        {asset.changePercent.toFixed(2)}%


                      </div>


                    </button>


                  ))

                }


              </div>




              {active && (


                <div className="mt-5">



                  <div className="mb-3 flex items-baseline justify-between">



                    <div>

                      <p className="text-sm font-semibold text-muted-foreground">

                        {active.name}

                      </p>


                      <p className="font-display text-2xl font-extrabold">

                        ${active.price.toFixed(2)}

                      </p>


                    </div>



                    <div className="flex items-center gap-3">



                      <span

                        className={cn(

                          "text-sm font-bold",

                          active.changePercent>=0

                          ?

                          "text-success"

                          :

                          "text-danger"

                        )}

                      >

                        {
                          active.changePercent>=0
                          ? "+"
                          : ""
                        }

                        {active.changePercent.toFixed(2)}%

                      </span>




                      <div className="flex overflow-hidden rounded-lg border border-border">



                        <button

                          onClick={()=>
                            setChartMode("candle")
                          }

                          className={cn(

                            "px-2.5 py-1.5",

                            chartMode==="candle"

                            ?

                            "bg-primary/10 text-primary"

                            :

                            "text-muted-foreground"

                          )}

                        >

                          <ChartCandlestick className="h-3.5 w-3.5"/>


                        </button>





                        <button

                          onClick={()=>
                            setChartMode("line")
                          }

                          className={cn(

                            "px-2.5 py-1.5",

                            chartMode==="line"

                            ?

                            "bg-primary/10 text-primary"

                            :

                            "text-muted-foreground"

                          )}

                        >

                          <LineChartIcon className="h-3.5 w-3.5"/>


                        </button>


                      </div>


                    </div>


                  </div>






                  <div className="h-52">


                    {
                      chartMode==="candle"

                      ?

                      <CandlestickChart
                        data={
                          active.history.slice(-45)
                        }
                      />

                      :


                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >

                        <LineChart data={active.history}>


                          <XAxis dataKey="date" hide/>


                          <YAxis hide/>



                          <RTooltip/>



                          <Line

                            type="monotone"

                            dataKey="price"

                            stroke="#22b17d"

                            strokeWidth={2.5}

                            dot={false}

                          />


                        </LineChart>


                      </ResponsiveContainer>


                    }


                  </div>




                  <p className="mt-2 text-[11px] text-muted-foreground">

                    {t("market_data_disclaimer", "לצורכי לימוד בלבד — לא המלצה לקנות או למכור נכס.")}

                  </p>



                </div>


              )}


            </>


          )}


        </CardContent>


      </Card>


    </motion.div>


  );


}
