import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingUp } from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { Card, CardContent, Button } from "@/components/ui/primitives";

import { parseStockScenario } from "@/lib/stockScenarioParser";

import { fetchMarketAssetBySymbol } from "@/lib/marketData";

import {
  simulateHistoricalInvestment,
  projectStockInvestment,
} from "@/lib/stockSimulationEngine";


interface SimulationSeriesPoint {
  date?: string;
  month?: number;
  value?: number;
  projectedValue?: number;
}


interface SimulationResult {
  invested?: number;
  contributed?: number;
  finalValue?: number;
  projectedValue?: number;
  series?: SimulationSeriesPoint[];
}


export function StockSimulator() {

  const [query, setQuery] = useState("");

  const [loading, setLoading] = useState(false);

  const [result, setResult] = useState<SimulationResult | null>(null);

  const [error, setError] = useState("");


  async function handleAnalyze() {

    try {

      setLoading(true);
      setError("");
      setResult(null);


      const scenario = parseStockScenario(query);


      if (!scenario.symbol) {

        throw new Error(
          "לא זוהה סימול מניה"
        );

      }


      if (scenario.mode === "historical") {

        const market =
          await fetchMarketAssetBySymbol(
            scenario.symbol,
            "10y",
            "1mo"
          );


        if (!market) {

          throw new Error(
            "לא נמצאו נתוני מניה"
          );

        }


        const simulation =
          simulateHistoricalInvestment({

            symbol: scenario.symbol,

            prices:
              market.history.map(
                (p: { date: string; price: number }) => ({
                  date: p.date,
                  price: p.price,
                })
              ),

            contribution: scenario.contribution,

          });


        setResult(simulation);


      } else {


        const projection =
          projectStockInvestment({

            symbol: scenario.symbol,

            years:
              scenario.years ?? 10,

            annualReturnPercent:
              8,

            initialInvestment:
              scenario.contribution.initialInvestment,

            monthlyContribution:
              scenario.contribution.monthlyContribution,

          });


        setResult(projection);

      }


    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "שגיאה בחישוב"
      );


    } finally {

      setLoading(false);

    }

  }



  return (

    <Card className="mt-6">

      <CardContent className="pt-6">


        <div className="flex items-center gap-2 mb-4">

          <TrendingUp className="h-5 w-5 text-primary"/>

          <h2 className="font-bold text-lg">
            סימולטור השקעות מניות
          </h2>

        </div>



        <textarea

          value={query}

          onChange={(e) =>
            setQuery(e.target.value)
          }

          placeholder="לדוגמה: אם הייתי משקיע 100 אלף שקל ב-VOO לפני 10 שנים"

          rows={3}

          className="
          w-full rounded-xl border
          bg-background p-4 text-sm
          "

        />



        <Button

          className="mt-4"

          disabled={
            loading ||
            !query.trim()
          }

          onClick={handleAnalyze}

        >

          <Calculator className="h-4 w-4"/>

          {loading
            ? "מחשב..."
            : "חשב סימולציה"
          }

        </Button>




        {error && (

          <p className="mt-4 text-red-500 text-sm">

            {error}

          </p>

        )}





        {result && (

          <motion.div

            initial={{
              opacity:0,
              y:10
            }}

            animate={{
              opacity:1,
              y:0
            }}

            className="mt-6 space-y-4"

          >


            <div className="
            grid grid-cols-2 gap-3
            ">


              <div className="
              rounded-xl border p-4
              ">

                <p className="text-xs text-muted-foreground">
                  השקעה
                </p>


                <p className="text-xl font-bold">

                  ₪
                  {(
                    result.invested ??
                    result.contributed ??
                    0
                  ).toLocaleString()}

                </p>

              </div>



              <div className="
              rounded-xl border p-4
              ">

                <p className="text-xs text-muted-foreground">
                  שווי סופי
                </p>


                <p className="text-xl font-bold text-primary">

                  ₪
                  {(
                    result.finalValue ??
                    result.projectedValue ??
                    0
                  ).toLocaleString()}

                </p>

              </div>


            </div>




            {result.series && (

              <div className="h-64">


                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <AreaChart
                    data={result.series}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />


                    <XAxis

                      dataKey={
                        result.series[0]?.date
                          ? "date"
                          : "month"
                      }

                    />


                    <YAxis hide />


                    <Tooltip />


                    <Area

                      type="monotone"

                      dataKey={
                        result.series[0]?.value
                          ? "value"
                          : "projectedValue"
                      }

                      stroke="#22b17d"

                      fill="#22b17d"

                    />


                  </AreaChart>


                </ResponsiveContainer>


              </div>

            )}


          </motion.div>

        )}


      </CardContent>

    </Card>

  );

}
