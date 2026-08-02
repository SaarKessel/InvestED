import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";

import type {
  AnalysisResult
} from "@/types";


import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge
} from "@/components/ui/primitives";


import { InfoBadge } from "@/components/ui/InfoBadge";




export function ExplainableAiCard({
  result
}:{
  result:AnalysisResult
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
  delay:0.1
}}

>


<Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">


<CardHeader>


<div className="flex items-center gap-2 text-primary">

<BrainCircuit className="h-4 w-4"/>

<span className="text-xs font-bold uppercase tracking-wide">
Explainable AI
</span>

</div>




<div className="flex items-center gap-2">


<CardTitle className="text-xl">

למה הגענו למסקנה הזאת?

</CardTitle>


<InfoBadge

description='רכיב שמסביר אילו סימנים בטקסט השפיעו על ניתוח הפרופיל והסיכון.'

/>


</div>


</CardHeader>





<CardContent className="space-y-5">


<p className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">

{result.explainability.summary}

</p>





<div>


<p className="mb-2 text-xs font-bold text-muted-foreground">

אילו סימנים זוהו בטקסט:

</p>




<div className="flex flex-col gap-3">


{
result.explainability.signals.map(
(signal,index)=>(


<div
key={`${signal.title}-${index}`}
className="rounded-xl border bg-background p-3"
>


<Badge
variant="outline"
className="gap-1.5"
>

{signal.title}

</Badge>



<p className="mt-2 text-sm text-muted-foreground">

{signal.description}

</p>


</div>


))
}



</div>


</div>






<div className="flex items-center gap-2 text-xs text-muted-foreground">


<span className="h-1.5 w-1.5 rounded-full bg-primary"/>


מקור הניסוח:

{" "}


{
result.aiNarration.source === "ollama"

?

"מודל שפה מקומי (Ollama) בשילוב מנוע כללים"

:

"מנוע כללים חינוכי"

}



</div>




</CardContent>


</Card>



</motion.div>


);


}