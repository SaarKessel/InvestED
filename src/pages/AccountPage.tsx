import { useAuth } from "../hooks/useAuth";
import { useScenarioHistory } from "../hooks/useScenarioHistory";
import { useNavigate } from "react-router-dom";


export function AccountPage(){


const { user } = useAuth();

const { scenarios } = useScenarioHistory();

const navigate = useNavigate();



const totalInvested = scenarios.reduce(

(sum,item)=>{

return (

sum +

(

item.data?.scenario?.initialInvestment

??

item.data?.initial_investment

??

0

)

);

},

0

);



return (

<div className="min-h-screen bg-slate-950 text-white p-6">


<div className="mx-auto max-w-5xl space-y-8">


<h1 className="text-4xl font-bold">

👤 My Account

</h1>



<div className="grid gap-5 md:grid-cols-3">


<div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">

<p className="text-slate-400">

Email

</p>


<h2 className="mt-2 font-bold">

{user?.email ?? "Guest"}

</h2>

</div>



<div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">

<p className="text-slate-400">

Saved Scenarios

</p>


<h2 className="mt-2 text-3xl font-bold">

{scenarios.length}

</h2>

</div>




<div className="rounded-2xl bg-slate-900 p-6 border border-slate-800">

<p className="text-slate-400">

Total Planned Investment

</p>


<h2 className="mt-2 text-3xl font-bold">

₪{totalInvested.toLocaleString()}

</h2>

</div>



</div>





<div className="flex gap-4">


<button

onClick={()=>navigate("/dashboard")}

className="rounded-xl bg-blue-600 px-6 py-3"

>

Dashboard

</button>



<button

onClick={()=>navigate("/scenarios")}

className="rounded-xl border px-6 py-3"

>

My Scenarios

</button>



</div>



</div>

</div>

);

}
