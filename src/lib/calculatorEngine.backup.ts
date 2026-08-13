// ---------------------------------------------------------------------------
// InvestED — Smart Investment Scenario Engine v3
// Production Natural Language Financial Parser
// ---------------------------------------------------------------------------

export interface AssetClassOption {
  key:string;
  label:string;
  annualReturnPct:number;
  keywords:string[];
  blurb:string;
}


export const ASSET_CLASSES:AssetClassOption[]=[

{
key:"apple",
label:"Apple (AAPL)",
annualReturnPct:12,
keywords:["apple","אפל","aapl"],
blurb:"מניית Apple Inc."
},

{
key:"microsoft",
label:"Microsoft (MSFT)",
annualReturnPct:12,
keywords:["microsoft","מיקרוסופט","msft"],
blurb:"מניית Microsoft"
},

{
key:"sp500",
label:"מדד S&P 500",
annualReturnPct:10,
keywords:[
"s&p",
"sp500",
"s&p500",
"סנופי",
"אס אנד פי",
"מדד אמריקאי"
],
blurb:"מדד 500 החברות הגדולות בארה״ב."
},

{
key:"world",
label:"מדד עולמי",
annualReturnPct:8,
keywords:[
"world",
"msci",
"עולמי",
"גלובלי",
"מדד עולם"
],
blurb:"פיזור רחב בין שווקים עולמיים."
},

{
key:"nasdaq",
label:"Nasdaq",
annualReturnPct:12,
keywords:[
"nasdaq",
"נאסדק",
"טכנולוגיה",
"הייטק"
],
blurb:"מדד מוטה חברות טכנולוגיה."
},

{
key:"bonds",
label:"אג״ח ממשלתי",
annualReturnPct:3.5,
keywords:[
"אגח",
"אג״ח",
"חוב",
"סולידי",
"בטוח",
"לא רוצה הפסדים"
],
blurb:"אפיק סולידי."
},

{
key:"balanced",
label:"תיק מאוזן",
annualReturnPct:7,
keywords:[
"מאוזן",
"פיזור",
"קרנות מחקות",
"תיק"
],
blurb:"שילוב מניות ואג״ח."
}

];


// ---------------------------------------------------------------------------
// Models
// ---------------------------------------------------------------------------


import type {
  FinancialScenario
} from "@/types";

export type { FinancialScenario } from "@/types";
export interface ParsedQuery {

age:number|null;

years:number;

monthlyContribution:number;

principal:number;

targetAmount:number|null;

assetClassKey:string;

}


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeText(text:string){

return text
.toLowerCase()
.replace(/,/g,"")
.replace(/\s+/g," ")
.trim();

}

// ---------------------------------------------------------------------------
// Asset Detection
// ---------------------------------------------------------------------------

function detectAsset(text:string){

const lower = normalizeText(text);


for(const asset of ASSET_CLASSES){

if(
asset.keywords.some(
keyword => lower.includes(keyword.toLowerCase())
)
){

return asset.key;

}

}


return "balanced";

}


// ---------------------------------------------------------------------------
// Interest Detection
// ---------------------------------------------------------------------------

function detectInterests(text:string){

const lower = normalizeText(text);

const interests:string[]=[];


const map:[string,string][]=[

["טכנולוגיה","Technology"],
["הייטק","Technology"],
["אנרגיה","Energy"],
["נדלן","Real Estate"],
["נדל״ן","Real Estate"],
["בריאות","Healthcare"],
["פיננסים","Finance"],
["בנקאות","Finance"]

];


for(const [key,value] of map){

if(lower.includes(key)){

interests.push(value);

}

}


return [...new Set(interests)];

}


// ---------------------------------------------------------------------------
// Amount Parsing
// ---------------------------------------------------------------------------

function convertAmount(
value:number,
unit:string
){

const normalized =
unit.toLowerCase();


if(
normalized==="אלף" ||
normalized==="k"
){

return value*1000;

}


if(
normalized==="מיליון" ||
normalized==="m"
){

return value*1000000;

}


return value;

}



