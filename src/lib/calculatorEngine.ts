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
"נאסד״ק"
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

interface SpecialMoneyPhrase {

words:string[];
value:number;

}

const SPECIAL_MONEY_PHRASES:SpecialMoneyPhrase[] = [

{
words:["חצי מיליון","חצי מליון","half a million","half million"],
value:500000
},

{
words:["מיליון וחצי","מליון וחצי","one and a half million","1.5 million"],
value:1500000
},

{
words:["רבע מיליון","רבע מליון","quarter million","0.25 million"],
value:250000
},

{
words:["שני מיליון","שני מליון","two million"],
value:2000000
}

];

function findSpecialMoneyPhrase(text:string){

const normalized = normalizeText(text);

for(const item of SPECIAL_MONEY_PHRASES){

if(
item.words.some(
word => normalized.includes(word)
)
){

return item.value;

}

}

return null;

}

function parseCurrencyValue(
value:string,
unit:string=""
){

const normalized = unit.toLowerCase();
let amount = Number(value.replace(/,/g,""));

if(!Number.isFinite(amount)){

return 0;

}

if(
normalized.includes("אלף") ||
normalized.includes("k") ||
normalized.includes("thousand")
){

amount *= 1000;

}

if(
normalized.includes("מיליון") ||
normalized.includes("m") ||
normalized.includes("million")
){

amount *= 1000000;

}

return Math.round(amount);

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

function detectInitialInvestment(text:string){

const normalized =
normalizeText(text);

const specialAmount =
findSpecialMoneyPhrase(text);

if(specialAmount){

return specialAmount;

}

const patterns=[

/(?:יש לי|חסכתי|השקעתי|השקעתי עד עכשיו|סכום של|i have|i saved|i invested)\s*(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m|thousand|million)?/i,


/(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m|thousand|million)\s*(?:שקל|ש״ח|₪|usd|dollars)?/i,


/(\d+)\s*(?:שקל|ש״ח|₪|usd|dollars)\s*(?:להשקיע|שהשקעתי|i invest|i saved|that i invested)/i

];



for(const pattern of patterns){

const match =
normalized.match(pattern);


if(match){

return parseCurrencyValue(
match[1],
match[2] ?? ""
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


// ---------------------------------------------------------------------------
// Special Hebrew amount phrases used in monthly contribution context
// ---------------------------------------------------------------------------

const special =
findSpecialMoneyPhrase(normalized);

if(
special !== null &&
/(?:בחודש|לחודש|כל חודש|monthly|per month)/i.test(normalized)
){

return special;

}


// ---------------------------------------------------------------------------
// Standard monthly amount parser
// ---------------------------------------------------------------------------

const patterns=[

/(?:מפקיד|הפקדה חודשית|חיסכון חודשי|מפריש|monthly contribution|monthly deposit|investing|depositing|contributing|save)\s*(?:של)?\s*(\d+(?:\.\d+)?)\s*(אלף|מיליון|מליון|k|m|thousand|million)?/i,


/(\d+(?:\.\d+)?)\s*(אלף|מיליון|מליון|k|m|thousand|million)?\s*(?:שקל|ש״ח|₪|usd|dollars)?\s*(?:בחודש|לחודש|כל חודש|per month|monthly)/i,


/(?:monthly|per month)\s*(?:i invest|i save|i contribute|contribute|deposit)\s*(\d+(?:\.\d+)?)\s*(אלף|מיליון|מליון|k|m|thousand|million)?/i,


/(?:invest|save|contribute|deposit)\s*(\d+(?:\.\d+)?)\s*(אלף|מיליון|מליון|k|m|thousand|million)?\s*(?:monthly|per month)/i

];


for(const pattern of patterns){

const match =
normalized.match(pattern);


if(match){

return parseCurrencyValue(
match[1],
match[2] ?? ""
);

}

}


return 0;

}


// ---------------------------------------------------------------------------
// Age Detection
// ---------------------------------------------------------------------------

function detectAge(text:string){

const normalized = normalizeText(text);

const patterns=[

/(?:אני\s*)?(?:בן|בת)\s*(\d+)/i,

/(?:i am|i'm)\s*(\d+)/i,

/(?:age)\s*(\d+)/i

];

for(const pattern of patterns){

const match = normalized.match(pattern);

if(match){

return Number(match[1]);

}

}

return null;

}

function detectTargetAmount(text:string){

const normalized = normalizeText(text);

if (normalized.includes("להגיע לחצי מיליון")) {
  return 500000;
}

if (normalized.includes("להגיע לחצי מליון")) {
  return 500000;
}

if (normalized.includes("להגיע למיליון וחצי")) {
  return 1500000;
}

if (normalized.includes("להגיע למליון וחצי")) {
  return 1500000;
}


// ---------------------------------------------------------------------------
// Special Hebrew / English target amounts
// ---------------------------------------------------------------------------

const specialTargetPatterns:[RegExp,number][] = [

[/\bלהגיע\s+ל?חצי\s+מיליון\b/i, 500000],
[/\bלחסוך\s+חצי\s+מיליון\b/i, 500000],
[/\bמטרה\s+של\s+חצי\s+מיליון\b/i, 500000],

[/\bלהגיע\s+ל?מיליון\s+וחצי\b/i, 1500000],
[/\bלחסוך\s+מיליון\s+וחצי\b/i, 1500000],
[/\bמטרה\s+של\s+מיליון\s+וחצי\b/i, 1500000],

[/\bלהגיע\s+ל?חצי\s+מליון\b/i, 500000],
[/\bלהגיע\s+ל?רבע\s+מיליון\b/i, 250000],
[/\bלהגיע\s+ל?רבע\s+מליון\b/i, 250000],
[/\bלהגיע\s+ל?שני\s+מיליון\b/i, 2000000],

[/\bto\s+reach\s+half\s+a\s+million\b/i, 500000],
[/\bto\s+reach\s+half\s+million\b/i, 500000],
[/\bto\s+reach\s+one\s+and\s+a\s+half\s+million\b/i, 1500000],
[/\bto\s+reach\s+1\.5\s+million\b/i, 1500000],

];

for(const [pattern,value] of specialTargetPatterns){

if(pattern.test(normalized)){

return value;

}

}


// ---------------------------------------------------------------------------
// Standard numeric target amounts
// ---------------------------------------------------------------------------

const patterns=[

/(?:want to retire with|retire with|to save|to reach|goal of|target of|חסוך|לחסוך|להגיע|לעבור|מטרה של)\s*ל?\s*(\d+(?:\.\d+)?)\s*(אלף|מיליון|מליון|k|m|thousand|million)?/i,

/(\d+(?:\.\d+)?)\s*(אלף|מיליון|מליון|k|m|thousand|million)\s*(?:שקל|ש״ח|₪|usd|dollars)?\s*(?:לצורך|כדי|כדי לחסוך|כדי להגיע|goal|target)/i

];


for(const pattern of patterns){

const match =
normalized.match(pattern);


if(match){

return parseCurrencyValue(
match[1],
match[2] ?? ""
);

}

}


return null;

}


function detectTargetAge(text:string){

  const normalized = normalizeText(text);

  const patterns = [

    /עד\s*גיל\s*(\d+)/i,

    /בגיל\s*(\d+)/i,

    /גיל\s*יעד\s*(\d+)/i,

    /פורש\s*בגיל\s*(\d+)/i,

    /retire at\s*(\d+)/i

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
    /(?:ל-|למשך|תקופה של|for|over)\s*(\d+)\s*(?:שנה|שנים|year|years)/i
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


const retirementMatch =
normalized.match(
/(?:בעוד|in)\s*(\d+)\s*(?:שנה|שנים|year|years)/i
);


if(retirementMatch){

return Number(retirementMatch[1]);

}


const yearsAsFuture =
normalized.match(
/(?:\b|\s)(\d+)\s*(?:שנה|שנים|year|years)\s*(?:לעתיד|ahead)/i
);

if(yearsAsFuture){

return Number(yearsAsFuture[1]);

}


return 10;

}

// ---------------------------------------------------------------------------
// Goal Detection
// ---------------------------------------------------------------------------

function detectGoal(
text:string,
currentAge:number|null,
targetAge:number|null
){

const lower =
normalizeText(text);

if(
currentAge!==null &&
targetAge!==null &&
targetAge-currentAge >= 5
){

return "retirement";

}

if(
lower.includes("פרישה") ||
lower.includes("עצמאות כלכלית") ||
lower.includes("להפסיק לעבוד") ||
lower.includes("לפרוש") ||
lower.includes("retire") ||
lower.includes("retirement") ||
lower.includes("financial independence") ||
lower.includes("חסוך מיליון") ||
lower.includes("לחסוך")
){

return "retirement";

}


if(
lower.includes("דירה") ||
lower.includes("בית") ||
lower.includes("הון עצמי") ||
lower.includes("house") ||
lower.includes("home purchase")
){

return "home";

}


if(
lower.includes("ילד") ||
lower.includes("לימודים") ||
lower.includes("child") ||
lower.includes("education")
){

return "child";

}


if(
lower.includes("עושר") ||
lower.includes("לבנות הון") ||
lower.includes("בניית הון") ||
lower.includes("הגדלת הון") ||
lower.includes("wealth")
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



const targetAmount =
detectTargetAmount(text);



const goal =
detectGoal(
text,
currentAge,
targetAge
);



return {

initialInvestment,

monthlyContribution,

currentAge,

targetAge,

targetAmount,

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