import { useState } from "react";

const KEY = "invested_analysis";

export function useAnalysisStorage() {

  const [analysis, setAnalysis] = useState<any>(() => {

    const saved = localStorage.getItem(KEY);

    return saved
      ? JSON.parse(saved)
      : null;

  });


  function saveAnalysis(data:any){

    localStorage.setItem(
      KEY,
      JSON.stringify(data)
    );

    setAnalysis(data);

  }


  function clearAnalysis(){

    localStorage.removeItem(KEY);

    setAnalysis(null);

  }


  return {
    analysis,
    saveAnalysis,
    clearAnalysis
  };

}