function detectInitialInvestment(text:string){

const normalized =
normalizeText(text);



const specialCases=[

{
words:["חצי מיליון","חצי מליון"],
value:500000
},

{
words:["מיליון וחצי","מליון וחצי"],
value:1500000
},

{
words:["רבע מיליון","רבע מליון"],
value:250000
}

];



for(const item of specialCases){

if(
item.words.some(
word=>normalized.includes(word)
)
){

return item.value;

}

}



const patterns=[

/(?:יש לי|חסכתי|השקעתי|השקעתי עד עכשיו|סכום של)\s*(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m)?/i,


/(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m)\s*(?:שקל|ש״ח|₪)?/i,


/(\d+)\s*(?:שקל|ש״ח|₪)\s*(?:להשקיע|שהשקעתי)/i

];



for(const pattern of patterns){

const match =
normalized.match(pattern);


if(match){

return Math.round(
convertAmount(
Number(match[1]),
match[2] ?? ""
)
);

}

}


return 0;

}


// ---------------------------------------------------------------------------
// Monthly Contribution
// ---------------------------------------------------------------------------

function detectMonthlyContribution(text:string){

const normalized =
normalizeText(text);



const patterns=[

/(?:מפקיד|הפקדה חודשית|חיסכון חודשי|מפריש)\s*(?:של)?\s*(\d+)/i,


/(\d+)\s*(?:שקל|ש״ח|₪)?\s*(?:בחודש|לחודש|כל חודש)/i

];



for(const pattern of patterns){

const match =
normalized.match(pattern);


if(match){

return Number(match[1]);

}

}


return 0;

}


// ---------------------------------------------------------------------------
// Age Detection
// ---------------------------------------------------------------------------

function detectAge(text:string){

const match =
text.match(
/(?:אני\s*)?(?:בן|בת)\s*(\d+)/i
);


return match
?
Number(match[1])
:
null;

}

function detectTargetAge(text:string){

  const normalized = normalizeText(text);

  const patterns = [

    /עד\s*גיל\s*(\d+)/i,

    /בגיל\s*(\d+)/i,

    /גיל\s*יעד\s*(\d+)/i,

    /פורש\s*בגיל\s*(\d+)/i

  ];


  for(const pattern of patterns){

    const match = normalized.match(pattern);

    if(match){

      return Number(match[1]);

    }

  }


  return null;

}


// ---------------------------------------------------------------------------
// Years Detection
// ---------------------------------------------------------------------------

function detectYears(
text:string,
age:number|null,
targetAge:number|null
){

const normalized =
normalizeText(text);



const explicit = normalized.match(
    /(?:ל-|למשך|תקופה של)\s*(\d+)\s*(?:שנה|שנים)/i
);



if(explicit){

return Number(explicit[1]);

}



if(
age!==null &&
targetAge!==null
){

return Math.max(
targetAge-age,
1
);

}


// תמיכה במשפט:
// "לפרוש בעוד 15 שנה"

const retirementMatch =
normalized.match(
/בעוד\s*(\d+)\s*(?:שנה|שנים)/
);


if(retirementMatch){

return Number(retirementMatch[1]);

}



return 10;

}

// ---------------------------------------------------------------------------
// Goal Detection
// ---------------------------------------------------------------------------

function detectGoal(text:string){

const lower =
normalizeText(text);


if(
lower.includes("פרישה") ||
lower.includes("עצמאות כלכלית") ||
lower.includes("להפסיק לעבוד") ||
lower.includes("לפרוש")
){

return "retirement";

}


if(
lower.includes("דירה") ||
lower.includes("בית") ||
lower.includes("הון עצמי")
){

return "home";

}


if(
lower.includes("ילד") ||
lower.includes("לימודים")
){

return "child";

}


if(
lower.includes("עושר") ||
lower.includes("לבנות הון") ||
lower.includes("בניית הון") ||
lower.includes("הגדלת הון")
){

return "wealth";

}


return "growth";

}



// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

function calculateConfidence(
investment:number,
monthly:number,
age:number|null,
years:number
){

let score=0;


if(investment>0){

score+=30;

}


if(monthly>0){

score+=20;

}


if(age!==null){

score+=20;

}


if(years>0){

score+=30;

}


return Math.min(score,100);

}



// ---------------------------------------------------------------------------
// Scenario Builder
// ---------------------------------------------------------------------------

export function analyzeFinancialScenario(
text:string
):FinancialScenario{


const currentAge =
detectAge(text);


const targetAge =
detectTargetAge(text);



const years =
detectYears(
text,
currentAge,
targetAge
);



const assetKey =
detectAsset(text);



const asset =
ASSET_CLASSES.find(
a=>a.key===assetKey
)
??
ASSET_CLASSES.find(
a=>a.key==="balanced"
)!;



const initialInvestment =
detectInitialInvestment(text);



const monthlyContribution =
detectMonthlyContribution(text);



const goal =
detectGoal(text);



const targetMonthlyIncome =
null;



return {

initialInvestment,

monthlyContribution,

currentAge,

targetAge,

targetAmount:null,

targetMonthlyIncome,

years,

assetClassKey:
asset.key,

annualReturnPct:
asset.annualReturnPct,

goal,

confidence:
calculateConfidence(
initialInvestment,
monthlyContribution,
currentAge,
years
),

detectedInterests:
detectInterests(text)

};

}



