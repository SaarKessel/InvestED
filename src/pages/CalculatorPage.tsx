import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Sparkles,
  TrendingUp,
  Home,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
  CartesianGrid,
} from "recharts";

import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { Card, CardContent, Button } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

import {
  ASSET_CLASSES,
  CALCULATOR_PRESETS,
  parseCalculatorQuery,
  computeProjection,
  type ProjectionResult,
} from "@/lib/calculatorEngine";

import {
  LOAN_PRESETS,
  parseLoanQuery,
  computeSchpitzer,
  type AmortizationResult,
} from "@/lib/loanEngine";


type Mode = "growth" | "loan";


export function CalculatorPage() {

  const [mode,setMode] = useState<Mode>("loan");


  return (
    <Layout>

      <section className="container max-w-3xl py-16 md:py-24">


        <motion.div
          initial={{opacity:0,y:12}}
          animate={{opacity:1,y:0}}
          transition={{duration:0.5}}
          className="text-center"
        >

          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">

            <Sparkles className="h-3.5 w-3.5 text-primary"/>

            מחשבון חכם בשפה חופשית

          </span>


          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">
            כתבו את הסיטואציה שלכם — קבלו תשובה
          </h1>


          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            בלי טפסים מסובכים. לדוגמה:
            "השקעתי 100,000 ש״ח ל-10 שנים ב-Apple"
          </p>


        </motion.div>



        <div className="mx-auto mt-8 flex w-fit rounded-xl border border-border bg-muted/30 p-1">


          <button
            onClick={()=>setMode("loan")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold",
              mode==="loan"
              ?"bg-primary text-primary-foreground"
              :"text-muted-foreground"
            )}
          >

            <Home className="h-4 w-4"/>
            הלוואה / משכנתא

          </button>



          <button
            onClick={()=>setMode("growth")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold",
              mode==="growth"
              ?"bg-primary text-primary-foreground"
              :"text-muted-foreground"
            )}
          >

            <TrendingUp className="h-4 w-4"/>
            צמיחת חיסכון

          </button>


        </div>



        {
          mode==="loan"
          ?
          <LoanCalculator/>
          :
          <GrowthCalculator/>
        }



        <DisclaimerBanner className="mt-6"/>


      </section>


    </Layout>
  );

}




function LoanCalculator(){

const [query,setQuery]=useState("");
const [result,setResult]=useState<AmortizationResult|null>(null);


const analyze=(text:string)=>{

setQuery(text);

const p=parseLoanQuery(text);

setResult(
computeSchpitzer(
p.loanAmount,
p.annualRatePct,
p.years
)
);

};


return (

<Card className="mt-6">

<CardContent className="pt-6">


<textarea

value={query}

onChange={(e)=>setQuery(e.target.value)}

rows={3}

className="w-full rounded-xl border p-4"

placeholder="לקחתי משכנתא ל-20 שנה בריבית 4.5% בשווי 800 אלף"

/>


<div className="mt-3 flex flex-wrap gap-2">


{
LOAN_PRESETS.map(p=>(

<button

key={p}

onClick={()=>analyze(p)}

className="rounded-full border px-3 py-1 text-xs"

>

{p}

</button>

))
}


</div>



<Button

className="mt-4"

onClick={()=>analyze(query)}

>

<Calculator className="h-4 w-4"/>

נתח את המשפט שלי

</Button>



{
result &&

<div className="mt-6 border-t pt-6">


<p>
החזר חודשי:
<b>
₪{result.firstMonthlyPayment.toLocaleString()}
</b>
</p>


<p>
סה"כ החזר:
<b>
₪{result.totalRepayment.toLocaleString()}
</b>
</p>


<p>
סה"כ ריבית:
<b>
₪{result.totalInterest.toLocaleString()}
</b>
</p>


</div>

}


</CardContent>

</Card>

);


}




function GrowthCalculator(){


const [query,setQuery]=useState("");

const [result,setResult]=useState<ProjectionResult|null>(null);

const [asset,setAsset]=useState<any>(null);



const analyze=(text:string)=>{


setQuery(text);


const parsed=parseCalculatorQuery(text);


const found =
ASSET_CLASSES.find(
a=>a.key===parsed.assetClassKey
)
??
ASSET_CLASSES[ASSET_CLASSES.length-1];


setAsset(found);


setResult(
computeProjection(
parsed.principal,
parsed.monthlyContribution,
parsed.years,
found.annualReturnPct
)
);


};



return (

<Card className="mt-6">

<CardContent className="pt-6">


<textarea

value={query}

onChange={(e)=>setQuery(e.target.value)}

rows={3}

className="w-full rounded-xl border p-4"

placeholder="השקעתי 100,000 ש״ח ל-10 שנים ב-Apple"

/>



<div className="mt-3 flex flex-wrap gap-2">

{
CALCULATOR_PRESETS.map(p=>(

<button

key={p}

onClick={()=>analyze(p)}

className="rounded-full border px-3 py-1 text-xs"

>

{p}

</button>

))

}

</div>



<Button

className="mt-4"

onClick={()=>analyze(query)}

>

<Calculator/>

נתח את המשפט שלי

</Button>




{
result && asset &&

<div className="mt-6">


<h3 className="font-bold">
שווי משוער בסוף התקופה
</h3>


<p className="text-3xl font-bold text-primary">

₪{result.finalBalance.toLocaleString()}

</p>



<p>
סה"כ הפקדה:
₪{result.totalContributed.toLocaleString()}
</p>


<p>
רווח:
₪{result.growth.toLocaleString()}
</p>



<div className="h-56 mt-5">

<ResponsiveContainer width="100%" height="100%">

<AreaChart data={result.series}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="year"/>

<YAxis hide/>

<RTooltip/>

<Area
dataKey="balance"
stroke="#22b17d"
fill="#22b17d"
/>


</AreaChart>

</ResponsiveContainer>

</div>



<div className="mt-5 rounded-lg bg-muted p-3 text-sm">

<b>{asset.label}</b>

<br/>

{asset.blurb}

</div>



</div>

}


</CardContent>

</Card>

);


}