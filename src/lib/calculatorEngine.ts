// ---------------------------------------------------------------------------
// InvestED — Smart Financial Scenario Engine v9
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
      "חשיפה גבוהה לחברות טכנולוגיה."
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
      "יציבות",
      "בטוח"
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
      "תיק",
      "השקעה כללית"
    ],
    description:
      "שילוב בין מספר סוגי נכסים."
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

  targetMonthlyIncome:number|null;

  assetClassKey:string;

}


// ---------------------------------------------------------------------------
// Text Helpers
// ---------------------------------------------------------------------------

function normalizeText(text:string):string {

  return text
    .toLowerCase()
    .replace(/,/g,"")
    .replace(/₪/g,"")
    .replace(/\s+/g," ")
    .trim();

}


// ---------------------------------------------------------------------------
// Asset Detection
// ---------------------------------------------------------------------------

function detectAssetClass(
  text:string
):string {

  const normalized = normalizeText(text)
    .toLowerCase();

  // S&P 500
  if(
    normalized.includes("s&p") ||
    normalized.includes("sp500") ||
    normalized.includes("s and p") ||
    normalized.includes("אס אנד פי") ||
    normalized.includes("אס אנד פי 500")
  ){
    return "sp500";
  }

  // Nasdaq - require an explicit Nasdaq reference.
  // Do NOT classify generic "technology" as Nasdaq.
  if(
    normalized.includes("nasdaq") ||
    normalized.includes("נאסדק") ||
    normalized.includes("נאסד״ק") ||
    normalized.includes("נאסדק 100") ||
    normalized.includes("נאסד״ק 100")
  ){
    return "nasdaq";
  }

  // Bonds
  if(
    normalized.includes("אגח") ||
    normalized.includes("אג״ח") ||
    normalized.includes("bonds") ||
    normalized.includes("bond")
  ){
    return "bonds";
  }

  // World / global
  if(
    normalized.includes("world") ||
    normalized.includes("msci world") ||
    normalized.includes("עולמי") ||
    normalized.includes("גלובלי")
  ){
    return "world";
  }

  // Balanced is the safe default.
  return "balanced";
}



// ---------------------------------------------------------------------------
// Amount Parser
// ---------------------------------------------------------------------------

function parseAmount(
  value:number,
  unit:string
):number {

  const normalized = unit
    .toLowerCase()
    .trim();

  if(
    normalized === "k" ||
    normalized === "אלף"
  ){
    return value * 1000;
  }

  if(
    normalized === "m" ||
    normalized === "million" ||
    normalized === "מיליון" ||
    normalized === "מליון"
  ){
    return value * 1000000;
  }

  return value;
}



// ---------------------------------------------------------------------------
// Advanced Amount Detection v9
// ---------------------------------------------------------------------------

function detectAmount(text:string):number {

  const normalized = normalizeText(text)
    .replace(/,/g, "");

  // Hebrew natural-language amounts
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
    normalized.includes("שני מיליון") ||
    normalized.includes("שני מליון")
  ){
    return 2000000;
  }

  if(
    normalized.includes("רבע מיליון") ||
    normalized.includes("רבע מליון")
  ){
    return 250000;
  }

  // English natural-language amounts
  const englishMillion =
    normalized.match(/(\d+(?:\.\d+)?)\s*million\b/i);

  if(englishMillion){
    return Math.round(Number(englishMillion[1]) * 1000000);
  }

  // Numeric amounts with units
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(מיליון|מליון|million)/i,
    /(\d+(?:\.\d+)?)\s*(m)\b/i,
    /(\d+(?:\.\d+)?)\s*(k)\b/i,
    /(\d+(?:\.\d+)?)\s*(אלף)/i,
    /(\d{1,3}(?:,\d{3})+)/,
    /(\d{5,})/
  ];

  for(const pattern of patterns){

    const match = normalized.match(pattern);

    if(match){

      return Math.round(
        parseAmount(
          Number(match[1].replace(/,/g, "")),
          match[2] ?? ""
        )
      );
    }
  }

  return 0;
}



