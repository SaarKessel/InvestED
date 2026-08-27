import { motion } from "framer-motion";
import { AnalysisResult } from "../../types";
import { useLanguage } from "@/context/languageContext";

interface Props {
  result: AnalysisResult;
}

export function WealthBreakdownCard({ result }: Props) {
  const { t } = useLanguage();

  const invested =
    result.projection.totalContributed;

  const growth =
    result.projection.growth;

  const total =
    result.projection.finalBalance;


  const growthPercent =
    total > 0
      ? Math.round((growth / total) * 100)
      : 0;


  const investedPercent =
    total > 0
      ? Math.round((invested / total) * 100)
      : 0;


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-6 shadow"
    >

      <h2 className="mb-5 text-xl font-bold">
        {t("wealth_breakdown_title", "💰 איך נבנה ההון שלך?")}
      </h2>


      <div className="space-y-4">


        <div>
          <div className="flex justify-between">
            <span>
              {t("wealth_breakdown_deposits", "כסף שהפקדת")}
            </span>

            <strong>
              ₪{invested.toLocaleString()}
            </strong>
          </div>

          <div className="mt-2 h-3 rounded-full bg-gray-200">

            <div
              className="h-3 rounded-full bg-blue-500"
              style={{
                width:`${investedPercent}%`
              }}
            />

          </div>
        </div>



        <div>
          <div className="flex justify-between">
            <span>
              {t("wealth_breakdown_growth", "צמיחת השקעה")}
            </span>

            <strong>
              ₪{growth.toLocaleString()}
            </strong>
          </div>


          <div className="mt-2 h-3 rounded-full bg-gray-200">

            <div
              className="h-3 rounded-full bg-green-500"
              style={{
                width:`${growthPercent}%`
              }}
            />

          </div>

        </div>


      </div>


      <p className="mt-5 text-gray-600">
        {t("wealth_breakdown_summary", "🚀 כ־{pct}% מההון העתידי שלך נוצר בזכות צמיחת ההשקעה לאורך זמן.").replace("{pct}", String(growthPercent))}
      </p>


    </motion.div>
  );
}
