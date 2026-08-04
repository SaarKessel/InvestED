// ---------------------------------------------------------------------------
// InvestED — Smart Financial Scenario Engine v6
// Educational Financial Simulation Engine
// ---------------------------------------------------------------------------

import type {
  FinancialScenario
} from "@/types";


export type {
  FinancialScenario
} from "@/types";



// ---------------------------------------------------------------------------
// Asset Classes
// ---------------------------------------------------------------------------

export interface AssetClassOption {

  key:string;

  label:string;

  expectedReturnPct:number;

  annualReturnPct:number;

  keywords:string[];

  description:string;

}



export const ASSET_CLASSES:AssetClassOption[] = [

  {
    key:"sp500",
    label:"מדד S&P 500",
    expectedReturnPct:10,
    annualReturnPct:10,
    keywords:[
      "s&p",
      "sp500",
      "s&p500",
      "סנופי",
      "אס אנד פי"
    ],
    description:
      "מדד רחב הכולל חברות גדולות בארה״ב."
  },


  {
    key:"world",
    label:"מדד עולמי",
    expectedReturnPct:8,
    annualReturnPct:8,
    keywords:[
      "world",
      "msci",
      "עולמי",
      "גלובלי"
    ],
    description:
      "פיזור בין שווקים בינלאומיים."
  },


  {
    key:"nasdaq",
    label:"Nasdaq",
    expectedReturnPct:11,
    annualReturnPct:11,
    keywords:[
      "nasdaq",
      "נאסדק",
      "טכנולוגיה",
      "הייטק"
    ],
    description:
      "מדד עם משקל גבוה לחברות טכנולוגיה."
  },


  {
    key:"bonds",
    label:"אג״ח",
    expectedReturnPct:3,
    annualReturnPct:3,
    keywords:[
      "אגח",
      "אג״ח",
      "סולידי",
      "יציבות"
    ],
    description:
      "אפיק בעל תנודתיות נמוכה יחסית."
  },


  {
    key:"balanced",
    label:"תיק מאוזן",
    expectedReturnPct:7,
    annualReturnPct:7,
    keywords:[
      "מאוזן",
      "פיזור",
      "תיק"
    ],
    description:
      "שילוב חינוכי בין מספר סוגי נכסים."
  }

];




// ---------------------------------------------------------------------------
// Parsed Query
// ---------------------------------------------------------------------------

export interface ParsedQuery {

  age:number|null;

  years:number;

  monthlyContribution:number;

  principal:number;

  targetAmount:number|null;

  assetClassKey:string;

}



// ---------------------------------------------------------------------------
// Text Helpers
// ---------------------------------------------------------------------------

function normalizeText(
  text:string
):string {

  return text
    .toLowerCase()
    .replace(/,/g,"")
    .replace(/\s+/g," ")
    .trim();

}




// ---------------------------------------------------------------------------
// Asset Detection
// ---------------------------------------------------------------------------

function detectAssetClass(
  text:string
):string {


  const normalized =
    normalizeText(text);



  for(const asset of ASSET_CLASSES){

    if(
      asset.keywords.some(
        keyword =>
          normalized.includes(
            keyword.toLowerCase()
          )
      )
    ){

      return asset.key;

    }

  }



  return "balanced";

}




// ---------------------------------------------------------------------------
// Amount Parser
// ---------------------------------------------------------------------------

function parseAmount(
  value:number,
  unit:string
):number {


  const normalizedUnit =
    unit.toLowerCase();



  if(
    normalizedUnit === "k" ||
    normalizedUnit === "אלף"
  ){

    return value * 1000;

  }



  if(
    normalizedUnit === "m" ||
    normalizedUnit === "מיליון" ||
    normalizedUnit === "מליון"
  ){

    return value * 1000000;

  }



  return value;

}




// ---------------------------------------------------------------------------
// Smart Amount Detection
// ---------------------------------------------------------------------------

