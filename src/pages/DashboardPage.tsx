import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  RotateCcw,
  BrainCircuit,
  Target,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  GraduationCap,
  Activity,
} from "lucide-react";


import {
  Layout,
  DisclaimerBanner,
} from "@/components/layout/Layout";


import {
  Button,
  Card,
  CardContent,
} from "@/components/ui/primitives";


import { useAnalysis } from "@/context/useAnalysis";


import {
  WelcomeCard,
  InvestorTypeCard,
  RiskScoreCard,
  HorizonCard,
  InterestsCard,
} from "@/components/dashboard/ProfileSummaryCards";


import { ExplainableAiCard } 
from "@/components/dashboard/ExplainableAiCard";


import { StrategiesCard }
from "@/components/dashboard/StrategiesCard";


import { PortfolioCard }
from "@/components/dashboard/PortfolioCard";


import { MarketDataCard }
from "@/components/dashboard/MarketDataCard";


import { ComparisonCard }
from "@/components/dashboard/ComparisonCard";


import {
  ConceptsCard,
  MistakesCard,
  RoadmapCard,
} from "@/components/dashboard/LearningCards";


import { QuizCard }
from "@/components/dashboard/QuizCard";


import { GoalPlannerCard }
from "@/components/GoalPlannerCard";




// =====================================================
// Helpers
// =====================================================


function goalLabel(
  goal:string|undefined
){

  switch(goal){

    case "retirement":
      return "פרישה ועצמאות כלכלית";

    case "home":
      return "רכישת דירה";

    case "child":
      return "חיסכון לילדים";

    case "growth":
      return "בניית הון";

    default:
      return "בניית עושר";

  }

}




function confidenceLabel(
  value:number|undefined
){

  if(!value)
    return "לא מחושב";


  if(value >= 80)
    return "גבוה";


  if(value >= 50)
    return "בינוני";


  return "נמוך";

}




// =====================================================
// Dashboard Page
// =====================================================


