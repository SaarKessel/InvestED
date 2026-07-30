import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../context/AnalysisContext";
import { InvestmentGrowthChart } from "../components/InvestmentGrowthChart";
import { InvestmentInsightCard } from "../components/InvestmentInsightCard";
import { WealthBreakdownCard } from "../components/dashboard/WealthBreakdownCard";

export function DashboardPage() {
  const { result, reset } = useAnalysis();
  const navigate = useNavigate();

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            עדיין אין ניתוח השקעה
          </h2>

          <button
            onClick={() => navigate("/calculator")}
            className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-white"
          >
            צור תרחיש חדש
          </button>
        </div>
      </div>
    );
  }

  const initialInvestment =
    result.scenario.initialInvestment;

  const futureValue =
    result.projection.finalBalance;

  const profit =
    futureValue - initialInvestment;


  return (
    <div className="space-y-8 p-6">


      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <h1 className="text-4xl font-bold">
          דשבורד ההשקעות שלך 🚀
        </h1>

        <p className="mt-2 text-gray-500">
          ניתוח חכם מבוסס AI לבניית עצמאות כלכלית
        </p>

      </motion.div>



      {/* Summary Cards */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          show: {
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      >


        <motion.div
          className="rounded-2xl bg-white p-6 shadow"
        >

          <p className="text-gray-500">
            השקעה התחלתית
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₪{initialInvestment.toLocaleString()}
          </h2>

        </motion.div>



        <motion.div
          className="rounded-2xl bg-white p-6 shadow"
        >

          <p className="text-gray-500">
            שווי עתידי
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-600">
            ₪{futureValue.toLocaleString()}
          </h2>

        </motion.div>



        <motion.div
          className="rounded-2xl bg-white p-6 shadow"
        >

          <p className="text-gray-500">
            רווח צפוי
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            ₪{profit.toLocaleString()}
          </h2>

        </motion.div>


      </motion.div>




      {/* Growth Chart */}
      <div className="rounded-2xl bg-white p-6 shadow">

        <h2 className="mb-5 text-xl font-bold">
          צמיחת ההון לאורך השנים 📈
        </h2>


        <InvestmentGrowthChart
          data={result.projection.series}
        />

      </div>

<WealthBreakdownCard
  result={result}
/>




      {/* AI Insight */}

      <InvestmentInsightCard
        result={result}
      />




      <button
        onClick={reset}
        className="rounded-xl border px-5 py-3"
      >
        איפוס תרחיש
      </button>


    </div>
  );
}