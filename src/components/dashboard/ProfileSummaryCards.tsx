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



const INTEREST_ICONS: Record<InterestArea,string> = {

  "טכנולוגיה":"💻",
  "פיננסים":"💰",
  "בריאות":"🩺",
  "אנרגיה":"⚡",
  "נדל\"ן":"🏢",

};



function getHorizonLabel(
  horizon: AnalysisResult["horizon"]
): string {

  switch (horizon) {

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



const cardStyle =
  "h-full border-border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg";






export function WelcomeCard({
  result
}:{
  result: AnalysisResult
}){


return (

<motion.div
variants={fadeUp}
initial="hidden"
animate="show"
>


<Card className="overflow-hidden border-[#1E3A5F] shadow-md">


<div className="bg-gradient-to-br from-[#0D1B2A] via-[#102A43] to-[#1E3A5F] p-6 text-white">


<div className="inline-flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300">

<Sparkles className="h-3.5 w-3.5"/>

AI Investor Profile

</div>



<h2 className="mt-4 text-2xl font-extrabold">

הפרופיל הפיננסי שלך מוכן 🚀

</h2>



<p className="mt-3 max-w-xl text-sm leading-7 text-slate-200">

InvestED ניתח את הנתונים שלך ובנה תמונת מצב אישית:
סגנון השקעה, רמת סיכון, אופק השקעה ותובנות פעולה.

</p>


</div>




<CardContent className="space-y-4 pt-6">


<p className="rounded-xl bg-muted p-4 text-sm italic leading-7">

"{result.profileText}"

</p>



{result.aiNarration?.profileSummary &&

<div className="rounded-xl border bg-gradient-to-r from-blue-50 to-white p-4 text-sm leading-7">

🤖 {result.aiNarration.profileSummary}

</div>

}


</CardContent>


</Card>


</motion.div>

);

}









export function InvestorTypeCard({
result
}:{
result:AnalysisResult
}){


return (

<Card className={cardStyle}>


<CardHeader>


<div className="flex items-center gap-2 text-primary">

<Target className="h-5 w-5"/>

<span className="text-xs font-bold">

סוג המשקיע

</span>

</div>



<CardTitle className="mt-2 text-2xl font-extrabold">

{result.investor.type}

</CardTitle>


</CardHeader>



<CardContent>


<div className="rounded-xl bg-blue-50 p-4">

<p className="text-sm leading-7 text-muted-foreground">

{result.investor.reason}

</p>

</div>


</CardContent>


</Card>

);

}









export function RiskScoreCard({
result
}:{
result:AnalysisResult
}){


return (

<Card className={cardStyle}>


<CardHeader>


<div className="flex items-center gap-2 text-primary">

<ShieldCheck className="h-5 w-5"/>

<span className="text-xs font-bold">

רמת סיכון

</span>

</div>



<CardTitle className="mt-2 text-3xl font-extrabold">

{result.riskScore}/10

</CardTitle>


</CardHeader>



<CardContent>


<div className="flex items-center gap-2 rounded-xl bg-amber-50 p-4">


<TrendingUp className="h-5 w-5 text-amber-600"/>


<p className="text-sm leading-7 text-muted-foreground">

{result.riskDescription?.volatility}

</p>


</div>


</CardContent>


</Card>

);

}









export function HorizonCard({
result
}:{
result:AnalysisResult
}){


return (

<Card className={cardStyle}>


<CardHeader>


<div className="flex items-center gap-2 text-primary">

<Clock className="h-5 w-5"/>

<span className="text-xs font-bold">

אופק השקעה

</span>

</div>



<CardTitle className="mt-2 text-2xl font-extrabold">

{getHorizonLabel(result.horizon)}

</CardTitle>


</CardHeader>



<CardContent>


<p className="rounded-xl bg-muted p-4 text-sm leading-7 text-muted-foreground">

{result.horizonExplanation ?? "לא קיימת הסברית זמינה."}

</p>


</CardContent>


</Card>

);

}









export function InterestsCard({
result
}:{
result:AnalysisResult
}){


const areas:InterestArea[] =
result.flags.interests ?? [];



return (

<Card className={cardStyle}>


<CardHeader>

<CardTitle className="text-xl">

תחומי עניין

</CardTitle>

</CardHeader>



<CardContent>


<div className="flex flex-wrap gap-3">


{

areas.length ?

areas.map(area=>(


<div

key={area}

className="rounded-xl border bg-muted/50 px-4 py-2 text-sm font-medium transition hover:bg-muted"

>

{INTEREST_ICONS[area]} {area}

</div>


))


:

<p className="text-sm text-muted-foreground">

לא זוהו תחומי עניין עדיין.

</p>


}


</div>


</CardContent>


</Card>

);

}