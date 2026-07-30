import { useNavigate } from "react-router-dom";

import { useScenarioHistory } from "../hooks/useScenarioHistory";


export function ScenariosPage(){


const {

scenarios,

deleteScenario

}=useScenarioHistory();



const navigate = useNavigate();



return (

<div className="space-y-8 p-6">


<div>


<h1 className="text-4xl font-bold">

My Investment Scenarios 🚀

</h1>


<p className="text-gray-500 mt-2">

Saved investment analyses and projections

</p>


</div>





{

scenarios.length === 0 ?


<div className="rounded-2xl bg-white p-8 shadow">


<h2 className="text-xl font-bold">

No saved scenarios yet

</h2>


<button

onClick={()=>navigate("/start")}

className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-white"

>

Create Scenario

</button>


</div>


:



<div className="grid gap-5 md:grid-cols-2">


{

scenarios.map((scenario)=>(


<div

key={scenario.id}

className="rounded-2xl bg-white p-6 shadow"

>


<h2 className="text-xl font-bold">

Investment Scenario

</h2>



<p className="mt-2 text-sm text-gray-500">

{new Date(
scenario.createdAt
).toLocaleDateString()}

</p>



<div className="mt-5 space-y-2">


<p>

Initial:

₪{scenario.data.initial_investment?.toLocaleString()
??

scenario.data.scenario?.initialInvestment?.toLocaleString()
}

</p>



<p>

Future Value:

₪{scenario.data.future_value?.toLocaleString()
??

scenario.data.projection?.finalBalance?.toLocaleString()
}

</p>



</div>




<button

onClick={()=>deleteScenario(scenario.id)}

className="mt-5 rounded-xl border px-4 py-2"

>

Delete

</button>



</div>


))

}


</div>


}


</div>

);


}
