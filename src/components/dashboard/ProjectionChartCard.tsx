import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { TrendingUp } from "lucide-react";

import type {
  ProjectionResult
} from "@/lib/calculatorEngine";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";



export function ProjectionChartCard({

  projection

}:{

  projection:ProjectionResult;

}) {



return (

<Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">


<CardHeader>


<div className="flex items-center gap-2 text-primary">

<TrendingUp className="h-5 w-5"/>


<span className="text-xs font-bold uppercase tracking-wide">

Growth Projection

</span>


</div>



<CardTitle className="text-xl">

תחזית צמיחת ההשקעה

</CardTitle>


</CardHeader>





<CardContent className="space-y-5">



<div className="h-[320px] w-full">


<ResponsiveContainer
width="100%"
height="100%"
>


<LineChart
data={projection.series}
>


<CartesianGrid
strokeDasharray="3 3"
/>



<XAxis

dataKey="year"

label={{
value:"שנים",
position:"insideBottom",
offset:-5
}}

/>



<YAxis

tickFormatter={(value)=>

`${Math.round(value/1000)}K`

}

/>



<Tooltip

formatter={(value:number)=>

[
`${value.toLocaleString()} ₪`,
"שווי תיק"
]

}

labelFormatter={(label)=>

`שנה ${label}`

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





<div className="grid grid-cols-1 gap-3 md:grid-cols-3">



<div className="rounded-xl border bg-background p-4">


<p className="text-xs text-muted-foreground">

סה"כ הפקדות

</p>


<p className="mt-1 text-lg font-bold">

{projection.totalContributed.toLocaleString()} ₪

</p>


</div>





<div className="rounded-xl border bg-background p-4">


<p className="text-xs text-muted-foreground">

צמיחה מהשקעה

</p>


<p className="mt-1 text-lg font-bold">

{projection.growth.toLocaleString()} ₪

</p>


</div>





<div className="rounded-xl border bg-background p-4">


<p className="text-xs text-muted-foreground">

ערך ריאלי לאחר אינפלציה

</p>


<p className="mt-1 text-lg font-bold">

{projection.realValueAfterInflation.toLocaleString()} ₪

</p>


</div>



</div>



</CardContent>


</Card>


);


}