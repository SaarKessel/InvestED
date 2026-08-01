import {
  computeProjection,
  type ProjectionResult,
  type AssetClassOption,
} from "@/lib/calculatorEngine";


interface InvestmentComparisonProps {

  principal:number;

  monthlyContribution:number;

  years:number;

  assets:AssetClassOption[];

}




interface ComparisonRow {

  asset:AssetClassOption;

  result:ProjectionResult;

}



export function InvestmentComparison({

  principal,

  monthlyContribution,

  years,

  assets

}:InvestmentComparisonProps){



const comparisons:ComparisonRow[] = assets.map(asset=>({


asset,


result:computeProjection(

principal,

monthlyContribution,

years,

asset.annualReturnPct

)


}));





const sorted = [...comparisons].sort(

(a,b)=>

b.result.finalBalance -

a.result.finalBalance

);





return (

<div className="mt-8">


<h3 className="text-xl font-bold">

השוואת מסלולי השקעה

</h3>



<p className="mt-2 text-sm text-muted-foreground">

אותה השקעה, מסלולים שונים — לראות כיצד התשואה משפיעה לאורך זמן.

</p>




<div className="mt-5 space-y-3">



{sorted.map((item)=>{


const isBest =
item === sorted[0];



return (

<div

key={item.asset.key}

className={`
rounded-xl border p-4
${isBest ? "border-primary bg-primary/5" : "border-border"}
`}

>


<div className="flex items-center justify-between">


<div>


<p className="font-semibold">

{item.asset.label}

</p>


<p className="text-xs text-muted-foreground">

תשואה שנתית משוערת:

{item.asset.annualReturnPct}%

</p>


</div>



{isBest && (

<span className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">

הגבוה ביותר

</span>

)}



</div>




<div className="mt-3 flex justify-between text-sm">


<span>

שווי עתידי

</span>


<b>

₪
{item.result.finalBalance.toLocaleString("he-IL")}

</b>


</div>




<div className="mt-1 flex justify-between text-sm">


<span>

רווח

</span>


<b>

₪
{item.result.growth.toLocaleString("he-IL")}

</b>


</div>



</div>

);


})}



</div>


</div>

);


}