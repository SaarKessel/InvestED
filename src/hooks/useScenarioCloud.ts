import { useEffect, useState } from "react";

import { useAuth } from "./useAuth";

import {

saveScenarioToCloud,

getUserScenarios,

deleteScenarioFromCloud

} from "../lib/database";



export function useScenarioCloud(){


const {

user

}=useAuth();



const [scenarios,setScenarios]=useState<any[]>([]);

const [loading,setLoading]=useState(true);



useEffect(()=>{


if(!user){

setLoading(false);

return;

}



load();


},[user]);




async function load(){


if(!user)return;


const data = await getUserScenarios(

user.id

);


setScenarios(data);


setLoading(false);


}




async function saveScenario(

scenario:any

){


if(!user)return;



await saveScenarioToCloud({

user_id:user.id,

initial_investment:
scenario.scenario.initialInvestment,

future_value:
scenario.projection.finalBalance,

profit:
scenario.projection.finalBalance -
scenario.scenario.initialInvestment,

investor_type:
scenario.investor,

risk_score:
scenario.riskScore ?? 0,

horizon:
scenario.horizon,

allocation:
scenario.allocation,

projection:
scenario.projection

});



await load();


}




async function removeScenario(

id:string

){


await deleteScenarioFromCloud(id);


await load();


}




return {

scenarios,

loading,

saveScenario,

removeScenario

};


}

