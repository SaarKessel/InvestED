import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/languageContext";

interface ScenarioData {
  scenario?: {
    initialInvestment?: number;
  };
  initial_investment?: number;
}

interface Scenario {
  id: string;
  createdAt: string | Date;
  data?: ScenarioData;
}

interface Props {
  scenarios: Scenario[];
  onDelete?: (id: string) => void;
}

export function ScenarioHistoryCard({
  scenarios,
  onDelete,
}: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-5 text-xl font-bold">
        📂 {t("scenario_history_header", "Investment History")}
      </h2>

      {scenarios.length === 0 ? (

        <p className="text-gray-500">
          {t("scenario_history_empty", "No saved scenarios yet")}
        </p>

      ) : (

        <div className="space-y-4">

          {scenarios.map((scenario) => (

            <div
              key={scenario.id}
              className="rounded-xl border p-4"
            >

              <p className="font-bold">
                {t("scenario_history_title", "תרחיש השקעה")}
              </p>


              <p>
                {t("scenario_history_investment", "השקעה:")}
                ₪
                {(
                  scenario.data?.scenario?.initialInvestment ??
                  scenario.data?.initial_investment ??
                  0
                ).toLocaleString()}
              </p>


              <p>
                {t("scenario_history_created", "נוצר:")}
                {new Date(
                  scenario.createdAt
                ).toLocaleDateString()}
              </p>


              <div className="mt-4 flex gap-3">

                <button
                  onClick={() =>
                    navigate(`/scenarios/${scenario.id}`)
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                  {t("scenario_history_open", "פתיחה")}
                </button>


                {onDelete && (

                  <button
                    onClick={() =>
                      onDelete(scenario.id)
                    }
                    className="rounded-lg border px-4 py-2 text-red-600"
                  >
                    {t("scenario_history_delete", "מחיקה")}
                  </button>

                )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}
