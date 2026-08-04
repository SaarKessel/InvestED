import type {
  ProfileFlags,
  RiskDescription,
  InvestorClassification,
  InterestArea,
  HorizonBucket,
} from "@/types";


// ------------------------------------------------------------
// Keyword Intelligence Layer
// ------------------------------------------------------------

const RISK_KEYWORDS = {

  very_low: [
    "שמרן",
    "לא אוהב סיכון",
    "שמירת הון",
    "יציבות",
    "conservative"
  ],

  moderate: [
    "מאוזן",
    "בינוני",
    "moderate",
    "סיכון בינוני"
  ],

  high: [
    "מוכן להתמודד עם תנודתיות",
    "סיכון גבוה",
    "אגרסיבי",
    "growth"
  ],

  very_high: [
    "ספקולטיבי",
    "מסחר יומי",
    "very aggressive"
  ]

};


const HORIZON_KEYWORDS = {

  long: [
    "לטווח ארוך",
    "30 שנה",
    "20 שנה",
    "עצמאות כלכלית",
    "פרישה מוקדמת",
    "long term"
  ],

  short: [
    "שנתיים",
    "שנה",
    "טווח קצר",
    "צריך את הכסף בקרוב",
    "short term"
  ]

};


function containsAny(
  text:string,
  arr:string[]
){
  return arr.some(
    keyword => text.includes(keyword)
  );
}


// ------------------------------------------------------------
// Extract profile signals
// ------------------------------------------------------------

export function extractProfileFlags(
  rawText:string
):ProfileFlags {

  const text = rawText.toLowerCase();


  let riskLevel:ProfileFlags["riskLevel"] = null;


  for(const level of Object.keys(RISK_KEYWORDS)){

    if(
      containsAny(
        text,
        RISK_KEYWORDS[level as keyof typeof RISK_KEYWORDS]
      )
    ){

      riskLevel =
        level as ProfileFlags["riskLevel"];

      break;
    }
  }



  let horizon:ProfileFlags["horizon"] = null;


  for(const item of Object.keys(HORIZON_KEYWORDS)){

    if(
      containsAny(
        text,
        HORIZON_KEYWORDS[item as keyof typeof HORIZON_KEYWORDS]
      )
    ){

      horizon =
        item as ProfileFlags["horizon"];

      break;
    }
  }



  let age:number|null = null;

  const ageMatch =
    text.match(/(\d+)\s*(?:בן|בת)/);


  if(ageMatch){
    age = Number(ageMatch[1]);
  }



  const interests:InterestArea[] = [];


  if(text.includes("טכנולוגיה")){
    interests.push("טכנולוגיה");
  }


  if(text.includes("פיננסים")){
    interests.push("פיננסים");
  }


  if(text.includes("בריאות")){
    interests.push("בריאות");
  }


  if(text.includes("אנרגיה")){
    interests.push("אנרגיה");
  }


  if(text.includes("נדלן") || text.includes("נדל\"ן")){
    interests.push("נדל\"ן");
  }



  return {

    rawText,

    age,

    riskLevel,

    horizon,

    knowledgeLevel:null,

    interests,

    preferences:[],

    goal:null
  };

}


// ------------------------------------------------------------
// Risk Score
// ------------------------------------------------------------

export function computeRiskScore(
  flags:ProfileFlags
):number {


  let score = 5;


  if(flags.riskLevel === "very_low")
    score = 2;


  if(flags.riskLevel === "low")
    score = 3;


  if(flags.riskLevel === "moderate")
    score = 5;


  if(flags.riskLevel === "high")
    score = 8;


  if(flags.riskLevel === "very_high")
    score = 9;



  if(flags.horizon === "short")
    score -= 1;


  if(flags.horizon === "long")
    score += 2;



  if(flags.age !== null){

    if(flags.age < 35)
      score += 1;


    if(flags.age >= 60)
      score -= 1;

  }



  if(flags.knowledgeLevel === "experienced")
    score += 1;



  return Math.max(
    1,
    Math.min(
      10,
      Math.round(score)
    )
  );

}


// ------------------------------------------------------------
// Risk Description
// ------------------------------------------------------------

export function riskScoreDescription(
  score:number
):RiskDescription {


  if(score <= 3){

    return {

      band:"שמרני",

      volatility:
        "תנודתיות נמוכה",

      psychology:
        "העדפה ליציבות ושמירה על ההון"

    };

  }


  if(score <= 6){

    return {

      band:"מאוזן",

      volatility:
        "תנודתיות בינונית",

      psychology:
        "שילוב בין צמיחה לניהול סיכון"

    };

  }



  return {

    band:"אגרסיבי",

    volatility:
      "תנודתיות גבוהה",

    psychology:
      "משקיע עם אופק ארוך וסיבולת סיכון גבוהה"

  };

}


// ------------------------------------------------------------
// Horizon
// ------------------------------------------------------------

export function horizonBucket(
  flags:ProfileFlags
):HorizonBucket {


  if(flags.horizon === "short")
    return "קצר";


  if(flags.horizon === "long")
    return "ארוך";


  return "בינוני";

}



export function horizonExplanation(
  bucket:HorizonBucket
):string {


  if(bucket === "קצר")
    return "טווח השקעה קצר";


  if(bucket === "ארוך")
    return "טווח השקעה ארוך";


  return "טווח השקעה בינוני";

}



// ------------------------------------------------------------
// Investor Classification
// ------------------------------------------------------------

export function classifyInvestor(
  _flags:ProfileFlags,
  riskScore:number
):InvestorClassification {


  if(riskScore <= 3){

    return {

      type:"משקיע שמרני",

      reason:
        "רמת סיכון נמוכה והעדפה ליציבות ושמירת הון."

    };

  }



  if(riskScore <= 6){

    return {

      type:"משקיע מאוזן",

      reason:
        "שילוב בין צמיחה לבין ניהול סיכון באמצעות פיזור."

    };

  }



  return {

    type:"משקיע צמיחה",

    reason:
      "אופק השקעה ארוך וסיבולת סיכון גבוהה מאפשרים חשיפה גבוהה יותר לנכסי צמיחה."

  };

}


// ------------------------------------------------------------
// Explainability
// ------------------------------------------------------------

export function buildExplainability(
  flags:ProfileFlags,
  riskScore:number,
  investor:InvestorClassification
){

  const signals:string[] = [];


  signals.push(
    `סיווג משקיע: ${investor.type}`
  );


  signals.push(
    `ציון סיכון: ${riskScore}/10`
  );



  if(flags.riskLevel){

    signals.push(
      `העדפת סיכון: ${flags.riskLevel}`
    );

  }



  if(flags.horizon){

    signals.push(
      `אופק השקעה: ${flags.horizon}`
    );

  }



  if(flags.age){

    signals.push(
      `גיל משתמש: ${flags.age}`
    );

  }



  if(flags.interests.length){

    signals.push(
      `תחומי עניין: ${flags.interests.join(", ")}`
    );

  }



  return {

    signals,

    summary:
      `המערכת סיווגה את המשתמש כ-${investor.type} לפי מאפייני הפרופיל שנמצאו בטקסט.`

  };

}