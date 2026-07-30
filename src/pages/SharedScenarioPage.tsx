import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

import { getScenarioById } from "../lib/database";


export function SharedScenarioPage(){


const { id } = useParams();


const [scenario,setScenario]=useState<any>(null);



useEffect(()=>{


if(id){

getScenarioById(id)

.then(setScenario)

}


},[id]);





if(!scenario){


return (

<div className="p-8 text-center">

Loading scenario...

</div>

);

}





return (

<div className="min-h-screen bg-slate-950 text-white p-6">


<div className="mx-auto max-w-4xl space-y-6">


<h1 className="text-4xl font-bold">

🚀 Shared InvestED Scenario

</h1>



<div className="rounded-2xl bg-slate-900 p-6">


<p className="text-slate-400">

Initial Investment

</p>


<h2 className="text-3xl font-bold">

₪{scenario.initial_investment?.toLocaleString()}

</h2>


</div>




<div className="rounded-2xl bg-slate-900 p-6">


<p className="text-slate-400">

Future Value

</p>


<h2 className="text-3xl font-bold text-green-400">

₪{scenario.future_value?.toLocaleString()}

</h2>


</div>





<div className="rounded-2xl bg-slate-900 p-6">


<h2 className="text-xl font-bold">

Investor Profile

</h2>


<p>

Type: {scenario.investor_type}

</p>


<p>

Horizon: {scenario.horizon}

</p>


</div>



</div>


</div>

);


}
