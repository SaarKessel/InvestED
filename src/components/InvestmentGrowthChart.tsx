// ---------------------------------------------------------------------------
// InvestED — Investment Growth Chart
// Portfolio Growth Visualization
// ---------------------------------------------------------------------------

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";



interface ProjectionPoint {

  year:number;

  balance:number;

  contributed:number;

}



interface Props {

  data:ProjectionPoint[];

}



export function InvestmentGrowthChart({

  data

}:Props){


return (

<div
className="
mt-8
rounded-3xl
border
border-border
bg-card
p-6
shadow-soft
"
>


<h2
className="
text-2xl
font-bold
mb-2
"
>

📈 צמיחת ההשקעה לאורך זמן

</h2>



<p
className="
text-sm
text-slate-400
mb-6
"
>

השוואה בין הכסף שהופקד לבין הצמיחה שנוצרה מהשקעה לאורך השנים.

</p>



<div
className="
h-[350px]
"
>


<ResponsiveContainer
width="100%"
height="100%"
>


<LineChart
data={data}
>


<CartesianGrid
strokeDasharray="3 3"
/>



<XAxis

dataKey="year"

/>



<YAxis

tickFormatter={(value)=>

`₪${Math.round(
Number(value)/1000
)}K`

}

/>



<Tooltip

formatter={(value:any, name:any)=>

[

`₪${Number(value).toLocaleString("he-IL")}`,

name

]

}

/>




<Line

type="monotone"

dataKey="balance"

name="שווי תיק"

strokeWidth={3}

dot={false}

/>




<Line

type="monotone"

dataKey="contributed"

name="סה״כ הפקדות"

strokeWidth={2}

dot={false}

/>



</LineChart>


</ResponsiveContainer>


</div>


</div>


);


}