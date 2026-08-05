// ---------------------------------------------------------------------------
// InvestED — Smart Investment Insight Card v7
// Premium Explainable AI Investment UI
// ---------------------------------------------------------------------------

import {
  TrendingUp,
  Wallet,
  Target,
  Sparkles,
  Lightbulb,
} from "lucide-react";


// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {

  finalBalance:number;

  totalContributed:number;

  growth:number;

  years:number;

  assetLabel?:string;

  annualReturnPct?:number;

  monthlyContribution?:number;

  goal?:string;

}



// ---------------------------------------------------------------------------
// Helpers
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
  ).format(value || 0);

}



function safePercent(
  value:number
){

  return Math.min(
    Math.max(
      Math.round(value),
      0
    ),
    100
  );

}



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvestmentInsightCard({

  finalBalance,

  totalContributed,

  growth,

  years,

  assetLabel="השקעה",

  annualReturnPct,

  monthlyContribution=0,

  goal="growth"

}:Props){



const finalValue =
Math.max(finalBalance,0);



const contributed =
Math.max(totalContributed,0);



const profit =
Math.max(growth,0);




const growthPercentage =

finalValue > 0

?

safePercent(
(profit / finalValue) * 100
)

:

0;




const contributionPercentage =

finalValue > 0

?

safePercent(
(contributed / finalValue) * 100
)

:

0;




const investmentMultiple =

contributed > 0

?

(finalValue / contributed)
.toFixed(1)

:

"0";





// ---------------------------------------------------------------------------
// AI Explanation
// ---------------------------------------------------------------------------

let insight =
"ניתוח השקעה המבוסס על זמן, תשואה והפקדות.";


let icon =
"💡";



if(years >= 20){

  insight =
  "אופק השקעה ארוך מאפשר לריבית דריבית להשפיע בצורה משמעותית על צמיחת ההון.";

  icon =
  "🚀";

}

else if(years >= 10){

  insight =
  "תקופת השקעה בינונית מאפשרת לשוק ההון לעבוד לטובת המשקיע לאורך זמן.";

  icon =
  "📈";

}

else{

  insight =
  "בטווח קצר יותר לתנודתיות השוק יכולה להיות השפעה משמעותית.";

  icon =
  "⚠️";

}



if(goal==="retirement"){

  insight =
  "המטרה היא פרישה — זמן והשקעה עקבית הם גורמים מרכזיים בבניית הון.";

  icon =
  "🏖️";

}



if(goal==="child"){

  insight =
  "חיסכון לילדים נהנה במיוחד מהשפעת הזמן והריבית דריבית.";

  icon =
  "👶";

}



if(goal==="home"){

  insight =
  "יעד רכישת דירה דורש איזון בין צמיחה לבין ניהול סיכון.";

  icon =
  "🏠";

}



return (

<div
className="
mt-8
overflow-hidden
rounded-3xl
border
border-border
bg-card
shadow-soft
"
>

<div
className="
border-b
border-border
bg-muted/40
p-6
"
>

<div
className="
inline-flex
items-center
gap-2
rounded-full
bg-primary/10
px-3
py-1
text-sm
font-bold
text-primary
"
>

<Sparkles className="h-4 w-4"/>

AI Simulation

</div>


<h3
className="
mt-3
text-2xl
font-extrabold
"
>

ניתוח חכם של תרחיש ההשקעה שלך

</h3>


<p
className="
mt-2
text-sm
text-white/80
"
>

המערכת ניתחה את הנתונים והמחישה כיצד זמן,
תשואה והפקדות משפיעים על התוצאה.

</p>

</div>

<div
className="
space-y-5
p-6
"
>


<div
className="
rounded-2xl
border
border-slate-200
bg-white/80
p-5
dark:border-slate-700
dark:bg-slate-800/60
"
>


<div
className="
flex
items-center
gap-2
text-sm
font-semibold
text-slate-500
dark:text-slate-300
"
>

<Target className="h-4 w-4"/>

נכס שנבחר

</div>



<p
className="
mt-2
text-xl
font-extrabold
"
>

{assetLabel}

</p>



{
annualReturnPct !== undefined && (

<p
className="
mt-2
text-sm
text-slate-600
dark:text-slate-300
"
>

תשואה שנתית משוערת:

{" "}

<b>
{annualReturnPct}%
</b>

</p>

)

}


</div>





<div
className="
grid
gap-4
md:grid-cols-3
"
>


<div
className="
rounded-2xl
bg-slate-100
p-5
dark:bg-slate-800
"
>

<div
className="
flex
items-center
gap-2
text-sm
text-slate-500
"
>

<Wallet className="h-4 w-4"/>

סה"כ השקעה

</div>



<p
className="
mt-2
text-xl
font-extrabold
"
>

{formatMoney(contributed)}

</p>


</div>





<div
className="
rounded-2xl
bg-slate-100
p-5
dark:bg-slate-800
"
>


<div
className="
flex
items-center
gap-2
text-sm
text-slate-500
"
>

<TrendingUp className="h-4 w-4"/>

שווי סופי

</div>



<p
className="
mt-2
text-xl
font-extrabold
"
>

{formatMoney(finalValue)}

</p>


</div>





<div
className="
rounded-2xl
bg-slate-100
p-5
dark:bg-slate-800
"
>


<div
className="
flex
items-center
gap-2
text-sm
text-slate-500
"
>

<Target className="h-4 w-4"/>

מכפיל השקעה

</div>



<p
className="
mt-2
text-xl
font-extrabold
"
>

x{investmentMultiple}

</p>


</div>


</div>





<div
className="
rounded-2xl
border
border-blue-200
bg-blue-50
p-5
dark:border-blue-900
dark:bg-blue-950/40
"
>


<div
className="
flex
items-start
gap-3
"
>


<Lightbulb
className="
mt-1
h-5
w-5
text-blue-600
dark:text-blue-300
"
/>



<p
className="
text-sm
leading-7
text-slate-700
dark:text-slate-200
"
>

{icon}

{" "}

{insight}

</p>


</div>


</div>





<div
className="
rounded-2xl
border
border-emerald-200
bg-emerald-50
p-5
dark:border-emerald-900
dark:bg-emerald-950/40
"
>


<p
className="
font-bold
text-slate-800
dark:text-white
"
>

💰 מתוך השווי הסופי:

</p>



<div
className="
mt-4
space-y-4
"
>


<div>


<div
className="
mb-2
flex
justify-between
text-sm
"
>

<span>
📈 צמיחת ההשקעה
</span>


<span
className="
font-bold
"
>

{growthPercentage}%

</span>


</div>



<div
className="
h-3
overflow-hidden
rounded-full
bg-white
dark:bg-slate-700
"
>


<div
className="
h-full
rounded-full
bg-emerald-500
"
style={{
width:`${growthPercentage}%`
}}
/>


</div>


</div>

<div>


<div
className="
mb-2
flex
justify-between
text-sm
"
>

<span>
💰 כסף שהופקד
</span>


<span
className="
font-bold
"
>

{contributionPercentage}%

</span>


</div>




<div
className="
h-3
overflow-hidden
rounded-full
bg-white
dark:bg-slate-700
"
>


<div
className="
h-full
rounded-full
bg-blue-500
"
style={{
width:`${contributionPercentage}%`
}}
/>


</div>


</div>


</div>




<p
className="
mt-4
text-sm
text-slate-600
dark:text-slate-300
"
>

כ־{growthPercentage}% מהשווי הסופי נוצר מצמיחת ההשקעה,
וכ־{contributionPercentage}% הגיעו מהכסף שהופקד.

</p>


</div>





{
monthlyContribution > 0 && (

<div
className="
rounded-2xl
border
border-green-200
bg-green-50
p-5
dark:border-green-900
dark:bg-green-950/40
"
>


<p
className="
text-sm
text-slate-600
dark:text-slate-300
"
>

📌 הפקדה חודשית

</p>



<p
className="
mt-2
text-xl
font-extrabold
"
>

{formatMoney(monthlyContribution)}

בחודש

</p>


</div>

)

}




</div>


</div>


);


}