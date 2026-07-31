import { motion } from "framer-motion";

import {
  Target,
  Clock,
  Sparkles,
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


function getHorizonLabel(horizon:string){

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


export function WelcomeCard({result}:{result:AnalysisResult}){

return (

<motion.div
variants={fadeUp}
initial="hidden"
animate="show"
>

<Card className="overflow-hidden border-[#1E3A5F]">

<div className="bg-gradient-to-br from-[#0D1B2A] to-[#102A43] p-6 text-white">

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


<CardContent className="pt-5">

<p className="text-sm italic leading-7 text-muted-foreground">
"{result.profileText}"
</p>

{result.aiNarration?.profileSummary &&

<p className="mt-4 rounded-xl bg-muted p-4 text-sm leading-7">
🤖 {result.aiNarration.profileSummary}
</p>

}

</CardContent>

</Card>

</motion.div>

);

}


export function InvestorTypeCard({result}:{result:AnalysisResult}){

return (

<Card className="h-full border-[#1E3A5F]">

<CardHeader>

<div className="flex items-center gap-2 text-primary">

<Target className="h-4 w-4"/>

<span className="text-xs font-bold">
סוג המשקיע
</span>

</div>

<CardTitle className="text-2xl">
{result.investor.type}
</CardTitle>

</CardHeader>

<CardContent>

<p className="text-sm leading-7 text-muted-foreground">
{result.investor.reason}
</p>

</CardContent>

</Card>

);

}


export function RiskScoreCard({result}:{result:AnalysisResult}){

return (

<Card className="h-full border-[#1E3A5F]">

<CardHeader>

<div className="flex items-center gap-2 text-primary">

<ShieldCheck className="h-4 w-4"/>

<span className="text-xs font-bold">
רמת סיכון
</span>

</div>

<CardTitle className="text-2xl">
{result.riskScore}/10
</CardTitle>

</CardHeader>

<CardContent>

<p className="text-sm leading-7 text-muted-foreground">
{result.riskDescription?.volatility}
</p>

</CardContent>

</Card>

);

}


export function HorizonCard({result}:{result:AnalysisResult}){

return (

<Card className="h-full border-[#1E3A5F]">

<CardHeader>

<div className="flex items-center gap-2 text-primary">

<Clock className="h-4 w-4"/>

<span className="text-xs font-bold">
אופק השקעה
</span>

</div>

<CardTitle className="text-2xl">
{getHorizonLabel(result.horizon)}
</CardTitle>

</CardHeader>


<CardContent>

<p className="text-sm leading-7 text-muted-foreground">
{result.horizonExplanation}
</p>

</CardContent>

</Card>

);

}


export function InterestsCard({result}:{result:AnalysisResult}){

const areas:InterestArea[] = result.flags.interests ?? [];

return (

<Card className="border-[#1E3A5F]">

<CardHeader>

<CardTitle>
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
className="rounded-xl bg-muted px-4 py-2 text-sm"
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