function detectAmount(
  text:string
):number {


  const normalized =
    normalizeText(text);



  if(
    normalized.includes("חצי מיליון") ||
    normalized.includes("חצי מליון")
  ){

    return 500000;

  }



  if(
    normalized.includes("מיליון וחצי") ||
    normalized.includes("מליון וחצי")
  ){

    return 1500000;

  }



  if(
    normalized.includes("רבע מיליון") ||
    normalized.includes("רבע מליון")
  ){

    return 250000;

  }



  const patterns = [

    /(\d+(?:\.\d+)?)\s*(מיליון|מליון)/i,

    /(\d+(?:\.\d+)?)\s*(m)/i,

    /(\d+(?:\.\d+)?)\s*(k)/i,

    /(\d+(?:\.\d+)?)\s*(אלף)/i,

    /(\d+)\s*(?:שקל|₪)/i

  ];



  for(const pattern of patterns){

    const match =
      normalized.match(pattern);



    if(match){

      return Math.round(
        parseAmount(
          Number(match[1]),
          match[2] ?? ""
        )
      );

    }

  }



  const rawNumber =
    normalized.match(
      /\b\d{5,}\b/
    );



  if(rawNumber){

    return Number(rawNumber[0]);

  }



  return 0;

}



// המשך בחלק 2/3// ---------------------------------------------------------------------------
// Initial Amount
// ---------------------------------------------------------------------------

function detectInitialAmount(
  text:string
):number {

  return detectAmount(text);

}



// ---------------------------------------------------------------------------
// Target Amount Detection
// ---------------------------------------------------------------------------

function detectTargetAmount(
  text:string
):number|null {


  const normalized =
    normalizeText(text);



  const keywords = [

    "יעד",
    "להגיע",
    "רוצה להגיע",
    "מטרה",
    "לבנות הון",
    "עצמאות כלכלית",
    "פרישה"

  ];



  const hasTarget =
    keywords.some(
      keyword =>
        normalized.includes(keyword)
    );



  if(!hasTarget){

    return null;

  }



  const amount =
    detectAmount(normalized);



  return amount > 0
    ? amount
    : null;

}




// ---------------------------------------------------------------------------
// Monthly Contribution
// ---------------------------------------------------------------------------

