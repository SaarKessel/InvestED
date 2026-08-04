// ---------------------------------------------------------------------------
// InvestED - Goal Planner Card
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

  achievable

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

נ¯ Goal Planner - ׳×׳›׳ ׳•׳ ׳™׳¢׳“ ׳₪׳™׳ ׳ ׳¡׳™

</h3>



<p

className="
mt-2
text-sm
text-slate-400
"

>

׳—׳™׳©׳•׳‘ ׳׳‘׳•׳¡׳¡ ׳¢׳ ׳–׳׳, ׳”׳•׳ ׳§׳™׳™׳ ׳•׳×׳©׳•׳׳” ׳׳©׳•׳¢׳¨׳× ׳׳¦׳•׳¨׳›׳™ ׳׳™׳׳•׳“ ׳‘׳׳‘׳“.

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

׳™׳¢׳“ ׳›׳¡׳₪׳™

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

׳×׳§׳•׳₪׳× ׳”׳©׳§׳¢׳”

</p>


<p className="mt-2 text-2xl font-bold text-white">

{years} ׳©׳ ׳™׳

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

׳”׳•׳ ׳ ׳•׳›׳—׳™

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

׳”׳₪׳§׳“׳” ׳—׳•׳“׳©׳™׳× ׳ ׳“׳¨׳©׳×

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

׳”׳×׳§׳“׳׳•׳× ׳׳™׳¢׳“

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

"ג… ׳׳₪׳™ ׳”׳”׳ ׳—׳•׳× ׳”׳ ׳•׳›׳—׳™׳•׳× ׳”׳™׳¢׳“ ׳ ׳¨׳׳” ׳׳₪׳©׳¨׳™"

:

"ג ן¸ ׳ ׳“׳¨׳© ׳©׳™׳ ׳•׳™ ׳‘׳”׳₪׳§׳“׳” ׳׳• ׳‘׳×׳§׳•׳₪׳× ׳”׳”׳©׳§׳¢׳”"

}

</p>



<p className="mt-3 text-slate-300">

׳©׳•׳•׳™ ׳¢׳×׳™׳“׳™ ׳׳©׳•׳¢׳¨:

{" "}

<span className="font-bold text-emerald-400">

{formatMoney(expectedFinalValue)}

</span>


</p>


</div>





</div>


);


}
