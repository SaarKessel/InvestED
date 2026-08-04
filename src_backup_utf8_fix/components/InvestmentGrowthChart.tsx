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

<div className="w-full h-[350px]">

<ResponsiveContainer width="100%" height="100%">

<LineChart data={data}>


<CartesianGrid strokeDasharray="3 3" />


<XAxis
dataKey="year"
/>


<YAxis

tickFormatter={(value)=>
`${Math.round(Number(value)/1000)}K`
}

/>


<Tooltip

formatter={(value)=>
[
`${Number(value).toLocaleString("he-IL")} ג‚×`,
"׳©׳•׳•׳™ ׳×׳™׳§"
]
}

/>


<Line

type="monotone"

dataKey="balance"

strokeWidth={3}

dot={false}

/>


</LineChart>


</ResponsiveContainer>


</div>

);


}
