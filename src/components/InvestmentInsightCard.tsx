// ---------------------------------------------------------------------------
// InvestED — Investment Insight Card
// ---------------------------------------------------------------------------


interface Props {

  finalBalance:number;

  totalContributed:number;

  growth:number;

  years:number;

}



export function InvestmentInsightCard({

  finalBalance,

  totalContributed,

  growth,

  years

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




return (

<div className="rounded-2xl border p-6 space-y-4 bg-white shadow-sm">


<h3 className="text-xl font-bold">

🧠 תובנת InvestED

</h3>



<p className="text-gray-700">

המערכת ניתחה תרחיש השקעה של{" "}

<strong>{years}</strong>{" "}

שנים.

</p>



<div className="grid grid-cols-1 md:grid-cols-3 gap-4">


<div className="rounded-xl bg-gray-50 p-4">

<p className="text-sm text-gray-500">

סך השקעה

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




<p className="text-gray-700">

💡 מתוך השווי הסופי, כ־

<strong>{growthPercentage}%</strong>

נוצר מצמיחת ההשקעה ולא מהפקדות נוספות.

</p>



</div>

);


}