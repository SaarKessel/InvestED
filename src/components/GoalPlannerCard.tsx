// ---------------------------------------------------------------------------
// InvestED — Goal Planner Card
// ---------------------------------------------------------------------------


interface Props {

  targetAmount:number;

  currentAmount:number;

  years:number;

  requiredMonthlyContribution:number;

  expectedFinalValue:number;

  progressPercentage:number;

  achievable:boolean;

}




export function GoalPlannerCard({

  targetAmount,

  currentAmount,

  years,

  requiredMonthlyContribution,

  expectedFinalValue,

  progressPercentage,

  achievable

}:Props){



return (

<div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm space-y-5">



<div>

<h3 className="text-xl font-bold">

🎯 תכנון יעד פיננסי

</h3>


<p className="mt-1 text-sm text-muted-foreground">

ניתוח הדרך שלך להשגת היעד

</p>

</div>







<div className="grid grid-cols-1 md:grid-cols-3 gap-4">



<div className="rounded-xl bg-gray-50 p-4">


<p className="text-sm text-gray-500">

יעד כספי

</p>


<p className="font-bold text-lg">

₪{targetAmount.toLocaleString("he-IL")}

</p>


</div>







<div className="rounded-xl bg-gray-50 p-4">


<p className="text-sm text-gray-500">

סכום נוכחי

</p>


<p className="font-bold text-lg">

₪{currentAmount.toLocaleString("he-IL")}

</p>


</div>







<div className="rounded-xl bg-gray-50 p-4">


<p className="text-sm text-gray-500">

זמן עד היעד

</p>


<p className="font-bold text-lg">

{years} שנים

</p>


</div>



</div>








<div className="rounded-xl bg-primary/5 p-4">


<p className="text-sm">

💰 הפקדה חודשית משוערת נדרשת:

</p>


<p className="mt-1 text-2xl font-bold">

₪{requiredMonthlyContribution.toLocaleString("he-IL")}

</p>


</div>








<div className="rounded-xl border p-4">


<p className="text-sm">

📊 התקדמות נוכחית:

</p>


<div className="mt-3 h-3 rounded-full bg-gray-200 overflow-hidden">


<div

className="h-full bg-primary"

style={{

width:`${progressPercentage}%`

}}

/>


</div>



<p className="mt-2 font-bold">

{progressPercentage}%

</p>


</div>








<div className="rounded-xl bg-muted p-4">


<p>


{achievable

?

"✅ לפי ההנחות הנוכחיות, היעד נראה אפשרי."

:

"⚠️ לפי ההנחות הנוכחיות, כדאי לשקול הגדלת הפקדה או הארכת תקופה."

}


</p>


<p className="mt-2 text-sm text-muted-foreground">


שווי עתידי משוער:

{" "}

<b>

₪{expectedFinalValue.toLocaleString("he-IL")}

</b>


</p>


</div>







</div>

);


}