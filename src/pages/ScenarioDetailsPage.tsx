import { useParams, useNavigate } from "react-router-dom";

import { useScenarioHistory } from "../hooks/useScenarioHistory";

import { InvestmentGrowthChart } from "../components/InvestmentGrowthChart";
import { PortfolioAllocationCard } from "../components/dashboard/PortfolioAllocationCard";


export function ScenarioDetailsPage(){


const { id } = useParams();

const navigate = useNavigate();


const {

scenarios

}=useScenarioHistory();



const scenario =

scenarios.find(

item => item.id === id

);



if(!scenario){

return (

<div className="p-8">


<h1 className="text-3xl font-bold">

Scenario not found

</h1>


<button

onClick={()=>navigate("/scenarios")}

className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-white"

>

Back

</button>


</div>

);

}



const data = scenario.data;



const initialInvestment =

data.scenario?.initialInvestment
??
data.initial_investment
??
0;



const futureValue =

data.projection?.finalBalance
??
data.future_value
??
0;



const profit =

futureValue - initialInvestment;



return (

<div className="space-y-8 p-6">


<button

onClick={()=>navigate("/scenarios")}

className="rounded-xl border px-4 py-2"

>

← Back to scenarios

</button>




<h1 className="text-4xl font-bold">

Investment Scenario Details 🚀

</h1>




<div className="grid gap-5 md:grid-cols-3">


<div className="rounded-2xl bg-white p-6 shadow">

<p className="text-gray-500">

Initial Investment

</p>

<h2 className="text-3xl font-bold">

₪{initialInvestment.toLocaleString()}

</h2>

</div>




<div className="rounded-2xl bg-white p-6 shadow">

<p className="text-gray-500">

Future Value

</p>

<h2 className="text-3xl font-bold text-green-600">

₪{futureValue.toLocaleString()}

</h2>

</div>




<div className="rounded-2xl bg-white p-6 shadow">

<p className="text-gray-500">

Profit

</p>

<h2 className="text-3xl font-bold">

₪{profit.toLocaleString()}

</h2>

</div>



</div>








<PortfolioAllocationCard

allocation={data.allocation}

/>





{

data.projection?.series &&

<div className="rounded-2xl bg-white p-6 shadow">

<h2 className="mb-5 text-xl font-bold">

Growth Projection 📈

</h2>


<InvestmentGrowthChart

data={data.projection.series}

/>

</div>

}



</div>

);

}
