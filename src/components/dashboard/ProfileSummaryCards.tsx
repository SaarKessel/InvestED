import { motion } from "framer-motion";

import {
  Target,
  Clock,
  Sparkles,
  ShieldCheck,
  TrendingUp,
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
} from "@/components/ui/primitives";



// =====================================================
// Helpers
// =====================================================


const fadeUp = {

  hidden:{
    opacity:0,
    y:16,
  },

  show:{
    opacity:1,
    y:0,
  },

};



const cardStyle =
`
h-full
border-border
transition-all
duration-300
hover:-translate-y-1
hover:shadow-lg
`;




const INTEREST_ICONS:Record<InterestArea,string> = {

  "טכנולוגיה":"💻",
  "פיננסים":"💰",
  "בריאות":"🩺",
  "אנרגיה":"⚡",
  "נדל\"ן":"🏢",

};





function getHorizonLabel(
  horizon:AnalysisResult["horizon"]
){

switch(horizon){

case "short":
return "קצר";

case "medium":
return "בינוני";

case "long":
return "ארוך";

default:
return "לא הוגדר";

}

}



// =====================================================
// Welcome
// =====================================================


export function WelcomeCard({
result
}:{
result:AnalysisResult
}){


return (

<motion.div
variants={fadeUp}
initial="hidden"
animate="show"
>


<Card className="overflow-hidden border-primary/20">


<div className="
bg-gradient-to-br
from-primary/20
to-transparent
p-6
">


<div className="
flex
items-center
gap-2
text-primary
font-bold
">

<Sparkles className="h-4 w-4"/>

AI Investor Profile

</div>



<h2 className="
mt-4
text-2xl
font-extrabold
">

הפרופיל הפיננסי שלך מוכן 🚀

</h2>



<p className="
mt-3
text-sm
leading-7
text-muted-foreground
">

InvestED ניתח את הנתונים שלך ויצר תמונת מצב פיננסית אישית.

</p>


</div>




<CardContent className="space-y-4 pt-6">


<p className="
rounded-xl
bg-muted
p-4
text-sm
italic
">

"{result.profileText}"

</p>


{result.aiNarration?.profileSummary &&

<div className="
rounded-xl
border
p-4
text-sm
leading-7
">

🤖 {result.aiNarration.profileSummary}

</div>

}


</CardContent>


</Card>


</motion.div>

);

}





// =====================================================
// Investor Type
// =====================================================


export function InvestorTypeCard({
result
}:{
result:AnalysisResult
}){


return (

<Card className={cardStyle}>


<CardHeader>

<div className="
flex
items-center
gap-2
text-primary
">

<Target className="h-5 w-5"/>

סוג משקיע

</div>


<CardTitle className="mt-2 text-2xl">

{result.investor.type}

</CardTitle>


</CardHeader>



<CardContent>


<p className="
rounded-xl
bg-muted
p-4
text-sm
leading-7
">

{result.investor.reason}

</p>


</CardContent>


</Card>

);

}







// =====================================================
// Risk
// =====================================================


export function RiskScoreCard({
result
}:{
result:AnalysisResult
}){


return (

<Card className={cardStyle}>


<CardHeader>


<div className="
flex
items-center
gap-2
text-primary
">

<ShieldCheck className="h-5 w-5"/>

רמת סיכון

</div>


<CardTitle className="mt-2 text-3xl">

{result.riskScore}/10

</CardTitle>


</CardHeader>




<CardContent>


<div className="
flex
items-center
gap-2
rounded-xl
bg-muted
p-4
">


<TrendingUp className="h-5 w-5"/>


<p className="text-sm">

{result.riskDescription?.volatility ??
"ניתוח סיכון זמין"}

</p>


</div>


</CardContent>


</Card>

);

}







// =====================================================
// Horizon
// =====================================================


export function HorizonCard({
result
}:{
result:AnalysisResult
}){


return (

<Card className={cardStyle}>


<CardHeader>


<div className="
flex
items-center
gap-2
text-primary
">

<Clock className="h-5 w-5"/>

אופק השקעה

</div>


<CardTitle className="mt-2 text-2xl">

{getHorizonLabel(result.horizon)}

</CardTitle>


</CardHeader>



<CardContent>


<p className="
rounded-xl
bg-muted
p-4
text-sm
leading-7
">

{result.horizonExplanation ??
"לא נמצא מידע"}

</p>


</CardContent>


</Card>

);

}







// =====================================================
// Interests
// =====================================================


export function InterestsCard({
result
}:{
result:AnalysisResult
}){


const areas =
result.flags.interests ?? [];



return (

<Card className={cardStyle}>


<CardHeader>


<CardTitle>

תחומי עניין

</CardTitle>


</CardHeader>



<CardContent>


<div className="
flex
flex-wrap
gap-3
">


{

areas.length ?

areas.map(area=>(

<div

key={area}

className="
rounded-xl
border
bg-muted
px-4
py-2
text-sm
"

>

{INTEREST_ICONS[area] ?? "📊"} {area}

</div>


))


:

<p className="text-sm text-muted-foreground">

לא זוהו תחומי עניין

</p>


}


</div>


</CardContent>


</Card>

);

}







// =====================================================
// Additional Cards
// =====================================================


export function ConfidenceCard({
result
}:{
result:AnalysisResult
}){


return (

<Card className={cardStyle}>

<CardHeader>

<CardTitle>

Confidence AI

</CardTitle>

</CardHeader>


<CardContent>

<p className="text-3xl font-bold">

{result.scenario?.confidence ?? 0}%

</p>


</CardContent>


</Card>

);

}