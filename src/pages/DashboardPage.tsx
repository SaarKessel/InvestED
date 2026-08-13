import { useEffect, useState } from "react";
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
import {
  getDashboardOnboardingSeen,
  setDashboardOnboardingSeen,
} from "@/lib/dashboardOnboarding";



// =====================================================
// Horizon Display Helper
// =====================================================

function horizonLabel(
  horizon: string | null
){

  switch(horizon){

    case "short":
      return "קצר";

    case "medium":
      return "בינוני";

    case "long":
      return "ארוך";

    default:
      return "לא מוגדר";

  }

}




export function DashboardPage() {


  const {
    result,
    reset,
    hasHistoryConsent,
    setHistoryConsent,
    analysisHistory,
    clearAnalysisHistory,
  } = useAnalysis();

  const navigate = useNavigate();
  const [isOnboardingVisible, setIsOnboardingVisible] = useState<boolean>(() => !getDashboardOnboardingSeen());



  useEffect(() => {

    if(!result){

      navigate("/start", {
        replace:true,
      });

    }

  },[result,navigate]);



  if(!result)
    return null;



  return (

    <Layout>


      <section className="container max-w-6xl py-10 md:py-14">


        {/* Header */}

        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">


          <div>


            <h1 className="font-display text-3xl font-extrabold">

              🚀 פרופיל המשקיע שלך מוכן

            </h1>



            <p className="mt-2 max-w-xl text-sm text-muted-foreground">

              AI ניתח את המטרות, רמת הסיכון וסגנון ההשקעה שלך
              ויצר עבורך תמונת מצב פיננסית ומסלול למידה אישי.

            </p>


          </div>



          <Button

            variant="outline"

            size="sm"

            className="gap-2"

            onClick={()=>{

              reset();

              navigate("/start");

            }}

          >

            <RotateCcw className="h-3.5 w-3.5"/>

            נתח פרופיל מחדש

          </Button>


        </div>




        <DisclaimerBanner className="mb-8"/>



        {isOnboardingVisible && (

          <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 p-5 shadow-sm">

            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

              <div>

                <h2 className="text-lg font-bold text-slate-900">👋 מדריך מהיר לדשבורד</h2>

                <p className="mt-2 text-sm text-slate-700">

                  כאן תוכלו לראות את פרופיל המשקיע, המלצות, תיק, מסלול למידה ורמת היעד הפיננסי — כל הכלים המרכזיים עובדים יחד במקום אחד.

                </p>

              </div>

              <Button

                variant="outline"

                size="sm"

                onClick={() => {
                  setDashboardOnboardingSeen(true);
                  setIsOnboardingVisible(false);
                }}

              >

                סגור

              </Button>

            </div>

          </div>

        )}



        <div className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-lg font-bold text-slate-900">

                📜 שמירת היסטוריית ניתוחים

              </h2>

              <p className="mt-1 text-sm text-muted-foreground">

                אפשר לשמור את תוצאות הניתוח המקומית בדפדפן שלך, כדי לחזור אליהן מאוחר יותר.

              </p>

            </div>

            <div className="flex items-center gap-3">

              <Button

                variant={hasHistoryConsent ? "default" : "outline"}

                size="sm"

                onClick={() => setHistoryConsent(!hasHistoryConsent)}

              >

                {hasHistoryConsent ? "שמירה פעילה" : "הפעל שמירה"}

              </Button>

              {analysisHistory.length > 0 && (

                <Button

                  variant="ghost"

                  size="sm"

                  onClick={clearAnalysisHistory}

                >

                  נקה היסטוריה

                </Button>

              )}

            </div>

          </div>

          {hasHistoryConsent && analysisHistory.length > 0 && (

            <div className="mt-4 grid gap-3 md:grid-cols-2">

              {analysisHistory.slice(0, 4).map((entry) => (

                <div

                  key={entry.id}

                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"

                >

                  <p className="text-xs text-slate-500">

                    {new Date(entry.savedAt).toLocaleString("he-IL")}

                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-900">

                    {entry.profileText.slice(0, 120)}

                    {entry.profileText.length > 120 ? "..." : ""}

                  </p>

                </div>

              ))}

            </div>

          )}

        </div>



        {/* AI Summary Banner */}


        <div className="mb-8 rounded-2xl border bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">


          <div className="mb-5 flex items-center gap-3">


            <span className="text-2xl">

              🤖

            </span>


            <div>


              <h2 className="text-xl font-bold">

                AI Investor Profile

              </h2>


              <p className="text-sm text-muted-foreground">

                תמונת מצב ראשונית לפי הנתונים שסיפקת

              </p>


            </div>


          </div>




          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">


            <div className="rounded-xl bg-white p-4 shadow-sm">


              <p className="text-xs text-muted-foreground">

                סגנון השקעה

              </p>


              <p className="mt-1 text-lg font-bold">

                {result.investor?.type ?? "משקיע"}

              </p>


            </div>





            <div className="rounded-xl bg-white p-4 shadow-sm">


              <p className="text-xs text-muted-foreground">

                רמת סיכון

              </p>


              <p className="mt-1 text-lg font-bold">

                {result.riskScore ?? 0}/10

              </p>


            </div>





            <div className="rounded-xl bg-white p-4 shadow-sm">


              <p className="text-xs text-muted-foreground">

                אופק השקעה

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
            show:{
              transition:{
                staggerChildren:0.05,
              },
            },
          }}


          className="grid grid-cols-1 gap-5 lg:grid-cols-2"


        >



          <div className="lg:col-span-2">

            <WelcomeCard result={result}/>

          </div>





          <InvestorTypeCard result={result}/>

          <RiskScoreCard result={result}/>

          <HorizonCard result={result}/>

          <InterestsCard result={result}/>





          <div className="lg:col-span-2">

            <ExplainableAiCard result={result}/>

          </div>





          <div className="lg:col-span-2">

            <PortfolioCard result={result}/>

          </div>





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

                  retirementPlan={
                    result.retirementPlan
                  }


                />


              </div>

            )
          }





          <div className="lg:col-span-2">

            <StrategiesCard/>

          </div>





          <div className="lg:col-span-2">

            <MarketDataCard interests={result.flags.interests}/>

          </div>





          <div className="lg:col-span-2">

            <ComparisonCard/>

          </div>





          <div className="lg:col-span-2">

            <ConceptsCard/>

          </div>





          <MistakesCard/>

          <RoadmapCard result={result}/>





          <div className="lg:col-span-2">

            <QuizCard/>

          </div>



        </motion.div>



      </section>


    </Layout>

  );


}
