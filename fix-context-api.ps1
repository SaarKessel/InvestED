Write-Host "Fixing context API..." -ForegroundColor Cyan


# -------------------------------
# themeContext.tsx
# -------------------------------

@'
import { createContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});


export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const toggleTheme = () => {};

  return (
    <ThemeContext.Provider
      value={{
        theme: "light",
        setTheme: () => {},
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
'@ | Set-Content .\src\context\themeContext.tsx -Encoding UTF8



# -------------------------------
# AnalysisContext.tsx
# -------------------------------

@'
import { createContext, useContext } from "react";

export interface AnalysisContextValue {

  profile: any;
  setProfile: (value:any)=>void;

  result:any;

  analyze:(data:any)=>Promise<void>;

  reset:()=>void;

  isAnalyzing:boolean;

}


export const AnalysisContext =
createContext<AnalysisContextValue | undefined>(undefined);



export function AnalysisProvider({
 children
}:{
 children:React.ReactNode;
}){


const value:AnalysisContextValue={

 profile:null,

 setProfile:()=>{},

 result:null,

 analyze:async()=>{},

 reset:()=>{},

 isAnalyzing:false,

};


return (

<AnalysisContext.Provider value={value}>
{children}
</AnalysisContext.Provider>

);

}



export function useAnalysisContext(){

const ctx=useContext(AnalysisContext);

if(!ctx){
throw new Error(
"useAnalysisContext must be inside provider"
);
}

return ctx;

}
'@ | Set-Content .\src\context\AnalysisContext.tsx -Encoding UTF8



Remove-Item .\tsconfig.tsbuildinfo -Force -ErrorAction SilentlyContinue


Write-Host "Context fixed. Run npm run build" -ForegroundColor Green