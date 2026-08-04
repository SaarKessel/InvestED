import React, {
  createContext,
  useContext,
  useState
} from "react";

import {
  buildRuleBasedAnalysis,
  tryEnhanceWithOllama,
} from "@/lib/analysisService";


export interface AnalysisContextValue {

  profile: any;

  setProfile: (value: any) => void;

  result: any;

  analyze: (data: string) => Promise<void>;

  reset: () => void;

  isAnalyzing: boolean;

}


export const AnalysisContext =
  createContext<AnalysisContextValue | undefined>(undefined);



export function AnalysisProvider({
  children,
}: {
  children: React.ReactNode;
}) {


  const [profile, setProfile] =
    useState<any>(null);


  const [result, setResult] =
    useState<any>(null);


  const [isAnalyzing, setIsAnalyzing] =
    useState(false);



  const analyze = async (data: string) => {


    setIsAnalyzing(true);


    try {


      console.log(
        "Starting analysis..."
      );


      const ruleResult =
        buildRuleBasedAnalysis(data);



      let finalResult =
        ruleResult;



      try {


        const aiResult =
          await tryEnhanceWithOllama(
            ruleResult
          );



        if (aiResult) {


          finalResult = {

            ...ruleResult,

            aiNarration:
              aiResult,

          };


        }


      } catch(error) {


        console.log(
          "Ollama unavailable, using rules",
          error
        );


      }




      const completedResult = {

        ...finalResult,

        createdAt:
          new Date().toISOString(),

      };




      console.log(
        "Analysis finished:",
        completedResult
      );



      setProfile(
        completedResult
      );


      setResult(
        completedResult
      );



    } finally {


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





export function useAnalysisContext() {


  const ctx =
    useContext(AnalysisContext);



  if (!ctx) {


    throw new Error(
      "useAnalysisContext must be inside AnalysisProvider"
    );


  }



  return ctx;


}