function detectMonthlyContribution(
  text:string
):number {


  const normalized =
    normalizeText(text);



  const patterns = [

    /(\d+(?:\.\d+)?)\s*(?:שקל|₪)?\s*(?:בחודש|לחודש|כל חודש)/i,

    /(?:מפקיד|מפריש|חוסך)\s*(?:של)?\s*(\d+)/i

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

function detectAge(
  text:string
):number|null {


  const match =
    text.match(
      /(?:אני\s*)?(?:בן|בת)\s*(\d+)/i
    );



  if(match){

    return Number(match[1]);

  }



  return null;

}




// ---------------------------------------------------------------------------
// Target Age Detection
// ---------------------------------------------------------------------------

function detectTargetAge(
  text:string
):number|null {


  const normalized =
    normalizeText(text);



  const patterns = [

    /עד\s*גיל\s*(\d+)/i,

    /בגיל\s*(\d+)/i,

    /פורש\s*בגיל\s*(\d+)/i

  ];



  for(const pattern of patterns){

    const match =
      normalized.match(pattern);



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
):number {


  const normalized =
    normalizeText(text);



  const explicit =
    normalized.match(
      /(?:למשך|תקופה של|ל-)\s*(\d+)\s*(?:שנה|שנים)/i
    );



  if(explicit){

    return Number(explicit[1]);

  }



  if(
    age !== null &&
    targetAge !== null
  ){

    return Math.max(
      targetAge - age,
      1
    );

  }



  const future =
    normalized.match(
      /בעוד\s*(\d+)\s*(?:שנה|שנים)/i
    );



  if(future){

    return Number(future[1]);

  }



  return 10;

}





// ---------------------------------------------------------------------------
// Goal Detection
// ---------------------------------------------------------------------------

function detectGoal(
  text:string
):string {


  const normalized =
    normalizeText(text);



  if(

    normalized.includes("פרישה") ||
    normalized.includes("עצמאות כלכלית") ||
    normalized.includes("לפרוש") ||
    normalized.includes("חופש כלכלי")

  ){

    return "retirement";

  }



  if(

    normalized.includes("דירה") ||
    normalized.includes("בית") ||
    normalized.includes("הון עצמי")

  ){

    return "home";

  }



  if(

    normalized.includes("ילד") ||
    normalized.includes("לימודים")

  ){

    return "child";

  }



  if(

    normalized.includes("צמיחה") ||
    normalized.includes("הון") ||
    normalized.includes("השקעה")

  ){

    return "growth";

  }



  return "wealth";

}





// ---------------------------------------------------------------------------
// Risk Profile
// ---------------------------------------------------------------------------

export type RiskProfile =
  | "low"
  | "medium"
  | "high";




function detectRiskProfile(
  assetClassKey:string,
  years:number
):RiskProfile {


  if(
    assetClassKey === "bonds"
  ){

    return "low";

  }



  if(

    assetClassKey === "nasdaq" ||
    years >= 20

  ){

    return "high";

  }



  return "medium";

}





// ---------------------------------------------------------------------------
// Confidence Engine
// ---------------------------------------------------------------------------

function calculateConfidence(

  investment:number,

  monthly:number,

  age:number|null,

  years:number

):number {


  let score = 0;



  if(investment > 0){

    score += 30;

  }



  if(monthly > 0){

    score += 20;

  }



  if(age !== null){

    score += 20;

  }



  if(years > 0){

    score += 30;

  }



  return Math.min(
    score,
    100
  );

}



// המשך בחלק 3/3// ---------------------------------------------------------------------------
// Scenario Builder
// ---------------------------------------------------------------------------

export function analyzeFinancialScenario(
  text:string
):FinancialScenario {


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
    detectAssetClass(text);



  const asset =
    ASSET_CLASSES.find(
      item =>
        item.key === assetKey
    )
    ??
    ASSET_CLASSES.find(
      item =>
        item.key === "balanced"
    )!;



  const initialInvestment =
    detectInitialAmount(text);



  const monthlyContribution =
    detectMonthlyContribution(text);



  const targetAmount =
    detectTargetAmount(text);




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
      asset.expectedReturnPct,


    goal:
      detectGoal(text),



    riskProfile:
      detectRiskProfile(
        asset.key,
        years
      ),



    confidence:
      calculateConfidence(
        initialInvestment,
        monthlyContribution,
        currentAge,
        years
      ),



    detectedInterests:[]

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

  inflationPct:number = 3

):ProjectionResult {


  const monthlyRate =
    annualReturnPct / 100 / 12;



  const months =
    years * 12;



  let balance =
    principal;



  let contributed =
    principal;



  const series:ProjectionPoint[] = [

    {

      year:0,

      contributed:
        Math.round(contributed),

      balance:
        Math.round(balance)

    }

  ];





  for(
    let month = 1;
    month <= months;
    month++
  ){


    balance =
      balance *
      (1 + monthlyRate)
      +
      monthlyContribution;



    contributed +=
      monthlyContribution;




    if(month % 12 === 0){

      series.push({

        year:
          month / 12,


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
        balance - contributed
      ),



    realValueAfterInflation:
      Math.round(

        balance /

        Math.pow(
          1 + inflationPct / 100,
          years
        )

      ),



    series

  };

}




// ---------------------------------------------------------------------------
// Parser API
// ---------------------------------------------------------------------------

export function parseCalculatorQuery(
  rawText:string
):ParsedQuery {


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
// Debug Helper
// ---------------------------------------------------------------------------

export function debugScenario(
  text:string
){


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





// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export const CALCULATOR_PRESETS = [

  "אני בן 27, יש לי 100 אלף שקל להשקיע ל-10 שנים במדד S&P 500",

  "אני בן 30, מפקיד 2000 שקל בחודש במדד עולמי עד גיל 60",

  "יש לי חצי מיליון שקל ואני רוצה לפרוש בעוד 20 שנה",

  "אני בן 35 ורוצה לבנות הון לטווח ארוך",

  "אני חוסך לילד 1000 שקל בחודש עד גיל 18"

];

