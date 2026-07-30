interface Props {
  result: any;
}

export function ExplainableAICard({ result }: Props) {

  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-4 text-xl font-bold">
        🤖 Explainable AI
      </h2>

      <p className="text-gray-600">
        ניתוח הסיבות מאחורי המלצת ההשקעה:
      </p>


      <div className="mt-4 space-y-2 text-sm text-gray-500">

        <p>
          סוג משקיע:
          {" "}
          {result.investor ?? "לא זוהה"}
        </p>


        <p>
          אופק השקעה:
          {" "}
          {result.horizon ?? "לא זוהה"}
        </p>


        <p>
          רמת סיכון:
          {" "}
          {result.riskDescription ?? "לא זוהה"}
        </p>


      </div>


    </div>
  );
}