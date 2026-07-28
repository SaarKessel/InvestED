// ---------------------------------------------------------------------------
// InvestED — Smart Investment Scenario Engine
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
keywords:[
"apple",
"אפל",
"aapl"
],
blurb:"מניית Apple Inc. — חברת טכנולוגיה גלובלית."
},


{
key:"microsoft",
label:"Microsoft (MSFT)",
annualReturnPct:12,
keywords:[
"microsoft",
"מיקרוסופט",
"msft"
],
blurb:"מניית Microsoft — חברת תוכנה ושירותי ענן."
},


{
key:"sp500",
label:"מדד S&P 500",
annualReturnPct:10,
keywords:[
"s&p",
"sp500",
"s&p500",
"snp",
"אס אנד פי",
"מדד אמריקאי"
],
blurb:"מדד הכולל 500 חברות גדולות בארה״ב."
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
"סולידי"
],
blurb:"אפיק סולידי יחסית."
},


{
key:"balanced",
label:"תיק מאוזן",
annualReturnPct:7,
keywords:[
"מאוזן",
"תיק"
],
blurb:"שילוב מניות ואג״ח."
}

];



export interface FinancialScenario {

initialInvestment:number;

monthlyContribution:number;

currentAge:number|null;

targetAge:number|null;

targetAmount:number;

years:number;

assetClassKey:string;

annualReturnPct:number;

goal:string;

}



export interface ParsedQuery {

age:number|null;

years:number;

monthlyContribution:number;

principal:number;

targetAmount:number;

assetClassKey:string;

}



function detectAsset(text:string){

const lower=text.toLowerCase();


for(const asset of ASSET_CLASSES){

if(
asset.keywords.some(
k=>lower.includes(k.toLowerCase())
)
){

return asset.key;

}

}


return "balanced";

}




