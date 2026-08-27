import { motion } from "framer-motion";
import {
  TrendingUp,
  Wallet,
  PiggyBank,
  LineChart,
  ShieldCheck
} from "lucide-react";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/primitives";


import type {
  AnalysisResult
} from "@/types";

import { useLanguage } from "@/context/languageContext";




// =====================================================
// Helpers
// =====================================================


function formatCurrency(
  value:number
){

  return new Intl.NumberFormat(
    "he-IL",
    {
      style:"currency",
      currency:"ILS",
      maximumFractionDigits:0
    }
  ).format(value);

}



// =====================================================
// Projection Card
// =====================================================

interface ScenarioProjection {
  growth?: number;
  finalBalance?: number;
  realValueAfterInflation?: number;
}

interface FinancialScenarioWithProjection {
  initialInvestment?: number;
  monthlyContribution?: number;
  years?: number;
  annualReturnPct?: number;
  projection?: ScenarioProjection;
}


export function ProjectionCard({
  result
}:{
  result:AnalysisResult
}){

  const { t } = useLanguage();


  const scenario =
    result.scenario as FinancialScenarioWithProjection;



  if(!scenario){

    return null;

  }



  const initialInvestment =
    scenario.initialInvestment ?? 0;



  const monthlyContribution =
    scenario.monthlyContribution ?? 0;



  const years =
    scenario.years ?? 0;



  const annualReturn =
    scenario.annualReturnPct ?? 0;



  // fallback calculation
  const totalContributed =
    initialInvestment +
    (
      monthlyContribution *
      years *
      12
    );



  const estimatedGrowth =
    Math.max(
      0,
      result.projection?.growth ?? 0
    );



  const finalValue =
    result.projection?.finalBalance
    ??
    (
      totalContributed +
      estimatedGrowth
    );



  const realValue =
    result.projection?.realValueAfterInflation
    ??
    finalValue;



  return (


    <motion.div


    initial={{
      opacity:0,
      y:15
    }}


    animate={{
      opacity:1,
      y:0
    }}


    transition={{
      duration:0.35
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


    <div className="
    flex
    items-center
    gap-2
    text-primary
    ">


    <TrendingUp
    className="
    h-5
    w-5
    "
    />


    <CardTitle>

      {t("projection_title", "תחזית פיננסית חכמה")}

    </CardTitle>


    </div>


    <p className="
    text-sm
    text-muted-foreground
    "
    >

      {t("projection_subtitle", "סימולציה חינוכית לפי הנתונים שהוזנו")}

    </p>


    </CardHeader>






    <CardContent>


    <div className="
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
    bg-background
    p-4
    "
    >


    <Wallet
    className="
    mb-2
    h-5
    w-5
    text-primary
    "
    />


    <p className="
    text-xs
    text-muted-foreground
    ">

      {t("projection_initial", "השקעה התחלתית")}

    </p>


    <p className="
    text-lg
    font-bold
    ">

    {
    formatCurrency(
    initialInvestment
    )
    }

    </p>


    </div>






    <div
    className="
    rounded-xl
    border
    bg-background
    p-4
    "
    >


    <PiggyBank
    className="
    mb-2
    h-5
    w-5
    text-primary
    "
    />


    <p className="
    text-xs
    text-muted-foreground
    ">

      {t("projection_total", "סך הפקדות")}

    </p>


    <p className="
    text-lg
    font-bold
    ">

    {
    formatCurrency(
    totalContributed
    )
    }

    </p>


    </div>






    <div
    className="
    rounded-xl
    border
    bg-background
    p-4
    "
    >


    <LineChart
    className="
    mb-2
    h-5
    w-5
    text-primary
    "
    />


    <p className="
    text-xs
    text-muted-foreground
    ">

      {t("projection_final", "שווי עתידי צפוי")}

    </p>


    <p className="
    text-lg
    font-bold
    ">

    {
    formatCurrency(
    finalValue
    )
    }

    </p>


    </div>






    <div
    className="
    rounded-xl
    border
    bg-background
    p-4
    "
    >


    <ShieldCheck
    className="
    mb-2
    h-5
    w-5
    text-primary
    "
    />


    <p className="
    text-xs
    text-muted-foreground
    ">

      {t("projection_inflation", "ערך לאחר אינפלציה")}

    </p>


    <p className="
    text-lg
    font-bold
    ">

    {
    formatCurrency(
    realValue
    )
    }

    </p>


    </div>



    </div>




    <div className="
    mt-5
    rounded-xl
    border
    bg-background
    p-4
    "
    >


    <p className="
    text-sm
    text-muted-foreground
    "
    >

      {t("projection_assumption", "הסימולציה מבוססת על תשואה שנתית משוערת של")}

    <span className="
    font-bold
    text-foreground
    "
    >

    {" "}
    {annualReturn}%

    </span>

      {t("projection_range", "לטווח של")}

    <span className="
    font-bold
    text-foreground
    "
    >

    {" "}
    {years} {t("projection_years", "שנים")}

    </span>

    .

    </p>


    </div>



    </CardContent>




    </Card>



    </motion.div>


);


}
