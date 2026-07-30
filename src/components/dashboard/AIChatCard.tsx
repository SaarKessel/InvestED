import { useState } from "react";

interface Props {
  result: any;
}

export function AIChatCard({ result }: Props) {

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  function askAI() {

    if (!question.trim()) return;


    const q = question.toLowerCase();


    if (q.includes("סיכון") || q.includes("risk")) {

      setAnswer(
        `לפי הפרופיל שלך רמת הסיכון היא ${result.riskDescription}. 
        ההמלצה מבוססת על אופק ההשקעה והיכולת שלך להתמודד עם תנודתיות.`
      );

      return;
    }


    if (q.includes("למה") || q.includes("why")) {

      setAnswer(
        "ההמלצה מבוססת על שילוב בין גיל, אופק השקעה, סיבולת סיכון ותחומי עניין."
      );

      return;
    }


    setAnswer(
      "בהתבסס על הנתונים שלך, המפתח המרכזי הוא התמדה, פיזור השקעות וניצול זמן."
    );

  }


  return (

    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-4 text-xl font-bold">
        🤖 AI Financial Coach
      </h2>


      <input
        value={question}
        onChange={(e)=>setQuestion(e.target.value)}
        placeholder="שאל אותי על תוכנית ההשקעה שלך..."
        className="w-full rounded-xl border p-3"
      />


      <button

        onClick={askAI}

        className="mt-3 rounded-xl bg-blue-600 px-5 py-2 text-white"

      >

        שאל AI

      </button>


      {answer && (

        <div className="mt-4 rounded-xl bg-gray-50 p-4">

          {answer}

        </div>

      )}


    </div>

  );
}