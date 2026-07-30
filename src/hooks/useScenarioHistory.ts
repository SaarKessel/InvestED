import { useEffect, useState } from "react";

import { useAuth } from "./useAuth";

import {
  saveScenarioToCloud,
  getUserScenarios,
  deleteScenarioFromCloud
} from "../lib/database";


const KEY = "invested_scenarios";



export interface SavedScenario {

  id:string;

  createdAt:string;

  data:any;

}





export function useScenarioHistory(){


const {

user

}=useAuth();



const [

scenarios,

setScenarios

]=useState<SavedScenario[]>([]);





useEffect(()=>{


loadScenarios();


},[user]);






async function loadScenarios(){



if(user){



const cloudScenarios =

await getUserScenarios(user.id);



setScenarios(

cloudScenarios.map((item:any)=>({


id:item.id,


createdAt:item.created_at,


data:item



}))

);



return;


}




const saved =

localStorage.getItem(KEY);



setScenarios(

saved

?

JSON.parse(saved)

:

[]

);



}







async function saveScenario(data:any){



if(user){



await saveScenarioToCloud({


user_id:user.id,


initial_investment:

data.scenario.initialInvestment,



future_value:

data.projection.finalBalance,



profit:

data.projection.finalBalance -

data.scenario.initialInvestment,



investor_type:

data.investor,



risk_score:

data.riskScore ?? 0,



horizon:

data.horizon,



allocation:

data.allocation,



projection:

data.projection



});



await loadScenarios();



return;


}






const newScenario:SavedScenario={


id:crypto.randomUUID(),


createdAt:new Date().toISOString(),


data


};




const updated=[

newScenario,

...scenarios

];



localStorage.setItem(

KEY,

JSON.stringify(updated)

);



setScenarios(updated);



}







async function deleteScenario(id:string){



if(user){


await deleteScenarioFromCloud(id);


await loadScenarios();


return;


}




const updated =

scenarios.filter(

item=>item.id!==id

);



localStorage.setItem(

KEY,

JSON.stringify(updated)

);



setScenarios(updated);


}






function clearScenarios(){



localStorage.removeItem(KEY);


setScenarios([]);


}




return {


scenarios,


saveScenario,


deleteScenario,


clearScenarios


};



}

