import React, {
  createContext,
  useContext,
  useState
} from "react";

import type {
  AnalysisResult
} from "@/types";

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





  return (

    <AnalysisContext.Provider

      value={{

        profile,

        setProfile,

        result,

        analyze,

        reset,

        isAnalyzing,

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

