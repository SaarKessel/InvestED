import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { AnalysisResult } from "@/types";
import { buildRuleBasedAnalysis, tryEnhanceWithOllama } from "@/lib/analysisService";

interface AnalysisContextValue {
  result: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  analyze: (profileText: string) => Promise<void>;
  reset: () => void;
}

const AnalysisContext = createContext<AnalysisContextValue | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
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
          // שלב 1: תוצאה מבוססת-כללים, מיידית — הדשבורד תמיד מוכן להצגה.
          const ruleBasedResult = buildRuleBasedAnalysis(profileText);
          setResult(ruleBasedResult);
          setIsAnalyzing(false);

          // שלב 2 (ברקע, לא חוסם): שדרוג ניסוח דרך Ollama מקומי אם קיים.
          tryEnhanceWithOllama(ruleBasedResult)
            .then((enhancedNarration) => {
              if (enhancedNarration) {
                setResult((current) =>
                  current && current.profileText === profileText
                    ? { ...current, aiNarration: enhancedNarration }
                    : current
                );
              }
            })
            .catch(() => {
              // שיפור ה-AI נכשל בשקט — הדשבורד כבר מוצג עם טקסט תקין.
            });
        } catch (e) {
          setError("משהו השתבש בניתוח הפרופיל. נסה שוב.");
          setIsAnalyzing(false);
          console.error(e);
        }
      },
      reset: () => setResult(null),
    }),
    [result, isAnalyzing, error]
  );

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within an AnalysisProvider");
  return ctx;
}
