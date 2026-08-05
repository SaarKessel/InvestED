import type { AIInsight } from "@/lib/aiExplanationEngine";


interface Props {

  insight: AIInsight;

}



export function AIInsightCard({
  insight
}: Props){


return (

<div

className="
bg-[#0B1628]
border
border-[#1E3A5F]
rounded-3xl
p-6
"

>


<h2

className="
text-2xl
font-bold
mb-5
"

>

🧠 ניתוח AI של InvestED

</h2>




<div

className="
space-y-4
"

>


<div>

<p className="text-slate-400 text-sm">

תרחיש

</p>


<p className="text-white font-bold">

{insight.headline}

</p>

</div>





<div>

<p className="text-slate-400 text-sm">

רמת סיכון

</p>


<p className="text-xl font-bold">

{insight.riskEmoji}

{" "}

{insight.riskLevel}

</p>

</div>






<div

className="
bg-[#050B16]
rounded-2xl
p-4
"

>

<p className="text-slate-300 leading-7">

{insight.horizonInsight}

</p>

</div>






<div

className="
bg-[#050B16]
rounded-2xl
p-4
"

>

<p className="text-slate-300 leading-7 whitespace-pre-line">

{insight.growthInsight}

</p>

</div>






<div

className="
text-emerald-400
font-bold
"

>

✅ {insight.recommendation}

</div>



</div>


</div>

);


}