// ---------------------------------------------------------------------------
// Initial Investment Detection FIXED
// ---------------------------------------------------------------------------

function detectInitialAmount(
  text:string
):number {

  const normalized = normalizeText(text);

  const hasInitialCapital =
    normalized.includes("יש לי") ||
    normalized.includes("יש ברשותי") ||
    normalized.includes("ברשותי") ||
    normalized.includes("הון") ||
    normalized.includes("השקעתי") ||
    normalized.includes("מחזיק") ||
    normalized.includes("קיים לי");

  const onlyMonthlyContext =
    normalized.includes("בחודש") ||
    normalized.includes("לחודש") ||
    normalized.includes("כל חודש") ||
    normalized.includes("מפקיד") ||
    normalized.includes("חוסך") ||
    normalized.includes("מפריש");

  if(
    onlyMonthlyContext &&
    !hasInitialCapital
  ){
    return 0;
  }

  if(
    hasInitialCapital ||
    normalized.includes("חצי מיליון") ||
    normalized.includes("חצי מליון") ||
    normalized.includes("מיליון וחצי") ||
    normalized.includes("מליון וחצי") ||
    normalized.includes("רבע מיליון") ||
    normalized.includes("רבע מליון")
  ){
    return detectAmount(text);
  }

  return 0;
}
// ---------------------------------------------------------------------------
// Monthly Contribution Detection
// ---------------------------------------------------------------------------