function detectAmount(text:string){

let amount=0;


const normalized=text
.toLowerCase()
.replace(/,/g,"");


const cleaned=normalized
.replace(
/(?:בן|בת)\s*\d+/g,
""
)
.replace(
/(?:עד גיל|גיל|בגיל)\s*\d+/g,
""
)
.replace(
/(?:מפקיד|משקיע|חיסכון חודשי|הפקדה חודשית)\s*(?:של)?\s*\d+\s*(?:ש"ח|שח|₪|שקל|שקלים)?/g,
""
)
.replace(
/\d+\s*(?:ש"ח|שח|₪|שקל|שקלים)?\s*(?:בחודש|לחודש|כל חודש|חודשי)/g,
""
);


const matches=cleaned.matchAll(
/(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m)?/g
);


for(const match of matches){

let value=Number(match[1]);


if(match[2]==="אלף" || match[2]==="k"){
value*=1000;
}


if(match[2]==="מיליון" || match[2]==="m"){
value*=1000000;
}


amount=Math.max(amount,value);

}


if(normalized.includes("חצי מיליון")){
amount=Math.max(amount,500000);
}


if(normalized.includes("רבע מיליון")){
amount=Math.max(amount,250000);
}


return Math.round(amount);

}

function detectTargetAmount(text:string){

const normalized=text
.toLowerCase()
.replace(/,/g,"");


let amount=0;


const targetMatch=normalized.match(
/(?:להגיע|להגיע ל|יעד|מטרה|רוצה להגיע|צריך להגיע)\s*(?:ל)?\s*(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m)?/
);



if(targetMatch){

amount=Number(targetMatch[1]);


if(
targetMatch[2]==="אלף" ||
targetMatch[2]==="k"
){

amount*=1000;

}


if(
targetMatch[2]==="מיליון" ||
targetMatch[2]==="m"
){

amount*=1000000;

}

}



if(normalized.includes("מיליון")){

amount=Math.max(
amount,
1000000
);

}



if(normalized.includes("חצי מיליון")){

amount=Math.max(
amount,
500000
);

}



if(normalized.includes("רבע מיליון")){

amount=Math.max(
amount,
250000
);

}



return Math.round(amount);

}





function detectMonthly(text:string){

const normalized=text
.toLowerCase()
.replace(/,/g,"");



const match=normalized.match(
/(\d+)\s*(?:ש"ח|שח|₪|שקל|שקלים)?\s*(?:בחודש|לחודש|כל חודש|חודשי)/
);



if(match){

return Number(match[1]);

}



const reverseMatch=normalized.match(
/(?:חיסכון חודשי|הפקדה חודשית|מפקיד|משקיע)\s*(?:של)?\s*(\d+)/
);



if(reverseMatch){

return Number(reverseMatch[1]);

}



return 0;

}





function detectAge(text:string){

const match=text.match(
/(?:בן|בת)\s*(\d+)/
);



return match
?
Number(match[1])
:
null;

}





function detectTargetAge(text:string){

const match=text.match(
/(?:עד גיל|גיל|בגיל)\s*(\d+)/
);



return match
?
Number(match[1])
:
null;

}





function detectGoal(text:string){

const lower=text.toLowerCase();



if(
lower.includes("פרישה") ||
lower.includes("עצמאות כלכלית") ||
lower.includes("להפסיק לעבוד") ||
lower.includes("פנסיה מוקדמת")
){

return "retirement";

}



if(
lower.includes("ילד") ||
lower.includes("ילדים") ||
lower.includes("תינוק") ||
lower.includes("לימודים")
){

return "child";

}



if(
lower.includes("דירה") ||
lower.includes("בית") ||
lower.includes("הון עצמי") ||
lower.includes("משכנתא")
){

return "home";

}



if(
lower.includes("חופש כלכלי") ||
lower.includes("עושר") ||
lower.includes("לבנות הון") ||
lower.includes("להגדיל הון")
){

return "wealth";

}



return "growth";

}





function detectYears(

text:string,

currentAge:number|null,

targetAge:number|null

){


const lower=text.toLowerCase();



const yearsMatch=lower.match(
/(?:ל-?|במשך\s*)?(\d+)\s*(?:שנה|שנים)/
);



if(yearsMatch){

return Number(yearsMatch[1]);

}



if(lower.includes("עשור")){

return 10;

}



if(lower.includes("חמש עשרה")){

return 15;

}



if(
currentAge!==null &&
targetAge!==null
){

return Math.max(
targetAge-currentAge,
1
);

}



return 10;

}

export function analyzeFinancialScenario(

text:string

):FinancialScenario{


const assetKey=detectAsset(text);


const asset=
ASSET_CLASSES.find(
a=>a.key===assetKey
)
??
ASSET_CLASSES[
ASSET_CLASSES.length-1
];


const currentAge=
detectAge(text);


const targetAge=
detectTargetAge(text);


return {

initialInvestment:
detectAmount(text),

monthlyContribution:
detectMonthly(text),

currentAge,

targetAge,

targetAmount:
detectTargetAmount(text),

years:
detectYears(
text,
currentAge,
targetAge
),

assetClassKey:
asset.key,

annualReturnPct:
asset.annualReturnPct,

goal:
detectGoal(text)

};

}





export function parseCalculatorQuery(

rawText:string

):ParsedQuery{


const scenario=
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
// Projection Engine
// ---------------------------------------------------------------------------

export interface ProjectionPoint{

year:number;

contributed:number;

balance:number;

}



export interface ProjectionResult{

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

inflationPct=3

):ProjectionResult{


const monthlyRate=
annualReturnPct/100/12;


const months=
years*12;


let balance=
principal;


let contributed=
principal;


const series:ProjectionPoint[]=[

{

year:0,

contributed:Math.round(contributed),

balance:Math.round(balance)

}

];



for(let i=1;i<=months;i++){

balance=
balance*(1+monthlyRate)
+
monthlyContribution;

contributed+=monthlyContribution;


if(i%12===0){

series.push({

year:i/12,

contributed:Math.round(contributed),

balance:Math.round(balance)

});

}

}



const finalBalance=
Math.round(balance);


return{

finalBalance,

totalContributed:
Math.round(contributed),

growth:
Math.round(
finalBalance-contributed
),

realValueAfterInflation:
Math.round(
finalBalance/
Math.pow(
1+inflationPct/100,
years
)
),

series

};

}





// ---------------------------------------------------------------------------
// Calculator Presets
// ---------------------------------------------------------------------------

export const CALCULATOR_PRESETS=[

"אני בן 27, יש לי 100,000 ש״ח להשקיע ל-10 שנים במדד S&P 500",

"אני בן 30, מפקיד 2,000 ש״ח בחודש במדד עולמי עד גיל 60",

"השקעתי 100,000 ש״ח ל-10 שנים ב-Apple",

"השקעתי 100000 שקל ל-20 שנה ב-Microsoft",

"יש לי 500 אלף שקל להשקיע ל-20 שנה בתיק מאוזן",

"חיסכון חודשי של 1000 ש״ח לילד עד גיל 18",

"אני בן 35 ורוצה לפרוש בגיל 55 עם השקעה במדד S&P 500",

"יש לי 300 אלף שקל ואני רוצה לבנות הון ל-15 שנה"

];