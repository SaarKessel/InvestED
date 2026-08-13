 // ---------------------------------------------------------------------------
// InvestED - Goal Planning Engine
// ---------------------------------------------------------------------------


export interface GoalAnalysis {

  targetAmount:number;

  currentAmount:number;

  years:number;

  requiredMonthlyContribution:number;

  expectedFinalValue:number;

  progressPercentage:number;

  achievable:boolean;

}

export interface RetirementScenarioAlternative {

  label:string;

  annualReturnPct:number;

  monthlyContribution:number;

  futureValue:number;

  probability:number;

  summary:string;

}

export interface RetirementPlanResult extends GoalAnalysis {

  yearsRemaining:number;

  currentAssets:number;

  monthlyInvestment:number;

  annualReturnPct:number;

  inflationPct:number;

  targetMonthlyIncome:number;

  futureValue:number;

  monthlyIncomeDuringRetirement:number;

  probabilityOfSuccess:number;

  scenarioAlternatives:RetirementScenarioAlternative[];

  timelineVisualization:{
    year:number;
    value:number;
    contributed:number;
  }[];

  recommendations:string[];

  educationalExplanations:string[];

  stressTestSummary:string;

}





export function detectTargetAmount(text:string):number{


const normalized = text
.toLowerCase()
.replace(/,/g,"");



let amount = 0;



const matches = normalized.matchAll(

/(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m)?/g

);



for(const match of matches){


let value = Number(match[1]);



if(isNaN(value)){

continue;

}



if(
match[2]==="אלף" ||
match[2]==="k"
){

value*=1000;

}



if(
match[2]==="מיליון" ||
match[2]==="m"
){

value*=1000000;

}



if(value > amount){

amount=value;

}


}





const millionMatch = normalized.match(

/(\d+(?:\.\d+)?)\s*מיליון/

);



if(millionMatch){

amount =
Number(millionMatch[1]) *
1000000;

}



return Math.round(amount);


}







export function calculateRequiredMonthlyContribution(

targetAmount:number,

currentAmount:number,

years:number,

annualReturnPct:number = 8

):number{


if(years <= 0){

return 0;

}



const monthlyRate =
annualReturnPct / 100 / 12;



const months =
years * 12;




const futureCurrentAmount =

currentAmount *

Math.pow(

1 + monthlyRate,

months

);





const remainingAmount =

Math.max(

targetAmount - futureCurrentAmount,

0

);





if(monthlyRate === 0){

return Math.round(

remainingAmount / months

);

}





const monthlyContribution =

remainingAmount *

monthlyRate /

(

Math.pow(

1 + monthlyRate,

months

)

-1

);





return Math.round(monthlyContribution);


}







export function calculateGoalProgress(

currentAmount:number,

targetAmount:number

):number{


if(targetAmount <= 0){

return 0;

}



return Math.min(

Math.round(

(currentAmount / targetAmount) * 100

),

100

);


}







function calculateFutureValue(

currentAmount:number,
monthlyContribution:number,
years:number,
annualReturnPct:number,
inflationPct:number = 3

){

const monthlyRate = annualReturnPct / 100 / 12;
const months = Math.max(1, years * 12);

let balance = currentAmount;

for(let month = 1; month <= months; month++){

balance = balance * (1 + monthlyRate) + monthlyContribution;

}

const realValue = balance / Math.pow(1 + inflationPct / 100, years);

return {
futureValue: Math.round(balance),
realValue: Math.round(realValue)
};

}


