import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import type {
  AnalysisResult,
} from "@/types";

import type {
  AnalysisHistoryEntry,
} from "@/lib/analysisHistoryStorage";

import {
  appendAnalysisHistory,
  getAnalysisHistory,
  getHistoryConsent,
  setHistoryConsent as persistHistoryConsent,
  clearAnalysisHistory as clearStoredHistory,
} from "@/lib/analysisHistoryStorage";

import {
  buildRuleBasedAnalysis,
  tryEnhanceWithOllama,
} from "@/lib/analysisService";


export interface AnalysisContextValue {

  profile: AnalysisResult | null;

  setProfile: (
    value: AnalysisResult | null
  ) => void;

  result: AnalysisResult | null;

  analyze: (
    data: string
  ) => Promise<void>;

  reset: () => void;

  isAnalyzing: boolean;

  hasHistoryConsent: boolean;

  setHistoryConsent: (enabled: boolean) => void;

  analysisHistory: AnalysisHistoryEntry[];

  clearAnalysisHistory: () => void;

}



export const AnalysisContext =
  createContext<AnalysisContextValue | undefined>(
    undefined
  );




export function AnalysisProvider({
  children,
}: {
  children: React.ReactNode;
}) {


  const [profile,setProfile] =
    useState<AnalysisResult | null>(null);



  const [result,setResult] =
    useState<AnalysisResult | null>(null);



  const [isAnalyzing,setIsAnalyzing] =
    useState(false);

  const [hasHistoryConsent,setHasHistoryConsent] =
    useState<boolean>(() => getHistoryConsent());

  const [analysisHistory,setAnalysisHistory] =
    useState<AnalysisHistoryEntry[]>(() => getAnalysisHistory());




  useEffect(() => {

    if (!hasHistoryConsent || !result) {
      return;
    }

    const nextHistory = appendAnalysisHistory(result);
    setAnalysisHistory(nextHistory);

  }, [hasHistoryConsent, result]);



  const analyze = async (
    data:string
  ) => {


    setIsAnalyzing(true);


    try {


      const ruleResult =
        buildRuleBasedAnalysis(data);



      let finalResult =
        ruleResult;




      try {


        const aiResult =
          await tryEnhanceWithOllama(
            ruleResult
          );



        if(aiResult){


          finalResult = {

            ...ruleResult,

            aiNarration:
              aiResult

          };


        }



      } catch(error){


        console.log(
          "Ollama unavailable",
          error
        );


      }




      setProfile(
        finalResult
      );


      setResult(
        finalResult
      );



    }
    finally {


      setIsAnalyzing(false);


    }


  };





  const reset = () => {


    setProfile(null);

    setResult(null);


  };



  const setHistoryConsent = (enabled:boolean) => {

    setHasHistoryConsent(enabled);
    persistHistoryConsent(enabled);

    if (enabled && result) {

      setAnalysisHistory(appendAnalysisHistory(result));

    }

  };



  const clearAnalysisHistory = () => {

    clearStoredHistory();
    setAnalysisHistory([]);

  };



  return (

    <AnalysisContext.Provider

      value={{

        profile,

        setProfile,

        result,

        analyze,

        reset,

        isAnalyzing,

        hasHistoryConsent,

        setHistoryConsent,

        analysisHistory,

        clearAnalysisHistory,

      }}

    >

      {children}

    </AnalysisContext.Provider>

  );


}





export function useAnalysisContext(){

  const ctx =
    useContext(
      AnalysisContext
    );


  if(!ctx){

    throw new Error(
      "useAnalysisContext must be inside AnalysisProvider"
    );

  }


  return ctx;

}
