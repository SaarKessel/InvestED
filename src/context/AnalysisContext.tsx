import { useMemo, useState, type ReactNode } from "react";
import { AnalysisContext, type AnalysisContextValue } from "./analysisContext";
import type { AnalysisResult } from "@/types";
import {
  buildRuleBasedAnalysis,
  tryEnhanceWithOllama,
} from "@/lib/analysisService";


export function AnalysisProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const value = useMemo<AnalysisContextValue>(
    () => ({
      result,
      isAnalyzing,
      error,

      analyze: async (profileText: string) => {

        setError(null);
        setIsAnalyzing(true);

        try {

          const ruleBasedResult =
            buildRuleBasedAnalysis(profileText);

          setResult(ruleBasedResult);
          setIsAnalyzing(false);


          tryEnhanceWithOllama(ruleBasedResult)
            .then((enhancedNarration) => {

              if (enhancedNarration) {

                setResult((current) =>
                  current &&
                  current.profileText === profileText
                    ? {
                        ...current,
                        aiNarration: enhancedNarration,
                      }
                    : current
                );

              }

            })
            .catch(() => {});

        } catch (e) {

          setError(
            "משהו השתבש בניתוח הפרופיל. נסה שוב."
          );

          setIsAnalyzing(false);

          console.error(e);

        }

      },

      reset: () => setResult(null),

    }),
    [
      result,
      isAnalyzing,
      error,
    ]
  );


  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );

}