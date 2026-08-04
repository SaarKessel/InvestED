// ---------------------------------------------------------------------------
// InvestED ג€” Smart Investment Insight Card (Premium UI)
// ---------------------------------------------------------------------------

import {
  TrendingUp,
  Wallet,
  Target,
  Sparkles,
  Lightbulb,
} from "lucide-react";


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



export function InvestmentInsightCard({

  finalBalance,

  totalContributed,

  growth,

  years,

  assetLabel="׳”׳©׳§׳¢׳”",

  annualReturnPct,

  monthlyContribution=0,

  goal="growth"

}:Props){



const growthPercentage =

finalBalance > 0

?

Math.round(
(growth / finalBalance) * 100
)

:

0;




const multiple =

totalContributed > 0

?

(finalBalance / totalContributed).toFixed(1)

:

"0";





const contributionPercentage =

finalBalance > 0

?

Math.round(
(totalContributed / finalBalance) * 100
)

:

0;






let insight = "";

let icon = "נ’¡";





if(years >= 20){

  insight =
  "׳׳•׳₪׳§ ׳”׳©׳§׳¢׳” ׳׳¨׳•׳ ׳׳׳₪׳©׳¨ ׳׳¨׳™׳‘׳™׳× ׳“׳¨׳™׳‘׳™׳× ׳׳”׳©׳₪׳™׳¢ ׳‘׳¦׳•׳¨׳” ׳׳©׳׳¢׳•׳×׳™׳× ׳™׳•׳×׳¨ ׳¢׳ ׳¦׳׳™׳—׳× ׳”׳”׳•׳.";

  icon="נ€";


}

else if(years >= 10){

  insight =
  "׳×׳§׳•׳₪׳× ׳”׳©׳§׳¢׳” ׳‘׳™׳ ׳•׳ ׳™׳× ׳׳׳₪׳©׳¨׳× ׳׳©׳•׳§ ׳”׳”׳•׳ ׳׳¢׳‘׳•׳“ ׳׳˜׳•׳‘׳× ׳”׳׳©׳§׳™׳¢ ׳׳׳•׳¨׳ ׳–׳׳.";

  icon="נ“ˆ";


}

else{

  insight =
  "׳‘׳×׳§׳•׳₪׳•׳× ׳§׳¦׳¨׳•׳× ׳™׳•׳×׳¨, ׳׳×׳ ׳•׳“׳×׳™׳•׳× ׳”׳©׳•׳§ ׳™׳›׳•׳׳” ׳׳”׳™׳•׳× ׳”׳©׳₪׳¢׳” ׳’׳“׳•׳׳” ׳™׳•׳×׳¨ ׳¢׳ ׳”׳×׳•׳¦׳׳”.";

  icon="ג ן¸";

}




if(goal==="retirement"){

  insight =
  "׳”׳׳˜׳¨׳” ׳”׳™׳ ׳₪׳¨׳™׳©׳” ג€” ׳–׳׳ ׳”׳©׳§׳¢׳” ׳׳¨׳•׳ ׳•׳”׳’׳“׳׳× ׳”׳”׳•׳ ׳׳׳•׳¨׳ ׳©׳ ׳™׳ ׳”׳ ׳”׳’׳•׳¨׳׳™׳ ׳”׳׳¨׳›׳–׳™׳™׳.";

  icon="נ–ן¸";

}



if(goal==="child"){

  insight =
  "׳—׳™׳¡׳›׳•׳ ׳׳™׳׳“ ׳ ׳”׳ ׳” ׳‘׳׳™׳•׳—׳“ ׳׳”׳©׳₪׳¢׳× ׳”׳–׳׳, ׳׳›׳™׳•׳•׳ ׳©׳’׳ ׳¡׳›׳•׳׳™׳ ׳§׳˜׳ ׳™׳ ׳™׳›׳•׳׳™׳ ׳׳¦׳׳•׳— ׳׳©׳׳¢׳•׳×׳™׳×.";

  icon="נ‘¶";

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

׳ ׳™׳×׳•׳— ׳—׳›׳ ׳©׳ ׳×׳¨׳—׳™׳© ׳”׳”׳©׳§׳¢׳” ׳©׳׳

</h3>



<p
className="
mt-2
text-sm
text-white/80
"
>

׳”׳׳¢׳¨׳›׳× ׳ ׳™׳×׳—׳” ׳׳× ׳”׳ ׳×׳•׳ ׳™׳ ׳•׳”׳׳—׳™׳©׳” ׳׳™׳ ׳”׳–׳׳,
׳”׳×׳©׳•׳׳” ׳•׳”׳”׳₪׳§׳“׳•׳× ׳׳©׳₪׳™׳¢׳™׳ ׳¢׳ ׳”׳×׳•׳¦׳׳”.

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

׳ ׳›׳¡ ׳©׳ ׳‘׳—׳¨

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
annualReturnPct &&

<p
className="
mt-2
text-sm
text-slate-600
dark:text-slate-300
"
>

׳×׳©׳•׳׳” ׳©׳ ׳×׳™׳× ׳׳©׳•׳¢׳¨׳×:

{" "}

<b>
{annualReturnPct}%
</b>

</p>

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

<div className="flex items-center gap-2 text-sm text-slate-500">

<Wallet className="h-4 w-4"/>

׳¡׳”"׳› ׳”׳©׳§׳¢׳”

</div>


<p className="mt-2 text-xl font-extrabold">

ג‚×{totalContributed.toLocaleString("he-IL")}

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

<div className="flex items-center gap-2 text-sm text-slate-500">

<TrendingUp className="h-4 w-4"/>

׳©׳•׳•׳™ ׳¡׳•׳₪׳™

</div>


<p className="mt-2 text-xl font-extrabold">

ג‚×{finalBalance.toLocaleString("he-IL")}

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

<div className="flex items-center gap-2 text-sm text-slate-500">

<Target className="h-4 w-4"/>

׳׳›׳₪׳™׳ ׳”׳©׳§׳¢׳”

</div>


<p className="mt-2 text-xl font-extrabold">

x{multiple}

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

נ’° ׳׳×׳•׳ ׳”׳©׳•׳•׳™ ׳”׳¡׳•׳₪׳™:

</p>



<div className="mt-4 space-y-4">


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

נ“ˆ ׳¦׳׳™׳—׳× ׳”׳”׳©׳§׳¢׳”

</span>


<span className="font-bold">

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

נ’° ׳›׳¡׳£ ׳©׳”׳•׳₪׳§׳“

</span>


<span className="font-bold">

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

׳›ײ¾{growthPercentage}% ׳׳”׳©׳•׳•׳™ ׳”׳¡׳•׳₪׳™ ׳ ׳•׳¦׳¨ ׳׳¦׳׳™׳—׳× ׳”׳”׳©׳§׳¢׳”,
׳•׳¨׳§ ׳›ײ¾{contributionPercentage}% ׳”׳’׳™׳¢׳• ׳׳”׳›׳¡׳£ ׳©׳”׳•׳₪׳§׳“.

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

<p className="text-sm text-slate-600 dark:text-slate-300">

נ“ ׳”׳₪׳§׳“׳” ׳—׳•׳“׳©׳™׳×

</p>


<p className="mt-2 text-xl font-extrabold">

ג‚×{monthlyContribution.toLocaleString("he-IL")}

׳‘׳—׳•׳“׳©

</p>


</div>

)

}




</div>


</div>


);


}
