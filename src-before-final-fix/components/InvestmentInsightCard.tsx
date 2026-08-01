// ---------------------------------------------------------------------------
// InvestED — Smart Investment Insight Card
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





let insight="";

let icon="💡";





if(years >= 20){

insight=

"אופק השקעה ארוך מאפשר לריבית דריבית להשפיע בצורה משמעותית יותר על הצמיחה.";

icon="🚀";

}

else if(years >= 10){

insight=

"תקופת השקעה בינונית מאפשרת לשוק ההון לעבוד לטובת המשקיע לאורך זמן.";

icon="📈";

}

else{

insight=

"בתקופות קצרות יותר, לתנודתיות השוק יכולה להיות השפעה גדולה יותר על התוצאה.";

icon="⚠️";

}





if(goal==="retirement"){

insight=

"המטרה היא פרישה — במקרה כזה זמן ההשקעה והגדלת ההון לאורך שנים הם הגורמים המרכזיים.";

icon="🏖️";

}



if(goal==="child"){

insight=

"חיסכון לילד נהנה במיוחד מהשפעת הזמן, מכיוון שגם סכומים קטנים יכולים לצמוח משמעותית לאורך שנים.";

icon="👶";

}





return (


<div className="mt-6 rounded-2xl border bg-white p-6 shadow-sm space-y-5">



<div>

<h3 className="text-xl font-bold">

🧠 תובנת InvestED

</h3>


<p className="mt-1 text-sm text-muted-foreground">

ניתוח חכם של תרחיש ההשקעה שלך

</p>

</div>





<div className="rounded-xl bg-muted p-4">


<p className="text-sm text-muted-foreground">

נכס שנבחר

</p>


<p className="font-bold text-lg">

{assetLabel}

</p>



{annualReturnPct && (

<p className="text-sm mt-1">

תשואה שנתית משוערת:{" "}

<b>{annualReturnPct}%</b>

</p>

)}


</div>







<div className="grid grid-cols-1 md:grid-cols-3 gap-4">



<div className="rounded-xl bg-gray-50 p-4">


<p className="text-sm text-gray-500">

סה"כ השקעה

</p>


<p className="font-bold text-lg">

₪{totalContributed.toLocaleString("he-IL")}

</p>


</div>





<div className="rounded-xl bg-gray-50 p-4">


<p className="text-sm text-gray-500">

שווי סופי

</p>


<p className="font-bold text-lg">

₪{finalBalance.toLocaleString("he-IL")}

</p>


</div>





<div className="rounded-xl bg-gray-50 p-4">


<p className="text-sm text-gray-500">

מכפיל השקעה

</p>


<p className="font-bold text-lg">

x{multiple}

</p>


</div>



</div>







<div className="rounded-xl border p-4">


<p className="text-sm text-gray-700">


{icon}{" "}

{insight}


</p>


</div>







<div className="rounded-xl bg-primary/5 p-4">


<p className="text-sm">


💰 מתוך השווי הסופי:


</p>



<p className="mt-1 text-lg font-bold">


כ־{growthPercentage}% מהסכום נוצר מצמיחת ההשקעה



</p>



<p className="text-sm text-muted-foreground mt-1">


ורק כ־{contributionPercentage}% הגיעו מהכסף שהופקד.


</p>



</div>







{monthlyContribution > 0 && (


<div className="rounded-xl bg-green-50 p-4">


<p className="text-sm">


📌 הפקדה חודשית:


</p>


<p className="font-bold">


₪{monthlyContribution.toLocaleString("he-IL")} בחודש


</p>


</div>


)}





</div>


);


}