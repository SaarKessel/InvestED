// ---------------------------------------------------------------------------
// InvestED - Goal Planner Card v3
// ---------------------------------------------------------------------------

import { motion } from "framer-motion";

import {
  Target,
  TrendingUp,
  Wallet,
  CalendarDays,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";



// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {

  targetAmount:number | null;

  goalDescription?:string;

  currentAmount:number;

  years:number;

  requiredMonthlyContribution:number;

  expectedFinalValue:number;

  progressPercentage:number;

  achievable:boolean;

}



// ---------------------------------------------------------------------------
// Money Formatter
// ---------------------------------------------------------------------------

function formatMoney(
  value:number
){

  return new Intl.NumberFormat(
    "he-IL",
    {
      style:"currency",
      currency:"ILS",
      maximumFractionDigits:0
    }
  ).format(value);

}



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GoalPlannerCard({

  targetAmount,

  goalDescription,

  currentAmount,

  years,

  requiredMonthlyContribution,

  expectedFinalValue,

  progressPercentage,

  achievable

}:Props){



const progress = Math.min(
  Math.max(progressPercentage,0),
  100
);



return (

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
  duration:0.4
}}


className="
mt-6
rounded-3xl
border
border-primary/20
bg-gradient-to-br
from-card
to-muted/30
p-6
shadow-sm
space-y-6
"


>



{/* Header */}

<div className="
flex
items-start
gap-3
">


<div className="
rounded-xl
bg-primary/10
p-3
">


<Target className="
h-6
w-6
text-primary
"/>


</div>



<div>


<h3 className="
text-2xl
font-bold
">

🎯 Goal Planner

</h3>


<p className="
mt-1
text-sm
text-muted-foreground
">

תכנון יעד פיננסי לפי הון קיים, זמן ותשואה משוערת.

</p>


</div>


</div>





{/* Main Metrics */}

<div className="
grid
grid-cols-1
md:grid-cols-3
gap-4
">



{/* Target */}

<div className="
rounded-2xl
border
bg-background
p-4
">


<div className="
flex
items-center
gap-2
text-sm
text-muted-foreground
">


<Target className="
h-4
w-4
"/>


יעד

</div>



<p className="
mt-3
text-xl
font-bold
">


{

targetAmount !== null

?

formatMoney(targetAmount)

:

goalDescription ?? "יעד פיננסי"

}


</p>


</div>





{/* Years */}

<div className="
rounded-2xl
border
bg-background
p-4
">


<div className="
flex
items-center
gap-2
text-sm
text-muted-foreground
">


<CalendarDays className="
h-4
w-4
"/>


תקופה


</div>



<p className="
mt-3
text-xl
font-bold
">


{years} שנים


</p>


</div>





{/* Current Amount */}

<div className="
rounded-2xl
border
bg-background
p-4
">


<div className="
flex
items-center
gap-2
text-sm
text-muted-foreground
">


<Wallet className="
h-4
w-4
"/>


הון קיים


</div>



<p className="
mt-3
text-xl
font-bold
">


{formatMoney(currentAmount)}


</p>


</div>


</div>







{/* Monthly Contribution */}

<div className="
rounded-2xl
border
bg-background
p-5
">


<div className="
flex
items-center
gap-2
text-sm
text-muted-foreground
">


<TrendingUp className="
h-4
w-4
"/>


הפקדה חודשית נדרשת


</div>



<p className="
mt-3
text-3xl
font-bold
text-primary
">


{formatMoney(requiredMonthlyContribution)}


</p>


</div>







{/* Progress */}

<div>


<div className="
mb-2
flex
justify-between
text-sm
">


<span className="
text-muted-foreground
">

התקדמות ליעד

</span>



<span className="
font-bold
">

{Math.round(progress)}%

</span>


</div>





<div className="
h-3
overflow-hidden
rounded-full
bg-muted
">


<div

className="
h-full
rounded-full
bg-primary
transition-all
duration-700
"


style={{

width:`${progress}%`

}}


/>


</div>


</div>








{/* Result */}

<div

className={`
rounded-2xl
border
p-5

${
achievable

?

"border-green-500/30 bg-green-500/10"

:

"border-yellow-500/30 bg-yellow-500/10"

}

`}

>


<div className="
flex
items-center
gap-3
">


{

achievable

?

<CheckCircle2

className="
h-6
w-6
text-green-500
"

/>


:


<AlertTriangle

className="
h-6
w-6
text-yellow-500
"

/>


}



<p className="
font-bold
">


{

achievable

?

"היעד נראה אפשרי לפי ההנחות הנוכחיות"

:

"ייתכן שנדרש שינוי בהפקדה או בתקופה"

}


</p>


</div>





<p className="
mt-3
text-sm
text-muted-foreground
">


שווי עתידי משוער:

{" "}


<span className="
font-bold
text-primary
">


{formatMoney(expectedFinalValue)}


</span>


</p>


</div>







{/* Disclaimer */}

<div className="
text-xs
text-muted-foreground
border-t
pt-4
">


⚠️ סימולציה חינוכית בלבד. אינה מהווה ייעוץ השקעות או הבטחת תשואה.


</div>



</motion.div>


);


}