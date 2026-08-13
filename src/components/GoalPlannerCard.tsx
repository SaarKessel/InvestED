// ---------------------------------------------------------------------------
// InvestED - Goal Planner Card
// ---------------------------------------------------------------------------

import type {
  RetirementPlanResult,
} from "@/lib/goalEngine";

interface Props {

  targetAmount:number;

  currentAmount:number;

  years:number;

  requiredMonthlyContribution:number;

  expectedFinalValue:number;

  progressPercentage:number;

  achievable:boolean;

  retirementPlan?:RetirementPlanResult;

}



function formatMoney(value:number){

  return new Intl.NumberFormat(
    "he-IL",
    {
      style:"currency",
      currency:"ILS",
      maximumFractionDigits:0
    }
  ).format(value);

}




export function GoalPlannerCard({

  targetAmount,

  currentAmount,

  years,

  requiredMonthlyContribution,

  expectedFinalValue,

  progressPercentage,

  achievable,

  retirementPlan

}:Props){


return (

<div

className="
mt-6
rounded-3xl
border
border-[#1E3A5F]
bg-[#0B1628]
p-6
shadow-sm
space-y-6
"

>


<div>


<h3

className="
text-2xl
font-bold
text-white
"

>

🎯 Goal Planner - תכנון יעד פיננסי

</h3>



<p

className="
mt-2
text-sm
text-slate-400
"

>

חישוב מבוסס על זמן, הון קיים ותשואה משוערת לצורכי לימוד בלבד.

</p>


</div>






<div

className="
grid
grid-cols-1
md:grid-cols-3
gap-4
"

>



<div

className="
rounded-xl
bg-[#050B16]
border
border-[#1E3A5F]
p-4
"

>

<p className="text-sm text-slate-400">

יעד כספי

</p>


<p className="mt-2 text-2xl font-bold text-white">

{formatMoney(targetAmount)}

</p>


</div>






<div

className="
rounded-xl
bg-[#050B16]
border
border-[#1E3A5F]
p-4
"

>

<p className="text-sm text-slate-400">

תקופת השקעה

</p>


<p className="mt-2 text-2xl font-bold text-white">

{years} שנים

</p>


</div>







<div

className="
rounded-xl
bg-[#050B16]
border
border-[#1E3A5F]
p-4
"

>


<p className="text-sm text-slate-400">

הון נוכחי

</p>


<p className="mt-2 text-2xl font-bold text-white">

{formatMoney(currentAmount)}

</p>


</div>



</div>







<div

className="
rounded-xl
border
border-[#1E3A5F]
bg-[#050B16]
p-5
"

>


<p className="text-sm text-slate-400">

הפקדה חודשית נדרשת

</p>


<p

className="
mt-2
text-3xl
font-bold
text-emerald-400
"

>

{formatMoney(requiredMonthlyContribution)}

</p>


</div>







<div>


<div

className="
flex
justify-between
mb-2
"

>

<span className="text-sm text-slate-400">

התקדמות ליעד

</span>


<span className="text-white font-bold">

{progressPercentage}%

</span>


</div>





<div

className="
h-3
rounded-full
bg-[#050B16]
overflow-hidden
border
border-[#1E3A5F]
"

>


<div

className="
h-full
bg-emerald-400
transition-all
"

style={{

width:`${Math.min(progressPercentage,100)}%`

}}


/>


</div>


</div>









<div

className={`
rounded-xl
p-5
border

${
achievable

?

"border-emerald-400 bg-emerald-400/10"

:

"border-yellow-400 bg-yellow-400/10"

}

`}

>


<p className="font-bold text-lg text-white">

{

achievable

?

"✅ לפי ההנחות הנוכחיות היעד נראה אפשרי"

:

"⚠️ נדרש שינוי בהפקדה או בתקופת ההשקעה"

}

</p>



<p className="mt-3 text-slate-300">

שווי עתידי משוער:

{" "}

<span className="font-bold text-emerald-400">

{formatMoney(expectedFinalValue)}

</span>


</p>


</div>


{retirementPlan && (

<div className="space-y-4">

<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

<div className="rounded-xl bg-[#050B16] border border-[#1E3A5F] p-4">

<p className="text-sm text-slate-400">שנים שנותרו</p>

<p className="mt-2 text-2xl font-bold text-white">{retirementPlan.yearsRemaining} שנים</p>

</div>

<div className="rounded-xl bg-[#050B16] border border-[#1E3A5F] p-4">

<p className="text-sm text-slate-400">הכנסה חודשית בעת פרישה</p>

<p className="mt-2 text-2xl font-bold text-white">{formatMoney(retirementPlan.monthlyIncomeDuringRetirement)}</p>

</div>

<div className="rounded-xl bg-[#050B16] border border-[#1E3A5F] p-4">

<p className="text-sm text-slate-400">סיכוי להצלחה</p>

<p className="mt-2 text-2xl font-bold text-white">{retirementPlan.probabilityOfSuccess}%</p>

</div>

<div className="rounded-xl bg-[#050B16] border border-[#1E3A5F] p-4">

<p className="text-sm text-slate-400">הפקדה חודשית נוכחית</p>

<p className="mt-2 text-2xl font-bold text-white">{formatMoney(retirementPlan.monthlyInvestment)}</p>

</div>

</div>

<div className="rounded-xl bg-[#050B16] border border-[#1E3A5F] p-5">

<p className="text-sm text-slate-400 mb-3">תרחישים חלופיים</p>

<div className="grid grid-cols-1 md:grid-cols-3 gap-3">

{retirementPlan.scenarioAlternatives.map((scenario) => (

<div key={scenario.label} className="rounded-xl border border-[#1E3A5F] bg-[#0B1628] p-4">

<p className="text-white font-bold">{scenario.label}</p>

<p className="text-sm text-slate-400 mt-2">{scenario.summary}</p>

<p className="mt-3 text-emerald-400 font-bold">{formatMoney(scenario.futureValue)}</p>

<p className="text-sm text-slate-300">תשואה משוערת: {scenario.annualReturnPct}%</p>

<p className="text-sm text-slate-300">הפקדה חודשית: {formatMoney(scenario.monthlyContribution)}</p>

<p className="text-sm text-slate-300">סיכוי: {scenario.probability}%</p>

</div>

))}

</div>

</div>

<div className="rounded-xl bg-[#050B16] border border-[#1E3A5F] p-5">

<p className="text-sm text-slate-400 mb-3">ציר זמן</p>

<div className="space-y-3">

{retirementPlan.timelineVisualization.map((point) => (

<div key={point.year}>

<div className="flex justify-between text-sm text-slate-300">

<span>שנה {point.year}</span>

<span>{formatMoney(point.value)}</span>

</div>

<div className="mt-1 h-2 rounded-full bg-[#0B1628] overflow-hidden border border-[#1E3A5F]">

<div className="h-full bg-emerald-400" style={{ width: `${Math.min((point.value / Math.max(retirementPlan.futureValue, 1)) * 100, 100)}%` }} />

</div>

</div>

))}

</div>

</div>

<div className="rounded-xl bg-[#050B16] border border-[#1E3A5F] p-5">

<p className="text-sm text-slate-400 mb-3">המלצות</p>

<ul className="space-y-2 text-slate-300">

{retirementPlan.recommendations.map((item) => (

<li key={item} className="list-disc mr-5">{item}</li>

))}

</ul>

</div>

<div className="rounded-xl bg-[#050B16] border border-[#1E3A5F] p-5">

<p className="text-sm text-slate-400 mb-3">הסברים חינוכיים</p>

<ul className="space-y-2 text-slate-300">

{retirementPlan.educationalExplanations.map((item) => (

<li key={item} className="list-disc mr-5">{item}</li>

))}

</ul>

</div>

</div>

)}



</div>


);


}