export function DashboardPage(){


const {
  result,
  reset
}=useAnalysis();



const navigate =
  useNavigate();




useEffect(()=>{


if(!result){

  navigate("/start",{
    replace:true
  });

}


},[
result,
navigate
]);





if(!result)
return null;




return (

<Layout>


<section
className="
container
max-w-6xl
py-10
md:py-14
"
>



<div
className="
mb-10
flex
flex-col
gap-5
md:flex-row
md:items-center
md:justify-between
"
>



<div>


<div
className="
mb-3
flex
items-center
gap-2
text-primary
"
>


<Activity
className="h-5 w-5"
/>


<span
className="
text-xs
font-bold
uppercase
tracking-wide
"
>

InvestED Intelligence Dashboard

</span>


</div>




<h1
className="
font-display
text-4xl
font-extrabold
"
>

🚀 פרופיל המשקיע שלך מוכן

</h1>



<p
className="
mt-3
max-w-xl
text-sm
leading-relaxed
text-muted-foreground
"
>

מערכת InvestED שילבה ניתוח סיכון,
מטרות פיננסיות,
והסברים מבוססי AI כדי ליצור תמונת מצב לימודית.

</p>


</div>





<Button

variant="outline"

size="sm"

className="gap-2"

onClick={()=>{

reset();

navigate("/start");

}}

>


<RotateCcw
className="h-4 w-4"
/>


נתח מחדש


</Button>




</div>





<DisclaimerBanner
className="mb-8"
/>

{/* =====================================================
AI PROFILE INTELLIGENCE SUMMARY
===================================================== */}


<Card

className="
mb-8
overflow-hidden
border-primary/20
bg-gradient-to-br
from-primary/10
via-background
to-transparent
"

>


<CardContent

className="
p-6
"

>


<div

className="
mb-6
flex
items-center
gap-3
"

>


<div

className="
rounded-2xl
bg-primary/10
p-3
"

>


<BrainCircuit

className="
h-7
w-7
text-primary
"

/>


</div>




<div>


<h2

className="
text-xl
font-bold
"

>

AI Investor Intelligence

</h2>



<p

className="
text-sm
text-muted-foreground
"

>

ניתוח מבוסס נתוני משתמש,
סיכון,
מטרות והרגלי השקעה

</p>


</div>



</div>








<div

className="
grid
grid-cols-1
gap-4
md:grid-cols-4
"

>






<div

className="
rounded-2xl
border
bg-background
p-4
transition
hover:shadow-md
"

>


<TrendingUp

className="
mb-3
h-5
w-5
text-primary
"

/>



<p

className="
text-xs
text-muted-foreground
"

>

סגנון השקעה

</p>




<p

className="
mt-1
font-bold
"

>

{
result.investor?.type ??
"משקיע"
}


</p>



</div>









<div

className="
rounded-2xl
border
bg-background
p-4
transition
hover:shadow-md
"

>


<ShieldCheck

className="
mb-3
h-5
w-5
text-primary
"

/>



<p

className="
text-xs
text-muted-foreground
"

>

ציון סיכון

</p>



<p

className="
mt-1
text-xl
font-bold
"

>

{
result.riskScore ?? 0
}

/10


</p>


</div>









<div

className="
rounded-2xl
border
bg-background
p-4
transition
hover:shadow-md
"

>


<Target

className="
mb-3
h-5
w-5
text-primary
"

/>



<p

className="
text-xs
text-muted-foreground
"

>

מטרה פיננסית

</p>



<p

className="
mt-1
font-bold
"

>

{
goalLabel(
result.scenario?.goal
)
}


</p>


</div>









<div

className="
rounded-2xl
border
bg-background
p-4
transition
hover:shadow-md
"

>


<Sparkles

className="
mb-3
h-5
w-5
text-primary
"

/>



<p

className="
text-xs
text-muted-foreground
"

>

AI Confidence

</p>



<p

className="
mt-1
font-bold
"

>

{
confidenceLabel(
result.scenario?.confidence
)
}


</p>


</div>






</div>





</CardContent>


</Card>








{/* =====================================================
MAIN DASHBOARD GRID
===================================================== */}



<motion.div


initial={{
opacity:0,
y:20
}}


animate={{
opacity:1,
y:0
}}


transition={{
duration:0.5
}}



className="
grid
grid-cols-1
gap-5
lg:grid-cols-2
"

>







<div

className="
lg:col-span-2
"

>

<WelcomeCard

result={result}

/>

</div>









<InvestorTypeCard

result={result}

/>




<RiskScoreCard

result={result}

/>




<HorizonCard

result={result}

/>




<InterestsCard

result={result}

/>









{/* =====================================================
EXPLAINABLE AI
===================================================== */}



<div

className="
lg:col-span-2
"

>


<ExplainableAiCard

result={result}

/>


</div>








{/* =====================================================
PORTFOLIO ANALYSIS
===================================================== */}



<div

className="
lg:col-span-2
"

>


<PortfolioCard

result={result}

/>


</div>








{/* =====================================================
GOAL PLANNER
===================================================== */}



{
result.goalPlan &&

(

<div

className="
lg:col-span-2
"

>


<GoalPlannerCard


targetAmount={
result.goalPlan.targetAmount
}


currentAmount={
result.goalPlan.currentAmount
}


years={
result.goalPlan.years
}


requiredMonthlyContribution={
result.goalPlan.requiredMonthlyContribution
}


expectedFinalValue={
result.goalPlan.expectedFinalValue
}


progressPercentage={
result.goalPlan.progressPercentage
}


achievable={
result.goalPlan.achievable
}


/>


</div>

)

}

{/* =====================================================
STRATEGIES
===================================================== */}


<div

className="
lg:col-span-2
"

>


<StrategiesCard/>


</div>









{/* =====================================================
MARKET INTELLIGENCE
===================================================== */}



<div

className="
lg:col-span-2
"

>


<MarketDataCard


interests={
result.flags.interests
}


/>


</div>









{/* =====================================================
BROKER COMPARISON
===================================================== */}



<div

className="
lg:col-span-2
"

>


<ComparisonCard/>


</div>









{/* =====================================================
FINANCIAL EDUCATION CENTER
===================================================== */}



<div

className="
lg:col-span-2
"

>


<div

className="
mb-4
flex
items-center
gap-2
"

>


<GraduationCap

className="
h-5
w-5
text-primary
"

/>



<h2

className="
text-xl
font-bold
"

>

Learning Center

</h2>


</div>




<ConceptsCard/>


</div>








<div>


<MistakesCard/>


</div>







<div>


<RoadmapCard

result={result}

/>


</div>









{/* =====================================================
KNOWLEDGE QUIZ
===================================================== */}



<div

className="
lg:col-span-2
"

>


<QuizCard/>


</div>







</motion.div>





</section>


</Layout>


);


}
