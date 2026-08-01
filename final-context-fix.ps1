Write-Host "Fixing missing context files..." -ForegroundColor Cyan


# -------------------------------
# AnalysisContext.tsx
# -------------------------------

$analysis = ".\src\context\AnalysisContext.tsx"

@'
import { createContext, useContext } from "react";

export interface AnalysisContextValue {
  profile: any;
  setProfile: (value: any) => void;
  analysis: any;
  setAnalysis: (value: any) => void;
}

export const AnalysisContext = createContext<AnalysisContextValue | undefined>(
  undefined
);

export function useAnalysisContext() {
  const ctx = useContext(AnalysisContext);

  if (!ctx) {
    throw new Error(
      "useAnalysisContext must be used inside AnalysisProvider"
    );
  }

  return ctx;
}

export function AnalysisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AnalysisContext.Provider
      value={{
        profile: null,
        setProfile: () => {},
        analysis: null,
        setAnalysis: () => {},
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}
'@ | Set-Content $analysis -Encoding UTF8



# -------------------------------
# themeContext.ts
# -------------------------------

$theme = ".\src\context\themeContext.ts"

@'
import { createContext } from "react";

export type Theme =
  | "light"
  | "dark";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext =
  createContext<ThemeContextValue>({
    theme: "light",
    setTheme: () => {},
  });


export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        setTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
'@ | Set-Content $theme -Encoding UTF8



# -------------------------------
# useAnalysis.ts
# -------------------------------

$useAnalysis = ".\src\context\useAnalysis.ts"

@'
import { useContext } from "react";
import { AnalysisContext } from "./AnalysisContext";

export function useAnalysis() {

  const context = useContext(AnalysisContext);

  if (!context) {
    throw new Error(
      "useAnalysis must be used inside AnalysisProvider"
    );
  }

  return context;
}
'@ | Set-Content $useAnalysis -Encoding UTF8



# -------------------------------
# Fix ScenarioHistoryCard
# -------------------------------

$file = ".\src\components\dashboard\ScenarioHistoryCard.tsx"

if(Test-Path $file){

$content = Get-Content $file -Raw -Encoding UTF8


$content = $content -replace `
"key=\{scenario.id\}",
"key={String(scenario.id)}"


$content = $content -replace `
"onDelete\(scenario.id\)",
"onDelete(String(scenario.id))"


Set-Content $file $content -Encoding UTF8

}


# remove TS cache

if(Test-Path ".\tsconfig.tsbuildinfo"){
Remove-Item ".\tsconfig.tsbuildinfo" -Force
}


Write-Host "DONE. Run npm run build" -ForegroundColor Green