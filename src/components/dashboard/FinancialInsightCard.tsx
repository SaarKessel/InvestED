import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

import type {
  FinancialInsightResult
} from "@/lib/financialInsightEngine";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge
} from "@/components/ui/primitives";



export function FinancialInsightCard({

  result

}:{

  result:FinancialInsightResult

}) {



return (

<motion.div

initial={{
  opacity:0,
  y:16
}}

animate={{
  opacity:1,
  y:0
}}

transition={{
  delay:0.2
}}

>


<Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">


<CardHeader>


<div className="flex items-center gap-2 text-primary">

<Lightbulb className="h-5 w-5"/>

<span className="text-xs font-bold uppercase tracking-wide">

Financial Insights

</span>

</div>



<CardTitle className="text-xl">

התובנות המרכזיות שלך

</CardTitle>



</CardHeader>




<CardContent className="space-y-5">



<p className="rounded-xl border bg-card p-4 text-sm leading-relaxed">

{result.headline}

</p>




<div className="space-y-3">


{
result.insights.map(

(insight,index)=>(


<div

key={`${insight.title}-${index}`}

className="rounded-xl border bg-background p-4"

>


<Badge

variant="outline"

>

{insight.type}

</Badge>



<h3 className="mt-2 font-semibold">

{insight.title}

</h3>



<p className="mt-1 text-sm text-muted-foreground">

{insight.description}

</p>



</div>


)

)

}



</div>


</CardContent>


</Card>


</motion.div>


);


}