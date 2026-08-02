import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Button } from "@/components/ui/primitives";
import { useAnalysis } from "@/context/useAnalysis";

import {
  WelcomeCard,
  InvestorTypeCard,
  RiskScoreCard,
  HorizonCard,
  InterestsCard,
} from "@/components/dashboard/ProfileSummaryCards";

import { ExplainableAiCard } from "@/components/dashboard/ExplainableAiCard";
import { StrategiesCard } from "@/components/dashboard/StrategiesCard";
import { PortfolioCard } from "@/components/dashboard/PortfolioCard";
import { MarketDataCard } from "@/components/dashboard/MarketDataCard";
import { ComparisonCard } from "@/components/dashboard/ComparisonCard";

import {
  ConceptsCard,
  MistakesCard,
  RoadmapCard,
} from "@/components/dashboard/LearningCards";

import { QuizCard } from "@/components/dashboard/QuizCard";
import { RotateCcw } from "lucide-react";
import { GoalPlannerCard } from "@/components/GoalPlannerCard";


// =====================================================
// Horizon Display Helper
// =====================================================

function horizonLabel(
  horizon: string | null
){

  switch(horizon){

    case "short":
      return "׳§׳¦׳¨";

    case "medium":
      return "׳‘׳™׳ ׳•׳ ׳™";

    case "long":
      return "׳׳¨׳•׳";

    default:
      return "׳׳ ׳”׳•׳’׳“׳¨";

  }

}




export function DashboardPage() {

  const { result, reset } = useAnalysis();

  const navigate = useNavigate();



  useEffect(() => {

    if (!result) {

      navigate("/start", {
        replace: true,
      });

    }

  }, [result, navigate]);



  if (!result) return null;



  return (

    <Layout>

      <section className="container max-w-6xl py-10 md:py-14">


        {/* Header */}

        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <h1 className="font-display text-3xl font-extrabold">

              נ€ ׳₪׳¨׳•׳₪׳™׳ ׳”׳׳©׳§׳™׳¢ ׳©׳׳ ׳׳•׳›׳

            </h1>


            <p className="mt-2 max-w-xl text-sm text-muted-foreground">

              AI ׳ ׳™׳×׳— ׳׳× ׳”׳׳˜׳¨׳•׳×, ׳¨׳׳× ׳”׳¡׳™׳›׳•׳ ׳•׳¡׳’׳ ׳•׳ ׳”׳”׳©׳§׳¢׳” ׳©׳׳
              ׳•׳™׳¦׳¨ ׳¢׳‘׳•׳¨׳ ׳×׳׳•׳ ׳× ׳׳¦׳‘ ׳₪׳™׳ ׳ ׳¡׳™׳× ׳•׳׳¡׳׳•׳ ׳׳׳™׳“׳” ׳׳™׳©׳™.

            </p>


          </div>



          <Button

            variant="outline"

            size="sm"

            className="gap-2"

            onClick={() => {

              reset();

              navigate("/start");

            }}

          >

            <RotateCcw className="h-3.5 w-3.5" />

            ׳ ׳×׳— ׳₪׳¨׳•׳₪׳™׳ ׳׳—׳“׳©

          </Button>


        </div>




        <DisclaimerBanner className="mb-8" />





        {/* AI Summary Banner */}

        <div className="mb-8 rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">


          <div className="mb-5 flex items-center gap-3">


            <span className="text-2xl">

              נ₪–

            </span>


            <div>

              <h2 className="text-xl font-bold">

                AI Investor Profile

              </h2>


              <p className="text-sm text-muted-foreground">

                ׳×׳׳•׳ ׳× ׳׳¦׳‘ ׳¨׳׳©׳•׳ ׳™׳× ׳׳₪׳™ ׳”׳ ׳×׳•׳ ׳™׳ ׳©׳¡׳™׳₪׳§׳×

              </p>

            </div>


          </div>





          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">



            <div className="rounded-xl bg-white p-4 shadow-sm">

              <p className="text-xs text-muted-foreground">

                ׳¡׳’׳ ׳•׳ ׳”׳©׳§׳¢׳”

              </p>


              <p className="mt-1 text-lg font-bold">

                {result.investor?.type ?? "׳׳©׳§׳™׳¢"}

              </p>


            </div>






            <div className="rounded-xl bg-white p-4 shadow-sm">


              <p className="text-xs text-muted-foreground">

                ׳¨׳׳× ׳¡׳™׳›׳•׳

              </p>


              <p className="mt-1 text-lg font-bold">

                {result.riskScore ?? 0}/10

              </p>


            </div>






            <div className="rounded-xl bg-white p-4 shadow-sm">


              <p className="text-xs text-muted-foreground">

                ׳׳•׳₪׳§ ׳”׳©׳§׳¢׳”

              </p>


              <p className="mt-1 text-lg font-bold">

                {horizonLabel(result.horizon)}

              </p>


            </div>



          </div>


        </div>






        <motion.div

          initial="hidden"

          animate="show"

          variants={{
            show: {
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}

          className="grid grid-cols-1 gap-5 lg:grid-cols-2"

        >



          <div className="lg:col-span-2">

            <WelcomeCard result={result} />

          </div>




          <InvestorTypeCard result={result} />

          <RiskScoreCard result={result} />

          <HorizonCard result={result} />

          <InterestsCard result={result} />





          <div className="lg:col-span-2">

            <ExplainableAiCard result={result} />

          </div>





          <div className="lg:col-span-2">

            <PortfolioCard result={result} />


{
result.goalPlan && (

<div className="lg:col-span-2">

<GoalPlannerCard

targetAmount={
result.goalPlan.targetAmount
}

currentAmount={
result.goalPlan.currentAmount
}

years={
result.goalPlan.years
}

requiredMonthlyContribution={
result.goalPlan.requiredMonthlyContribution
}

expectedFinalValue={
result.goalPlan.expectedFinalValue
}

progressPercentage={
result.goalPlan.progressPercentage
}

achievable={
result.goalPlan.achievable
}

/>

</div>

)
}


          </div>





          <div className="lg:col-span-2">

            <StrategiesCard />

          </div>





          <div className="lg:col-span-2">

            <MarketDataCard interests={result.flags.interests} />

          </div>





          <div className="lg:col-span-2">

            <ComparisonCard />

          </div>





          <div className="lg:col-span-2">

            <ConceptsCard />

          </div>





          <MistakesCard />

          <RoadmapCard result={result} />





          <div className="lg:col-span-2">

            <QuizCard />

          </div>




        </motion.div>


      </section>


    </Layout>

  );

}
