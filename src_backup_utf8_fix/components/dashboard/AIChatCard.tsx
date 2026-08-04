import { useState } from "react";

interface Props {
  result: Record<string, unknown>;
}

export function AIChatCard({ result }: Props) {

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  function askAI() {

    if (!question.trim()) return;


    const q = question.toLowerCase();


    if (q.includes("׳¡׳™׳›׳•׳") || q.includes("risk")) {

      setAnswer(
        `׳׳₪׳™ ׳”׳₪׳¨׳•׳₪׳™׳ ׳©׳׳ ׳¨׳׳× ׳”׳¡׳™׳›׳•׳ ׳”׳™׳ ${result.riskDescription}. 
        ׳”׳”׳׳׳¦׳” ׳׳‘׳•׳¡׳¡׳× ׳¢׳ ׳׳•׳₪׳§ ׳”׳”׳©׳§׳¢׳” ׳•׳”׳™׳›׳•׳׳× ׳©׳׳ ׳׳”׳×׳׳•׳“׳“ ׳¢׳ ׳×׳ ׳•׳“׳×׳™׳•׳×.`
      );

      return;
    }


    if (q.includes("׳׳׳”") || q.includes("why")) {

      setAnswer(
        "׳”׳”׳׳׳¦׳” ׳׳‘׳•׳¡׳¡׳× ׳¢׳ ׳©׳™׳׳•׳‘ ׳‘׳™׳ ׳’׳™׳, ׳׳•׳₪׳§ ׳”׳©׳§׳¢׳”, ׳¡׳™׳‘׳•׳׳× ׳¡׳™׳›׳•׳ ׳•׳×׳—׳•׳׳™ ׳¢׳ ׳™׳™׳."
      );

      return;
    }


    setAnswer(
      "׳‘׳”׳×׳‘׳¡׳¡ ׳¢׳ ׳”׳ ׳×׳•׳ ׳™׳ ׳©׳׳, ׳”׳׳₪׳×׳— ׳”׳׳¨׳›׳–׳™ ׳”׳•׳ ׳”׳×׳׳“׳”, ׳₪׳™׳–׳•׳¨ ׳”׳©׳§׳¢׳•׳× ׳•׳ ׳™׳¦׳•׳ ׳–׳׳."
    );

  }


  return (

    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-4 text-xl font-bold">
        נ₪– AI Financial Coach
      </h2>


      <input
        value={question}
        onChange={(e)=>setQuestion(e.target.value)}
        placeholder="׳©׳׳ ׳׳•׳×׳™ ׳¢׳ ׳×׳•׳›׳ ׳™׳× ׳”׳”׳©׳§׳¢׳” ׳©׳׳..."
        className="w-full rounded-xl border p-3"
      />


      <button

        onClick={askAI}

        className="mt-3 rounded-xl bg-blue-600 px-5 py-2 text-white"

      >

        ׳©׳׳ AI

      </button>


      {answer && (

        <div className="mt-4 rounded-xl bg-gray-50 p-4">

          {answer}

        </div>

      )}


    </div>

  );
}
