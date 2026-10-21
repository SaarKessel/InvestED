import { replyLanguageFor } from "@/lib/replyLanguage";
import React, {
  createContext,
  useRef,
  useState
} from "react";

import type {
  AnalysisResult
} from "@/types";

import { createConversationSession, type ConversationSession, type TurnResolution } from "@/lib/conversationContext";
import { processAIMessage, type AIConversationTurn } from "@/lib/aiConversationService";
import { rewordBudgetMs } from "@/lib/copilot/levels";
import { groundAnswer, isUnknownAnswer } from "@/lib/copilot/groundedAnswer";
import { acceptRephrase, getProvider } from "@/lib/ai/provider";
import type { GatewayTurn } from "@/lib/copilot/gatewayPrompt";
import { investorProfileFromResult } from "@/lib/aiConversationService";

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

  askCopilot: (data: string, botId?: string, context?: GatewayTurn[]) => Promise<AIConversationTurn>;
  /** Progressive rephrase text while the AI gateway streams; "" when idle. */
  streamingText: string;

  copilotTurn: AIConversationTurn | null;

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
  const [streamingText,setStreamingText] = useState("");
  const [clarification,setClarification] = useState<string | null>(null);
  const [lastResolution,setLastResolution] = useState<TurnResolution | null>(null);
  const [copilotTurn,setCopilotTurn] = useState<AIConversationTurn | null>(null);
  const sessionRef = useRef<ConversationSession | null>(null);
  if (!sessionRef.current) sessionRef.current = createConversationSession();

  const runTurn = async (data: string, updateDashboardResult: boolean, replyLanguage: "he" | "en" = language === "he" ? "he" : "en", botId?: string, context?: GatewayTurn[]) => {
    const turn = await processAIMessage(sessionRef.current!, data, replyLanguage);
    // Facelift phase 1: best-effort rephrase through the AI Gateway. The
    // deterministic answer is the fact source; any gateway failure keeps it.
    // Grounding: when the engines have no answer, answer from stored explanations with a source, or say it is not known.
    const found = turn.clarification ? null : groundAnswer(data, replyLanguage, turn.response.intent, turn.response.text);
    const grounded = found?.kind === "grounded" ? found : null;
    if (grounded) turn.response = { ...turn.response, text: grounded.text };
    if (!grounded && !isUnknownAnswer(turn.response.text) && !turn.clarification && turn.response.text) {
      const provider = getProvider(undefined);
      let rephrased: string | null = null;
      if (provider.rephraseStream) {
        // Stream mode: chunks surface progressively; the commit still waits
        // for the server verdict and passes the client-side number check,
        // now with the server-tool facts added as accepted sources.
        const contextSources = (context ?? []).flatMap((t) => [t.q, t.a]);
        const streamed = await provider.rephraseStream(data, replyLanguage, turn.response, {
          botId,
          timeoutMs: rewordBudgetMs() + 7_000,
          onChunk: (acc) => setStreamingText(acc),
          context,
        });
        setStreamingText("");
        if (streamed) rephrased = acceptRephrase(streamed.text, data, turn.response, [...streamed.acceptedFacts, ...contextSources]);
      } else {
        rephrased = acceptRephrase(await provider.rephrase(data, replyLanguage, turn.response, rewordBudgetMs()), data, turn.response);
      }
      if (rephrased) turn.response = { ...turn.response, text: rephrased };
    }
    setLastResolution(turn.resolution);
    setClarification(turn.clarification);
    setCopilotTurn(turn);
    if (updateDashboardResult && turn.result) setResult(turn.result);
    return turn;
  };

  const askCopilot = async (data: string, botId?: string, context?: GatewayTurn[]) => {
    setIsAnalyzing(true);
    try { return await runTurn(data, false, replyLanguageFor(data, language === "he" ? "he" : "en"), botId, context); } finally { setIsAnalyzing(false); setStreamingText(""); }
  };

  const analyze = async (data:string) => {
    setIsAnalyzing(true);
    try {
      const turn = await runTurn(data, true);
      if (turn.result) {
        // analyze() is the dedicated onboarding/profile-analysis entry point,
        // so its result is a genuine application profile source. Copilot turns
        // use askCopilot() and cannot silently overwrite it.
        setProfile(turn.result);
        sessionRef.current?.setInvestorProfile(investorProfileFromResult(turn.result));
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
    setCopilotTurn(null);
    sessionRef.current?.reset();


  };





  return (

    <AnalysisContext.Provider

      value={{

        profile,

        setProfile,

        result,

        analyze,

        askCopilot,

        copilotTurn,

        reset,

        clarification,

        lastResolution,

        isAnalyzing,

        streamingText,

      }}

    >

      {children}

    </AnalysisContext.Provider>

  );


}





