import { useLanguage } from "@/context/languageContext";

export interface RoadmapStage {
  year: string;
  title: string;
  actions: string[];
}

interface Props {
  stages: RoadmapStage[];
}

export function FinancialRoadmapCard({ stages }: Props) {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-6 text-xl font-bold">
        {t("roadmap_title", "🛣️ המסלול שלך לעצמאות כלכלית")}
      </h2>


      <div className="space-y-6">

        {stages.length === 0 ? (

          <div className="text-gray-500">
            {t("roadmap_empty", "המסלול הפיננסי שלך ייבנה לאחר ניתוח הנתונים.")}
          </div>

        ) : (

          stages.map((stage, index) => (

            <div
              key={index}
              className="border-l-4 border-blue-500 pl-4"
            >

              <h3 className="font-bold">
                {stage.title}
              </h3>

              <p className="text-sm text-gray-500">
                {stage.year}
              </p>


              <ul className="mt-2 list-disc pl-5 text-sm">

                {stage.actions.map((action, i) => (

                  <li key={i}>
                    {action}
                  </li>

                ))}

              </ul>


            </div>

          ))

        )}

      </div>

    </div>
  );
}
