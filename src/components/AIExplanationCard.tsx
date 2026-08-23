// ---------------------------------------------------------------------------
// InvestED — AI Explanation Card v1
// Explainable AI Financial Education Component
// ---------------------------------------------------------------------------

import {
  Brain,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  Target
} from "lucide-react";



// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {

  initialInvestment:number;

  monthlyContribution:number;

  years:number;

  annualReturnPct:number;

  assetLabel:string;

  riskProfile?: string | null;

  riskLevel?: string | null;

  goal?:string;

  confidence?:number;

}



// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AIExplanationCard({

  initialInvestment,

  monthlyContribution,

  years,

  annualReturnPct,

  assetLabel,

  riskProfile,

  goal="growth",

  confidence=0

}:Props){



const safeRiskProfile =
  riskProfile ?? "medium";




// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------


function riskLabel(): string {

  if (
    safeRiskProfile === "נמוכה" ||
    safeRiskProfile === "בינונית" ||
    safeRiskProfile === "בינונית-גבוהה" ||
    safeRiskProfile === "גבוהה"
  ) {
    return safeRiskProfile;
  }

  switch (safeRiskProfile) {

    case "low":
      return "נמוכה";

    case "medium":
      return "בינונית";

    case "high":
      return "גבוהה";

    default:
      return "בינונית";

  }

}


function goalLabel() {
  switch (goal) {
    case "retirement":
      return "פרישה מוקדמת";

    case "home":
      return "רכישת דירה";

    case "child":
      return "חיסכון לילדים";

    case "wealth":
    case "financial_independence":
      return "עצמאות כלכלית";

    case "growth":
    default:
      return "בניית הון";
  }
}




const longTerm =
years >= 10;




const initialInvestmentText =
  initialInvestment > 0
    ? `זוהה סכום התחלתי של ${Math.max(0, initialInvestment ?? 0).toLocaleString("he-IL")} ₪`
    : "לא זוהה הון התחלתי";

const monthlyContributionText =
  monthlyContribution > 0
    ? `הפקדה חודשית של ${Math.max(0, monthlyContribution ?? 0).toLocaleString("he-IL")} ₪`
    : "ללא הפקדה חודשית";

const baseDataExplanation =
  `${initialInvestmentText} ו-${monthlyContributionText}.`;

return (

<div
dir="rtl"
className="
rounded-3xl
border
border-indigo-500/30
bg-gradient-to-br
from-indigo-950/40
to-slate-900
p-6
shadow-xl
"
>


<div
className="
flex
items-center
gap-3
mb-5
"
>


<div
className="
rounded-xl
bg-indigo-500/20
p-3
"
>

<Brain
className="
h-6
w-6
text-indigo-300
"
/>

</div>



<div>

<h2
className="
text-2xl
font-bold
"
>

🤖 איך InvestED ניתח את התרחיש

</h2>


<p
className="
text-sm
text-slate-400
mt-1
"
>

Explainable AI Simulation

</p>


</div>


</div>





<div
className="
space-y-4
"
>


<InsightRow

icon={<CheckCircle/>}

title="נתוני בסיס"

text={

baseDataExplanation

}

/>




<InsightRow

icon={<Clock/>}

title="אופק השקעה"

text={

`${years} שנים — ${
longTerm
?
"המערכת מזהה טווח המאפשר להשפעת הזמן והריבית דריבית לבוא לידי ביטוי."
:
"טווח קצר יחסית שבו לתנודתיות השוק יש משמעות גבוהה יותר."
}`

}

/>




<InsightRow

icon={<TrendingUp/>}

title="מסלול שנבחר"

text={

`התרחיש נותח לפי ${assetLabel}
עם תשואה שנתית משוערת של ${annualReturnPct}%.`

}

/>




<InsightRow

icon={<Shield/>}

title="רמת סיכון"

text={

`פרופיל סיכון משוער: ${riskLabel()}.
הסיווג מבוסס על סוג הנכס ואופק ההשקעה.`

}

/>




<InsightRow

icon={<Target/>}

title="מטרת המשתמש"

text={

`המטרה שזוהתה: ${goalLabel()}.`

}

/>


</div>






<div
className="
mt-6
rounded-2xl
bg-black/20
p-4
"
>


<p
className="
text-sm
text-slate-300
"
>

🧠 רמת ביטחון בניתוח:

</p>



<div
className="
mt-3
h-3
rounded-full
bg-slate-700
overflow-hidden
"
>


<div

className="
h-full
rounded-full
bg-indigo-400
"

style={{

width:`${Math.min(confidence,100)}%`

}}

/>


</div>



<p
className="
mt-2
text-sm
font-bold
"
>

{confidence}%

</p>


</div>







<p
className="
mt-5
text-xs
text-slate-500
leading-6
"
>

הדמיה זו מיועדת ללמידה פיננסית בלבד ואינה מהווה ייעוץ השקעות או המלצה לפעולה.

</p>




</div>

);


}



// ---------------------------------------------------------------------------
// Internal UI
// ---------------------------------------------------------------------------


function InsightRow({

icon,

title,

text

}:{

icon:React.ReactNode;

title:string;

text:string;

}){


return (

<div
className="
flex
gap-4
rounded-2xl
bg-white/5
p-4
"
>


<div
className="
text-indigo-300
mt-1
"
>

{icon}

</div>




<div>

<h3
className="
font-bold
"
>

{title}

</h3>




<p
className="
text-sm
text-slate-300
mt-1
leading-6
"
>

{text}

</p>



</div>



</div>

);


}