export function buildRetirementPlan(input:{

currentAge:number;
expectedRetirementAge:number;
currentAssets:number;
monthlyInvestment:number;
annualReturnPct:number;
inflationPct:number;
targetMonthlyIncome:number;

}):RetirementPlanResult{

const yearsRemaining = Math.max(
input.expectedRetirementAge - input.currentAge,
1
);

const targetAmount = Math.round(
input.targetMonthlyIncome * 12 / 0.04
);

const requiredMonthlyContribution = calculateRequiredMonthlyContribution(
	targetAmount,
	input.currentAssets,
	yearsRemaining,
	input.annualReturnPct
);

const baseProjection = calculateFutureValue(
input.currentAssets,
input.monthlyInvestment,
yearsRemaining,
input.annualReturnPct,
input.inflationPct
);

const probabilityOfSuccess = Math.min(
99,
Math.max(
45,
Math.round(
(baseProjection.futureValue >= targetAmount ? 78 : 55) +
(input.monthlyInvestment >= requiredMonthlyContribution ? 10 : 0)
)
)
);

const scenarioAlternatives:RetirementScenarioAlternative[] = [

{
label:"מסלול בסיס",
annualReturnPct:input.annualReturnPct,
monthlyContribution:input.monthlyInvestment,
futureValue:baseProjection.futureValue,
probability:probabilityOfSuccess,
summary:"המסלול הבסיסי משקף את ההנחה המרכזית של התוכנית."
},

{
label:"מסלול שמרני",
annualReturnPct:Math.max(4, input.annualReturnPct - 2),
monthlyContribution:Math.max(0, input.monthlyInvestment - 1000),
futureValue:calculateFutureValue(
input.currentAssets,
Math.max(0, input.monthlyInvestment - 1000),
yearsRemaining,
Math.max(4, input.annualReturnPct - 2),
input.inflationPct
).futureValue,
probability:Math.max(40, probabilityOfSuccess - 12),
summary:"תרחיש שמרני מדגים מה קורה כשמצב ההשקעה פחות אופטימי."
},

{
label:"מסלול אגרסיבי",
annualReturnPct:Math.min(12, input.annualReturnPct + 2),
monthlyContribution:input.monthlyInvestment + 1000,
futureValue:calculateFutureValue(
input.currentAssets,
input.monthlyInvestment + 1000,
yearsRemaining,
Math.min(12, input.annualReturnPct + 2),
input.inflationPct
).futureValue,
probability:Math.min(95, probabilityOfSuccess + 10),
summary:"תרחיש אגרסיבי מדגים כיצד הגדלת ההפקדה יכולה לשפר את הסיכוי."
}

];

const timelineVisualization = Array.from({ length: yearsRemaining + 1 }, (_, index) => {

const monthIndex = index * 12;
const projected = calculateFutureValue(
input.currentAssets,
input.monthlyInvestment,
index,
input.annualReturnPct,
input.inflationPct
).futureValue;

return {
year:index,
value:projected,
contributed:Math.round(input.currentAssets + input.monthlyInvestment * monthIndex)
};

});

const recommendations = [

`${Math.max(0, requiredMonthlyContribution - input.monthlyInvestment)} שקל נוספים לחודש יכולים לשפר משמעותית את הסיכוי.`,

"מומלץ לבדוק פיזור בין מניות, אג\"ח וקרנות ניהול סיכון במטרה להעלות יציבות לאורך זמן.",

"בשלב הבא, כדאי לבחון תרחישים נוספים עם עלויות, אינפלציה ותמהיל נכסים."
];

const educationalExplanations = [

"כללי ה-4% כאן משמשים רק כהנחה חינוכית לתכנון פרישה, ולא כייעוץ השקעה.",

"ריבית דריבית היא הכוח המרכזי שמגביר את ערך ההשקעה לאורך זמן.",

"שינוי קטן בהפקדה החודשית, בתשואה או בתקופת ההשקעה עשוי לשנות את תרחיש סוף הדרך משמעותית."
];

return {
	targetAmount,
	currentAmount:input.currentAssets,
	years:yearsRemaining,
	requiredMonthlyContribution,
	expectedFinalValue:baseProjection.futureValue,
	progressPercentage:calculateGoalProgress(input.currentAssets, targetAmount),
	achievable:baseProjection.futureValue >= targetAmount,
	yearsRemaining,
	currentAssets:input.currentAssets,
	monthlyInvestment:input.monthlyInvestment,
	annualReturnPct:input.annualReturnPct,
	inflationPct:input.inflationPct,
	targetMonthlyIncome:input.targetMonthlyIncome,
	futureValue:baseProjection.futureValue,
	monthlyIncomeDuringRetirement:Math.round(baseProjection.futureValue * 0.04 / 12),
	probabilityOfSuccess,
	scenarioAlternatives,
	timelineVisualization,
	recommendations,
	educationalExplanations,
	stressTestSummary:`בתרחיש של תשואה נמוכה יותר, מומלץ לבחון מחדש את ההפקדה החודשית כדי לשמור על תוצר חינוכי עקבי.`
};

}


export function analyzeFinancialGoal(

currentAmount:number,

targetAmount:number,

years:number,

annualReturnPct:number = 8,

monthlyContribution:number = 0

):GoalAnalysis{





const monthlyRequired =

calculateRequiredMonthlyContribution(

targetAmount,

currentAmount,

years,

annualReturnPct

);







const months =
years * 12;



const monthlyRate =
annualReturnPct / 100 / 12;





const futureValue =

currentAmount *

Math.pow(

1 + monthlyRate,

months

)

+

(

monthlyRate === 0

?

monthlyContribution * months

:

monthlyContribution *

(

(

Math.pow(

1 + monthlyRate,

months

)

-1

)

/

monthlyRate

)

);







return {


targetAmount,


currentAmount,


years,


requiredMonthlyContribution:

monthlyRequired,



expectedFinalValue:

Math.round(futureValue),



progressPercentage:

calculateGoalProgress(

currentAmount,

targetAmount

),



achievable:

futureValue >= targetAmount


};


}

