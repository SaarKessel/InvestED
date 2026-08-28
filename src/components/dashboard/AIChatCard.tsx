import { useState } from "react";
import { useLanguage } from "@/context/languageContext";

interface Props {
  result: Record<string, unknown>;
}

export function AIChatCard({ result }: Props) {
  const { t } = useLanguage();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  function askAI() {

    if (!question.trim()) return;


    const q = question.toLowerCase();


    if (q.includes("סיכון") || q.includes("risk")) {

      setAnswer(
        t("ai_chat_risk_a", "Based on your profile, the risk level is {risk}. The recommendation is based on the investment horizon and your ability to handle volatility.").replace("{risk}", String(result.riskDescription))
      );

      return;

    }


    if (q.includes("למה") || q.includes("why")) {

      setAnswer(
        t("ai_chat_why_a", "The recommendation is based on a combination of age, investment horizon, risk tolerance, and interests.")
      );

      return;

    }


    setAnswer(
      t("ai_chat_default_a", "בהתבסס על הנתונים שלך, המפתח המרכזי הוא התמדה, פיזור השקעות וניצול זמן.")
    );

  }


  return (

    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-4 text-xl font-bold">
        🤖 {t("ai_chat_header", "AI Financial Coach")}
      </h2>


      <input
        value={question}
        onChange={(e)=>setQuestion(e.target.value)}
        placeholder={t("ai_chat_input_placeholder", "שאל אותי על תוכנית ההשקעה שלך...")}
        className="w-full rounded-xl border p-3"
      />


      <button

        onClick={askAI}

        className="mt-3 rounded-xl bg-blue-600 px-5 py-2 text-white"

      >

        {t("ai_chat_button", "שאל AI")}

      </button>


      {answer && (

        <div className="mt-4 rounded-xl bg-gray-50 p-4">

          {answer}

        </div>

      )}


    </div>

  );
}
