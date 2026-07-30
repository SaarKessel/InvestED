import { AIInsight } from "../../features/ai/financialCoach";

interface AIInsightCardProps {
  insights: AIInsight[];
}

export default function AIInsightCard({
  insights
}: AIInsightCardProps) {

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">

      <h3 className="mb-4 text-xl font-bold">
        🧠 InvestED AI Insights
      </h3>

      <div className="space-y-4">

        {insights.length === 0 && (
          <p className="text-gray-500">
            Complete your profile to receive personalized insights.
          </p>
        )}

        {insights.map((item,index)=>(
          <div
            key={index}
            className="rounded-xl bg-gray-50 p-4"
          >

            <div className="flex justify-between">

              <h4 className="font-semibold">
                {item.title}
              </h4>

              <span className="text-sm">
                {item.priority}
              </span>

            </div>

            <p className="mt-2 text-gray-600">
              {item.message}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}