import { useContext } from "react";
import {
  AnalysisContext,
  type AnalysisContextValue,
} from "./AnalysisContext";


export function useAnalysis(): AnalysisContextValue {

  const context = useContext(AnalysisContext);


  if (!context) {

    throw new Error(
      "useAnalysis must be used inside AnalysisProvider"
    );

  }


  return context;

}
