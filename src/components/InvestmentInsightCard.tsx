import { AnalysisResult } from "../types";

interface Props {
  result: AnalysisResult;
}

export function InvestmentInsightCard({ result }: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="text-xl font-bold mb-4">
        🧠 תובנת InvestED
      </h2>

      <p className="text-gray-700">
        {result.aiNarration?.profileSummary ||
          "המערכת ניתחה את פרופיל ההשקעה שלך ובנתה תרחיש מותאם אישית."}
      </p>


      <div className="mt-4 rounded-xl bg-gray-50 p-4">

        <p>
          נכס:
          <strong className="mr-2">
            {result.scenario.assetClassKey}
          </strong>
        </p>

        <p>
          תשואה משוערת:
          <strong className="mr-2">
            {result.scenario.annualReturnPct}%
          </strong>
        </p>

        <p>
          אופק:
          <strong className="mr-2">
            {result.scenario.years} שנים
          </strong>
        </p>

      </div>

    </div>
  );
}