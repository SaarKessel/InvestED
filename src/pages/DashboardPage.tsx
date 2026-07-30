import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAnalysis } from "../context/AnalysisContext";

import { InvestmentGrowthChart } from "../components/InvestmentGrowthChart";
import { InvestmentInsightCard } from "../components/InvestmentInsightCard";

import { ProfileSummaryCards } from "../components/dashboard/ProfileSummaryCards";
import { WealthBreakdownCard } from "../components/dashboard/WealthBreakdownCard";
import { PortfolioAllocationCard } from "../components/dashboard/PortfolioAllocationCard";
import { FinancialRoadmapCard } from "../components/dashboard/FinancialRoadmapCard";
import { ExplainableAICard } from "../components/dashboard/ExplainableAiCard";
import { DownloadReportCard } from "../components/dashboard/DownloadReportCard";
import { AIChatCard } from "../components/dashboard/AIChatCard";
import { ScenarioHistoryCard } from "../components/dashboard/ScenarioHistoryCard";

import { LanguageToggle } from "../components/common/LanguageToggle";
import { UserMenu } from "../components/common/UserMenu";

import { useLanguage } from "../hooks/useLanguage";
import { useAnalysisStorage } from "../hooks/useAnalysisStorage";
import { useScenarioHistory } from "../hooks/useScenarioHistory";

import { generateRecommendations } from "../lib/recommendationEngine";
import { generateRoadmap } from "../lib/roadmapEngine";


export function DashboardPage() {


const { t } = useTranslation();


const { language,setLanguage } =
useLanguage();


const { result, reset } =
useAnalysis();


const navigate =
useNavigate();



const { saveAnalysis } =
useAnalysisStorage();



const {
scenarios,
saveScenario,
deleteScenario
}=useScenarioHistory();




if(result){

saveAnalysis(result);

saveScenario(result);

}



if(!result){

return (

<div className="flex min-h-screen items-center justify-center">

<div className="text-center">

<h2 className="text-2xl font-bold">

{t("no_analysis")}

</h2>


<button

onClick={()=>navigate("/start")}

className="mt-5 rounded-xl bg-blue-600 px-6 py-3 text-white"

>

{t("create_new_scenario")}

</button>


</div>

</div>

);

}




const recommendations =
generateRecommendations(result);



const roadmap =
generateRoadmap(result);



const initialInvestment =
result.scenario.initialInvestment;



const futureValue =
result.projection.finalBalance;



const profit =
futureValue-initialInvestment;




return (

<div className="space-y-8 p-6">


<div className="flex items-center justify-between">


<motion.div

initial={{opacity:0,y:20}}

animate={{opacity:1,y:0}}

>


<h1 className="text-4xl font-bold">

{t("dashboard_title")}

</h1>


<p className="mt-2 text-gray-500">

{t("dashboard_subtitle")}

</p>


</motion.div>


<div className="flex gap-3 items-center">


<LanguageToggle

language={language}

setLanguage={setLanguage}

/>


<UserMenu />


</div>


</div>





<div className="grid grid-cols-1 gap-5 lg:grid-cols-3">


<div className="rounded-2xl bg-white p-6 shadow">

<p className="text-gray-500">

{t("initial_investment")}

</p>


<h2 className="text-3xl font-bold">

₪{initialInvestment.toLocaleString()}

</h2>

</div>



<div className="rounded-2xl bg-white p-6 shadow">

<p className="text-gray-500">

{t("future_value")}

</p>


<h2 className="text-3xl font-bold text-green-600">

₪{futureValue.toLocaleString()}

</h2>

</div>



<div className="rounded-2xl bg-white p-6 shadow">

<p className="text-gray-500">

{t("expected_profit")}

</p>


<h2 className="text-3xl font-bold">

₪{profit.toLocaleString()}

</h2>

</div>


</div>





<div className="rounded-2xl bg-white p-6 shadow">


<h2 className="mb-5 text-xl font-bold">

{t("investor_profile")}

</h2>


<ProfileSummaryCards

investor={result.investor}

riskDescription={result.riskDescription}

horizon={result.horizon}

/>


</div>




<WealthBreakdownCard result={result}/>



<PortfolioAllocationCard

allocation={result.allocation}

/>



<ExplainableAICard result={result}/>




<div className="rounded-2xl bg-white p-6 shadow">


<h2 className="mb-4 text-xl font-bold">

🤖 {t("smart_recommendations")}

</h2>


<ul className="list-disc pl-5">

{

recommendations.map(

(item,index)=>(

<li key={index}>

{item}

</li>

)

)

}

</ul>


</div>




<AIChatCard result={result}/>



<FinancialRoadmapCard stages={roadmap}/>




<div className="rounded-2xl bg-white p-6 shadow">


<h2 className="mb-5 text-xl font-bold">

{t("growth_chart")}

</h2>


<InvestmentGrowthChart

data={result.projection.series}

/>


</div>




<InvestmentInsightCard result={result}/>



<DownloadReportCard result={result}/>



<ScenarioHistoryCard

scenarios={scenarios}

onDelete={deleteScenario}

/>



<button

onClick={reset}

className="rounded-xl border px-5 py-3"

>

{t("reset")}

</button>


</div>

);


}
