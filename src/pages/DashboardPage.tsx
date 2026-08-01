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
import { ConceptsCard, MistakesCard, RoadmapCard } from "@/components/dashboard/LearningCards";
import { QuizCard } from "@/components/dashboard/QuizCard";
import { RotateCcw } from "lucide-react";

export function DashboardPage() {
  const { result, reset } = useAnalysis();
  const navigate = useNavigate();

  useEffect(() => {
    if (!result) navigate("/start", { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  return (
    <Layout>
      <section className="container max-w-6xl py-10 md:py-14">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-display text-3xl font-extrabold">הדשבורד הלימודי שלך</h1>
            <p className="mt-1 text-sm text-muted-foreground">כל כרטיס כולל הסבר — לא רק תוצאה.</p>
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
            נתח פרופיל חדש
          </Button>
        </div>

        <DisclaimerBanner className="mb-8" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
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
            <StrategiesCard />
          </div>

          <div className="lg:col-span-2">
            <PortfolioCard result={result} />
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
