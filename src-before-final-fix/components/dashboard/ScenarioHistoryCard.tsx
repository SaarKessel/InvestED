import { useNavigate } from "react-router-dom";


interface Props{

 scenarios: Record<string, unknown>[];

 onDelete?:(id:string)=>void;

}



export function ScenarioHistoryCard({

scenarios,

onDelete

}:Props){


const navigate = useNavigate();



return (

<div className="rounded-2xl bg-white p-6 shadow">


<h2 className="mb-5 text-xl font-bold">

📂 Investment History

</h2>



{

scenarios.length === 0 ?


<p className="text-gray-500">

אין עדיין תרחישים שמורים

</p>



:


<div className="space-y-4">


{

scenarios.map((scenario)=>(


<div

key={scenario.id}

className="rounded-xl border p-4"

>


<p className="font-bold">

תרחיש השקעה

</p>



<p>

השקעה:

₪{

(

scenario.data?.scenario?.initialInvestment

??

scenario.data?.initial_investment

??

0

).toLocaleString()

}

</p>



<p>

נוצר:

{

new Date(

scenario.createdAt

).toLocaleDateString()

}

</p>




<div className="mt-4 flex gap-3">


<button

onClick={()=>navigate(`/scenarios/${scenario.id}`)}

className="rounded-lg bg-blue-600 px-4 py-2 text-white"

>

פתיחה

</button>



{

onDelete &&

<button

onClick={()=>onDelete(scenario.id)}

className="rounded-lg border px-4 py-2 text-red-600"

>

מחיקה

</button>

}


</div>


</div>


))


}


</div>

}


</div>

);

}