// ---------------------------------------------------------------------------
// Projection Engine
// ---------------------------------------------------------------------------

export interface ProjectionPoint {

year:number;

contributed:number;

balance:number;

}



export interface ProjectionResult {

finalBalance:number;

totalContributed:number;

growth:number;

realValueAfterInflation:number;

series:ProjectionPoint[];

}



export function computeProjection(
principal:number,
monthlyContribution:number,
years:number,
annualReturnPct:number,
inflationPct:number=3
):ProjectionResult{


const monthlyRate =
annualReturnPct / 100 / 12;


const months =
years * 12;



let balance =
principal;


let contributed =
principal;



const series:ProjectionPoint[]=[

{
year:0,
contributed:Math.round(contributed),
balance:Math.round(balance)
}

];



for(
let month=1;
month<=months;
month++
){


balance =
balance*(1+monthlyRate)
+
monthlyContribution;


contributed+=monthlyContribution;



if(month%12===0){

series.push({

year:month/12,

contributed:
Math.round(contributed),

balance:
Math.round(balance)

});

}

}



return {

finalBalance:
Math.round(balance),


totalContributed:
Math.round(contributed),


growth:
Math.round(
balance-contributed
),


realValueAfterInflation:
Math.round(
balance /
Math.pow(
1+inflationPct/100,
years
)
),


series

};

}



// ---------------------------------------------------------------------------
// Goal Planner
// ---------------------------------------------------------------------------

export interface GoalPlanResult {

targetAmount:number;

currentAmount:number;

years:number;

requiredMonthlyContribution:number;

expectedFinalValue:number;

achievable:boolean;

}



export function calculateRequiredMonthlyContribution(
targetAmount:number,
currentAmount:number,
years:number,
annualReturnPct:number
){

if(targetAmount<=currentAmount){

return 0;

}



const monthlyRate =
annualReturnPct/100/12;


const months =
years*12;



const futureCurrent =
currentAmount *
Math.pow(
1+monthlyRate,
months
);



const remaining =
targetAmount-futureCurrent;



if(remaining<=0){

return 0;

}



const payment =
remaining *
monthlyRate /
(
Math.pow(
1+monthlyRate,
months
)-1
);



return Math.round(payment);

}




export function createGoalPlan(
targetAmount:number,
currentAmount:number,
years:number,
annualReturnPct:number
):GoalPlanResult{


const requiredMonthlyContribution =
calculateRequiredMonthlyContribution(
targetAmount,
currentAmount,
years,
annualReturnPct
);



const projection =
computeProjection(
currentAmount,
requiredMonthlyContribution,
years,
annualReturnPct
);



return {

targetAmount,

currentAmount,

years,

requiredMonthlyContribution,

expectedFinalValue:
projection.finalBalance,

achievable:
projection.finalBalance>=targetAmount

};

}



// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const CALCULATOR_PRESETS=[

"אני בן 27, יש לי 100 אלף שקל להשקיע ל-10 שנים במדד S&P 500",

"אני בן 30, מפקיד 2000 שקל בחודש במדד עולמי עד גיל 60",

"יש לי 500 אלף שקל ואני רוצה לפרוש בעוד 20 שנה",

"אני בן 35 ורוצה לבנות הון לטווח ארוך עם פיזור רחב",

"אני חוסך לילד 1000 שקל בחודש עד גיל 18"

];



// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export function parseCalculatorQuery(
rawText:string
):ParsedQuery{


const scenario =
analyzeFinancialScenario(rawText);



return {

age:
scenario.currentAge,

years:
scenario.years,

monthlyContribution:
scenario.monthlyContribution,

principal:
scenario.initialInvestment,

targetAmount:
scenario.targetAmount,

assetClassKey:
scenario.assetClassKey

};

}



// ---------------------------------------------------------------------------
// Debug
// ---------------------------------------------------------------------------

export function debugScenario(text:string){


const scenario =
analyzeFinancialScenario(text);



const projection =
computeProjection(

scenario.initialInvestment,

scenario.monthlyContribution,

scenario.years,

scenario.annualReturnPct

);



return {

input:text,

scenario,

projection

};

}