import { motion } from "framer-motion";

import {
  Target,
  Clock,
  Sparkles,
  Brain,
  ShieldCheck,
} from "lucide-react";

import type {
  AnalysisResult,
  InterestArea,
} from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from "@/components/ui/primitives";


const fadeUp = {
  hidden: {
    opacity: 0,
    y: 16,
  },

  show: {
    opacity: 1,
    y: 0,
  },
};



const INTEREST_ICONS: Record<string,string> = {

  "טכנולוגיה":"💻",

  "פיננסים":"💰",

  "בריאות":"🩺",

  "אנרגיה":"⚡",

  "נדל״ן":"🏢",

  "נדל\"ן":"🏢",

};



function getHorizonLabel(
  horizon:string
){

  switch(horizon){

    case "short":
      return "קצר";

    case "medium":
      return "בינוני";

    case "long":
      return "ארוך";

    default:
      return horizon;

  }

}





export function WelcomeCard(
{
 result
}:{
 result:AnalysisResult
}
){

return (

<motion.div
variants={fadeUp}
initial="hidden"
animate="show"
>

<Card className="overflow-hidden border-[#1E3A5F]">


<div
className="
bg-gradient-to-br
from-[#0D1B2A]
to-[#102A43]
p-6
text-white
"
>


<div
className="
inline-flex
items-center
gap-2
rounded-full
bg-emerald-400/20
px-3
py-1
text-xs
font-bold
text-emerald-300
"
>

<Sparkles className="h-3.5 w-3.5"/>

AI Investor Profile

</div>



<h2
className="
mt-4
text-2xl
font-extrabold
"
>

הפרופיל הפיננסי שלך מוכן 🚀

</h2>



<p
className="
mt-3
max-w-xl
text-sm
leading-7
text-slate-200
"
>

InvestED ניתח את הנתונים שלך ובנה תמונת מצב אישית:
סגנון השקעה, רמת סיכון, אופק השקעה ותובנות פעולה.

</p>


</div>



<CardContent className="pt-5">


<p
className="
text-sm
italic
leading-7
text-muted-foreground
"
>

"{result.profileText}"

</p>



{
result.aiNarration?.profileSummary &&

<p
className="
mt-4
rounded-xl
bg-muted
p-4
text-sm
leading-7
"
>

🤖

{result.aiNarration.profileSummary}

</p>

}



</CardContent>


</Card>

</motion.div>

);

}







export function InvestorTypeCard(
{
result
}:{
result:AnalysisResult
}
){

return (

<motion.div
variants={fadeUp}
initial="hidden"
animate="show"
>


<Card className="h-full border-[#1E3A5F]">


<CardHeader>


<div
className="
flex
items-center
gap-2
text-primary
"
>

<Target className="h-4 w-4"/>

<span
className="
text-xs
font-bold
"
>

סוג המשקיע

</span>

</div>



<CardTitle className="text-2xl">

{result.investor.type}

</CardTitle>


</CardHeader>


<CardContent>


<p
className="
text-sm
leading-7
text-muted-foreground
"
>

{result.investor.reason}

</p>


</CardContent>


</Card>


</motion.div>

);

}









export function RiskScoreCard(
{
result
}:{
result:AnalysisResult
}
){

const percentage =
Math.min(
100,
Math.max(
0,
result.riskScore * 10
)
);



return (

<motion.div
variants={fadeUp}
initial="hidden"
animate="show"
>


<Card className="h-full border-[#1E3A5F]">


<CardHeader>


<div
className="
flex
items-center
gap-2
text-primary
"
>

<ShieldCheck className="h-4 w-4"/>

<span className="text-xs font-bold">

רמת סיכון

</span>


</div>



<CardTitle className="text-2xl">

{result.riskScore}/10

·

{result.riskDescription.band}

</CardTitle>


</CardHeader>



<CardContent className="space-y-4">


<div
className="
h-3
overflow-hidden
rounded-full
bg-muted
"
>


<motion.div

initial={{
width:0
}}

animate={{
width:`${percentage}%`
}}

transition={{
duration:0.8
}}

className="
h-full
rounded-full
bg-gradient-to-r
from-emerald-400
to-blue-500
"

/>


</div>



<p className="text-sm leading-7 text-muted-foreground">

{result.riskDescription.volatility}

</p>



<p className="text-sm leading-7 text-muted-foreground">

{result.riskDescription.psychology}

</p>


</CardContent>


</Card>


</motion.div>

);

}









export function HorizonCard(
{
result
}:{
result:AnalysisResult
}
){


const current =
getHorizonLabel(
String(result.horizon)
);



const stages=[
"קצר",
"בינוני",
"ארוך"
];


return (

<motion.div
variants={fadeUp}
initial="hidden"
animate="show"
>


<Card className="h-full border-[#1E3A5F]">


<CardHeader>


<div
className="
flex
items-center
gap-2
text-primary
"
>

<Clock className="h-4 w-4"/>

<span className="text-xs font-bold">

אופק השקעה

</span>


</div>


<CardTitle className="text-2xl">

{current}

</CardTitle>


</CardHeader>



<CardContent className="space-y-4">


<div className="flex gap-2">


{
stages.map(stage=>(

<div

key={stage}

className={`
flex-1
rounded-full
py-2
text-center
text-xs
font-bold
${
stage===current
?
"bg-primary text-primary-foreground"
:
"bg-muted text-muted-foreground"
}
`}

>

{stage}

</div>


))

}


</div>



<p className="text-sm leading-7 text-muted-foreground">

{result.horizonExplanation}

</p>


</CardContent>


</Card>


</motion.div>

);

}









export function InterestsCard(
{
result
}:{
result:AnalysisResult
}
){


const areas:InterestArea[]=[

"טכנולוגיה",

"פיננסים",

"בריאות",

"אנרגיה",

"נדל\"ן"

];


return (

<motion.div
variants={fadeUp}
initial="hidden"
animate="show"
>


<Card className="h-full border-[#1E3A5F]">


<CardHeader>

<div className="flex items-center gap-2">

<Brain className="h-4 w-4 text-primary"/>

<CardTitle className="text-base">

תחומי עניין

</CardTitle>

</div>


</CardHeader>



<CardContent>


<div className="flex flex-wrap gap-2">


{
areas.map(area=>{


const active =
result.flags.interests.includes(area);


return (

<Badge

key={area}

variant={
active
?
"default"
:
"outline"
}

className={
active
?
""
:
"opacity-50"
}

>

{INTEREST_ICONS[area]}

&nbsp;

{area}

</Badge>


);


})

}


</div>



{
result.flags.interests.length===0 &&

<p className="
mt-3
text-xs
text-muted-foreground
">

לא זוהו תחומי עניין עדיין.

</p>

}


</CardContent>


</Card>


</motion.div>

);

}
