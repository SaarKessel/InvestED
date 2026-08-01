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