function detectMonthlyContribution(
  text:string
):number {

  const normalized =
    normalizeText(text);

  const patterns = [

    // Hebrew: 10,000 שקל בחודש / 10000 בחודש
    /(\d[\d,]*(?:\.\d+)?)\s*(?:שקל|₪)?\s*(?:בחודש|לחודש|כל חודש)/i,

    // Hebrew with amount unit: 150K בחודש / 150 אלף בחודש
    /(\d+(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)\s*(?:שקל|₪)?\s*(?:בחודש|לחודש|כל חודש)/i,

    // English: 10k per month / 10,000 per month
    /(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:per month|monthly|a month)/i,

    // English verb forms: invest 10000 monthly / contribute 10k per month
    /(?:invest|contribute|deposit|save)\s+(\d[\d,]*(?:\.\d+)?)\s*(k|m)?\s*(?:per month|monthly|a month)?/i,

    // Hebrew verbs: מפקיד 10,000 / חוסך 10k / מפריש 5 אלף
    /(?:מפקיד|מוסיף|מפריש|חוסך)\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m|אלף|מיליון|מליון)?/i
  ];

  for(const pattern of patterns){

    const match =
      normalized.match(pattern);

    if(match){

      const value =
        Number(
          String(match[1]).replace(/,/g, "")
        );

      const unit =
        match[2] ?? "";

      return Math.round(
        parseAmount(value, unit)
      );

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


  return match
    ? Number(match[1])
    : null;

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
// Years Detection FIXED
// ---------------------------------------------------------------------------

function detectYears(
  text:string,
  age:number|null,
  targetAge:number|null
):number {

  const normalized =
    normalizeText(text);

  // Hebrew future period
  const futureMatch =
    normalized.match(
      /בעוד\s*(\d+)\s*(?:שנה|שנים)/i
    );

  if(futureMatch){
    return Number(futureMatch[1]);
  }

  // Hebrew explicit duration
  const explicitMatch =
    normalized.match(
      /(?:למשך|תקופה של|ל-?|ל)\s*(\d+)\s*(?:שנה|שנים)/i
    );

  if(explicitMatch){
    return Number(explicitMatch[1]);
  }

  // English explicit duration:
  // for 15 years
  // over 15 years
  // for a period of 15 years
  // 15 years
  const englishExplicitMatch =
    normalized.match(
      /(?:for|over|during|within|period of)\s*(?:a\s+)?(?:period\s+of\s*)?(\d+)\s*years?/i
    );

  if(englishExplicitMatch){
    return Number(englishExplicitMatch[1]);
  }

  // Generic English year expression
  const englishSimpleMatch =
    normalized.match(
      /(\d+)\s*years?/i
    );

  if(englishSimpleMatch){
    return Number(englishSimpleMatch[1]);
  }

  // Generic Hebrew year expression
  const simpleMatch =
    normalized.match(
      /(\d+)\s*(?:שנה|שנים)/i
    );

  if(simpleMatch){
    return Number(simpleMatch[1]);
  }

  // Calculate years from current age to target age
  if(
    age !== null &&
    targetAge !== null
  ){
    return Math.max(
      targetAge - age,
      1
    );
  }

  // Default planning horizon
  return 10;
}

// ---------------------------------------------------------------------------
// Target Amount Detection FIXED
// ---------------------------------------------------------------------------

function detectTargetAmount(
  text:string
):number|null {

  const normalized = normalizeText(text)
    .replace(/,/g, "");

  // Natural-language Hebrew targets
  if(
    normalized.includes("להגיע לחצי מיליון") ||
    normalized.includes("יעד של חצי מיליון") ||
    normalized.includes("מטרה של חצי מיליון")
  ){
    return 500000;
  }

  if(
    normalized.includes("להגיע למיליון וחצי") ||
    normalized.includes("להגיע למליון וחצי") ||
    normalized.includes("יעד של מיליון וחצי") ||
    normalized.includes("מטרה של מיליון וחצי")
  ){
    return 1500000;
  }

  // English target phrases
  const englishMillion =
    normalized.match(
      /(?:retire|reach|goal|with)\s+(?:with\s+)?(\d+(?:\.\d+)?)\s*million\b/i
    );

  if(englishMillion){
    return Math.round(
      Number(englishMillion[1]) * 1000000
    );
  }

  const englishNumeric =
    normalized.match(
      /(?:retire|reach|goal|with)\s+(?:with\s+)?(\d+(?:\.\d+)?)\s*(k|m)\b/i
    );

  if(englishNumeric){
    return parseAmount(
      Number(englishNumeric[1]),
      englishNumeric[2]
    );
  }

  const targetPatterns = [

    /להגיע\s*(?:ל)?\s*(\d+(?:\.\d+)?)\s*(מיליון|מליון|אלף|m|k)?/i,

    /יעד\s*(?:של)?\s*(\d+(?:\.\d+)?)\s*(מיליון|מליון|אלף|m|k)?/i,

    /מטרה\s*(?:של)?\s*(\d+(?:\.\d+)?)\s*(מיליון|מליון|אלף|m|k)?/i
  ];

  for(const pattern of targetPatterns){

    const match = normalized.match(pattern);

    if(match){

      return parseAmount(
        Number(match[1]),
        match[2] ?? ""
      );
    }
  }

  return null;
}


// ---------------------------------------------------------------------------
// Retirement Monthly Income Detection
// ---------------------------------------------------------------------------

function detectTargetMonthlyIncome(
  text:string
):number|null {

  const normalized =
    normalizeText(text);

  // Only activate this parser when the scenario
  // clearly refers to retirement / financial independence.
  const retirementContext =
    normalized.includes("פרישה") ||
    normalized.includes("לפרוש") ||
    normalized.includes("פורש") ||
    normalized.includes("חופש כלכלי") ||
    normalized.includes("עצמאות כלכלית") ||
    normalized.includes("retire") ||
    normalized.includes("retirement");

  if(!retirementContext){
    return null;
  }


  // Examples:
  // 15 אלף בחודש בפרישה
  // 15000 בחודש בפרישה
  // הכנסה של 12000 בפרישה
  // רוצה 10K בחודש בפרישה
  // 15,000 ₪ בחודש

  const patterns = [

    /(?:הכנסה|להכנסה|הכנסה חודשית|לקבל|לקבל\s+בחודש|רוצה)\s*(?:של\s*)?(\d+(?:\.\d+)?)\s*(אלף|k|מיליון|מליון)?\s*(?:₪|שקל)?\s*(?:בחודש|לחודש)/,

    /(\d+(?:\.\d+)?)\s*(אלף|k|מיליון|מליון)\s*(?:₪|שקל)?\s*(?:בחודש|לחודש)/,

    /(\d{4,})\s*(?:₪|שקל)?\s*(?:בחודש|לחודש)/,

    /(?:בחודש|לחודש)\s*(?:של\s*)?(\d+(?:\.\d+)?)\s*(אלף|k|מיליון|מליון)?/
  ];


  for(const pattern of patterns){

    const match =
      normalized.match(pattern);

    if(!match){
      continue;
    }

    const value =
      Number(
        match[1].replace(/,/g, "")
      );

    if(!Number.isFinite(value) || value <= 0){
      continue;
    }

    const unit =
      match[2] ?? "";

    return Math.round(
      parseAmount(
        value,
        unit
      )
    );

  }


  return null;

}


// ---------------------------------------------------------------------------
// Goal Detection
// ---------------------------------------------------------------------------

function detectGoal(
  text:string
):string {

  const normalized = normalizeText(text);

  if(
    normalized.includes("פרישה") ||
    normalized.includes("לפרוש") ||
    normalized.includes("פורש") ||
    normalized.includes("חופש כלכלי") ||
    normalized.includes("עצמאות כלכלית") ||
    normalized.includes("retire") ||
    normalized.includes("retirement") ||
    normalized.includes("עד גיל")
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
    normalized.includes("ילדים") ||
    normalized.includes("לימודים")
  ){
    return "child";
  }

  return "growth";
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


  if(assetClassKey==="bonds"){

    return "low";

  }



  if(assetClassKey==="balanced"){

    return "medium";

  }



  if(
    assetClassKey==="sp500" ||
    assetClassKey==="nasdaq" ||
    assetClassKey==="world"
  ){

    if(years >= 15){

      return "high";

    }


    return "medium";

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

  years:number,

  asset:string

):number {


  let score = 0;



  if(investment > 0){

    score += 25;

  }



  if(monthly > 0){

    score += 20;

  }



  if(age !== null){

    score += 15;

  }



  if(years > 0){

    score += 25;

  }



  if(asset){

    score += 15;

  }



  return Math.min(
    score,
    100
  );

}

// ---------------------------------------------------------------------------
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


  const targetMonthlyIncome =
    detectTargetMonthlyIncome(text);



  return {


    initialInvestment,


    monthlyContribution,


    currentAge,


    targetAge,


    targetAmount,

    targetMonthlyIncome,


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
        years,
        asset.key
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



// ---------------------------------------------------------------------------
// Compute Projection
// ---------------------------------------------------------------------------

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



    if(
      month % 12 === 0
    ){

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
      scenario.assetClassKey,



    targetMonthlyIncome:
      scenario.targetMonthlyIncome


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
// Goal Planner Engine
// ---------------------------------------------------------------------------

export function calculateRequiredMonthlyContribution(

  targetAmount:number,

  initialInvestment:number,

  years:number,

  annualReturnPct:number

):number {



  const monthlyRate =
    annualReturnPct / 100 / 12;



  const months =
    years * 12;



  if(months <= 0){

    return 0;

  }



  const futureInitial =

    initialInvestment *

    Math.pow(
      1 + monthlyRate,
      months
    );



  const remaining =

    targetAmount -
    futureInitial;



  if(remaining <= 0){

    return 0;

  }



  const monthly =

    remaining *

    monthlyRate /

    (
      Math.pow(
        1 + monthlyRate,
        months
      )
      -
      1
    );



  return Math.round(monthly);

}



// ---------------------------------------------------------------------------
// Calculator Presets
// ---------------------------------------------------------------------------

export const CALCULATOR_PRESETS = [


  "אני בן 27, יש לי 100 אלף שקל להשקיע ל-10 שנים במדד S&P 500",


  "אני בן 30, מפקיד 2000 שקל בחודש במדד עולמי עד גיל 60",


  "יש לי חצי מיליון ואני רוצה לפרוש בעוד 20 שנה",


  "אני בן 35 ורוצה לבנות הון לטווח ארוך",


  "אני חוסך לילד 1000 שקל בחודש עד גיל 18",


  "יש לי 300 אלף להשקיע ל-15 שנה ואני מוסיף 2000 שקל בחודש במדד S&P 500"

];
