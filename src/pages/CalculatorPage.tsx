 import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Sparkles,
  PiggyBank,
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


import {
  ASSET_CLASSES,
  CALCULATOR_PRESETS,
  parseCalculatorQuery,
  computeProjection,
  type ProjectionResult,
} from "@/lib/calculatorEngine";


export function CalculatorPage() {

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

            מחשבון השקעות חכם בשפה חופשית

          </span>



          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">

            כתבו את הסיטואציה שלכם — קבלו תחזית

          </h1>



          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">

            בלי טפסים מסובכים.
            לדוגמה:
            "השקעתי 100,000 ש״ח ל-10 שנים ב־S&P 500"

          </p>


        </motion.div>



        <GrowthCalculator />



        <DisclaimerBanner className="mt-6"/>


      </section>


    </Layout>

  );

}




function GrowthCalculator(){


const [query,setQuery]=useState("");

const [result,setResult]=useState<ProjectionResult|null>(null);

const [asset,setAsset]=useState<any>(null);



const [detected,setDetected]=useState({

  principal:0,

  years:0,

  monthly:0,

  returnPct:0

});




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



setDetected({

principal:parsed.principal,

years:parsed.years,

monthly:parsed.monthlyContribution,

returnPct:found.annualReturnPct

});



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

className="w-full resize-none rounded-xl border border-border bg-background p-4 text-sm"

placeholder="השקעתי 100,000 ש״ח ל-10 שנים ב־Apple"

/>




<div className="mt-3 flex flex-wrap gap-2">


{

CALCULATOR_PRESETS.map(p=>(


<button

key={p}

onClick={()=>analyze(p)}

className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"

>


{p}


</button>


))

}


</div>




<Button

className="mt-4"

onClick={()=>analyze(query)}

disabled={!query.trim()}

>


<Calculator className="h-4 w-4"/>

נתח את המשפט שלי


</Button>

{
result && asset &&

<div className="mt-6 border-t pt-6">


<div className="rounded-xl bg-muted p-4 text-sm">


<div className="flex items-center gap-2 font-semibold">

<PiggyBank className="h-4 w-4"/>

זיהינו מהמשפט שלך:

</div>



<div className="mt-3 space-y-1">


<p>

נכס:

<b>

{asset.label}

</b>

</p>



<p>

השקעה התחלתית:

<b>

₪{detected.principal.toLocaleString()}

</b>

</p>



<p>

תקופה:

<b>

{detected.years} שנים

</b>

</p>



<p>

תשואה שנתית משוערת:

<b>

{detected.returnPct}%

</b>

</p>


</div>


</div>





<h3 className="mt-6 font-bold">

שווי משוער בסוף התקופה

</h3>



<p className="mt-2 text-4xl font-extrabold text-primary">

₪{result.finalBalance.toLocaleString()}

</p>




<div className="mt-4 space-y-2 text-sm">


<p>

סה"כ הפקדה:

<b>

₪{result.totalContributed.toLocaleString()}

</b>

</p>



<p>

רווח:

<b>

₪{result.growth.toLocaleString()}

</b>

</p>



<p>

שווי ריאלי לאחר אינפלציה:

<b>

₪{result.realValueAfterInflation.toLocaleString()}

</b>

</p>


</div>





<div className="mt-6 h-64">


<ResponsiveContainer width="100%" height="100%">


<AreaChart data={result.series}>


<CartesianGrid strokeDasharray="3 3"/>



<XAxis dataKey="year"/>



<YAxis hide />



<RTooltip />



<Area

type="monotone"

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