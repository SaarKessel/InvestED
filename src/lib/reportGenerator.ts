import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { generateRoadmap } from "./roadmapEngine";
import { generateRecommendations } from "./recommendationEngine";


export function generateInvestmentReport(result:any){


const doc = new jsPDF();



const createdAt =
new Date().toLocaleDateString();



const initial =
result.scenario?.initialInvestment ?? 0;


const future =
result.projection?.finalBalance ?? 0;


const profit =
future - initial;



const recommendations =
generateRecommendations(result);



const roadmap =
generateRoadmap(result);





doc.setFontSize(22);

doc.text(
"InvestED AI Investment Report",
20,
25
);



doc.setFontSize(11);

doc.text(
`Generated: ${createdAt}`,
20,
35
);



doc.text(
"Personal AI-powered investment analysis",
20,
43
);





autoTable(doc,{

startY:55,

head:[

[
"Financial Metric",
"Value"
]

],

body:[

[
"Initial Investment",
`₪${initial.toLocaleString()}`
],

[
"Future Value",
`₪${future.toLocaleString()}`
],

[
"Expected Profit",
`₪${profit.toLocaleString()}`
]

]

});







doc.text(

"Investor Profile",

20,

130

);



autoTable(doc,{

startY:140,

head:[

[
"Category",
"Value"
]

],

body:[

[
"Investor Type",
result.investor ?? "-"
],

[
"Risk",
result.riskDescription ?? "-"
],

[
"Horizon",
result.horizon ?? "-"
]

]

});







if(result.allocation){


doc.text(

"Portfolio Allocation",

20,

210

);



autoTable(doc,{

startY:220,

head:[

[
"Asset",
"Allocation"
]

],

body:

Object.entries(result.allocation)

.map(([key,value])=>[

key,

String(value)

])


});


}








doc.addPage();



doc.setFontSize(18);

doc.text(

"AI Recommendations",

20,

25

);



autoTable(doc,{

startY:35,

body:

recommendations.map(

(item)=>[item]

)

});







doc.text(

"Financial Roadmap",

20,

140

);



autoTable(doc,{

startY:150,

head:[

[
"Stage",
"Actions"
]

],

body:

roadmap.map(

(stage)=>[

stage.title,

stage.actions.join(", ")

]

)

});







doc.setFontSize(9);


doc.text(

"Disclaimer: InvestED provides educational information only and does not provide personal investment advice.",

20,

285

);







doc.save(

"InvestED-AI-Report.pdf"

);


}
