import React, {
  createContext,
  useRef,
  useState
} from "react";

import type {
  AnalysisResult
} from "@/types";

import { createConversationSession, type ConversationSession, type TurnResolution } from "@/lib/conversationContext";
import { processAIMessage } from "@/lib/aiConversationService";

import { useLanguage } from "@/context/languageContext";


export interface AnalysisContextValue {

  profile: AnalysisResult | null;

  setProfile: (
    value: AnalysisResult | null
  ) => void;

  result: AnalysisResult | null;

  analyze: (
    data: string
  ) => Promise<boolean>;

  reset: () => void;

  clarification: string | null;

  lastResolution: TurnResolution | null;

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


  const { language } = useLanguage();

  const [profile,setProfile] =
    useState<AnalysisResult | null>(null);



  const [result,setResult] =
    useState<AnalysisResult | null>(null);



  const [isAnalyzing,setIsAnalyzing] = useState(false);
  const [clarification,setClarification] = useState<string | null>(null);
  const [lastResolution,setLastResolution] = useState<TurnResolution | null>(null);
  const sessionRef = useRef<ConversationSession | null>(null);
  if (!sessionRef.current) sessionRef.current = createConversationSession();

  const analyze = async (data:string) => {
    setIsAnalyzing(true);
    try {
      const turn = await processAIMessage(sessionRef.current!, data, language);
      setLastResolution(turn.resolution);
      setClarification(turn.clarification);
      if (turn.result) {
        setProfile(turn.result);
        setResult(turn.result);
      }
      return turn.result !== null;
    } finally {
      setIsAnalyzing(false);
    }
  };



  const reset = () => {


    setProfile(null);

    setResult(null);
    setClarification(null);
    setLastResolution(null);
    sessionRef.current?.reset();


  };





  return (

    <AnalysisContext.Provider

      value={{

        profile,

        setProfile,

        result,

        analyze,

        reset,

        clarification,

        lastResolution,

        isAnalyzing,

      }}

    >

      {children}

    </AnalysisContext.Provider>

  );


}





