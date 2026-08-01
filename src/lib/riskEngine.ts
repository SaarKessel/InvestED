import type {
  ProfileFlags,
  RiskDescription,
  InvestorClassification,
  InvestorType,
  InterestArea,
  HorizonBucket,
} from "@/types";


// ------------------------------------------------------------
// Keyword Intelligence Layer
// ------------------------------------------------------------


const RISK_KEYWORDS = {

  very_low:[
    "׳׳ ׳׳•׳”׳‘ ׳¡׳™׳›׳•׳",
    "׳©׳•׳׳¨ ׳¢׳ ׳”׳”׳•׳",
    "׳¡׳•׳׳™׳“׳™",
    "conservative",
    "low risk"
  ],


  moderate:[
    "׳׳׳•׳–׳",
    "׳¡׳™׳›׳•׳ ׳‘׳™׳ ׳•׳ ׳™",
    "moderate",
    "balanced"
  ],


  high:[
  "מוכן לסיכון גבוה",
  "סיכון גבוה",
  "צמיחה",
  "אגרסיבי",
  "growth",
  "high risk"
],


  very_high:[
    "׳¡׳₪׳§׳•׳׳˜׳™׳‘׳™",
    "׳׳¡׳—׳¨ ׳™׳•׳׳™",
    "very aggressive",
    "very high risk"
  ]

} as const;



const HORIZON_KEYWORDS = {

  long:[
    "טווח ארוך",
    "לטווח ארוך",
    "30 שנה",
    "20 שנה",
    "10 שנים",
    "עצמאות כלכלית",
    "פרישה",
    "פנסיה",
    "long term"
  ],

  medium:[
    "5 שנים",
    "בינוני",
    "medium term"
  ],

  short:[
    "שנתיים",
    "שנה",
    "צריך את הכסף בקרוב",
    "טווח קצר",
    "short term"
  ]

} as const;


function containsAny(
  text:string,
  arr:readonly string[]
):boolean {

  return arr.some(
    keyword =>
      text.includes(keyword)
  );

}



// ------------------------------------------------------------
// Extract profile signals from user text
// ------------------------------------------------------------


export function extractProfileFlags(
  rawText:string
):ProfileFlags {


  const text =
    rawText.toLowerCase();



  let riskLevel:
    ProfileFlags["riskLevel"] = null;



  for(
    const level of Object.keys(RISK_KEYWORDS)
  ){

    const keywords =
      RISK_KEYWORDS[
        level as keyof typeof RISK_KEYWORDS
      ];


    if(
      containsAny(
        text,
        keywords
      )
    ){

      riskLevel =
        level as ProfileFlags["riskLevel"];

      break;

    }

  }



  let horizon:
    ProfileFlags["horizon"] = null;



  for(
    const item of Object.keys(HORIZON_KEYWORDS)
  ){

    const keywords =
      HORIZON_KEYWORDS[
        item as keyof typeof HORIZON_KEYWORDS
      ];


    if(
      containsAny(
        text,
        keywords
      )
    ){

      horizon =
        item as ProfileFlags["horizon"];

      break;

    }

  }

  let age:number|null = null;


  const ageMatch =
    text.match(/(\d{2})/);


  if(ageMatch){

    age =
      Number(ageMatch[1]);

  }



  let knowledgeLevel:
    ProfileFlags["knowledgeLevel"] = null;



  if(
    text.includes("׳׳×׳—׳™׳") ||
    text.includes("׳׳™׳ ׳׳™ ׳™׳“׳¢") ||
    text.includes("beginner") || text.includes("אין לי ניסיון") || text.includes("ללא ניסיון") || text.includes("חדש בשוק ההון") || text.includes("מתחיל")
  ){

    knowledgeLevel =
      "beginner";

  }


  if(
    text.includes("׳‘׳™׳ ׳•׳ ׳™") ||
    text.includes("׳‘׳™׳ ׳•׳ ׳™׳×") ||
    text.includes("׳™׳“׳¢ ׳‘׳™׳ ׳•׳ ׳™") ||
    text.includes("some") || text.includes("ידע בינוני") || text.includes("כמה שנים") || text.includes("משקיע כבר") || text.includes("ניסיון בינוני") ||
    text.includes("intermediate")
  ){

    knowledgeLevel =
      "some";

  }


  if(
    text.includes("׳ ׳™׳¡׳™׳•׳") ||
    text.includes("׳׳ ׳•׳¡׳”") ||
    text.includes("experienced") || text.includes("מנוסה") || text.includes("ותיק") || text.includes("10 שנים") || text.includes("עשור")
  ){

    knowledgeLevel =
      "experienced";

  }


const interests: InterestArea[] = [];


if(
  text.includes("טכנולוגיה") ||
  text.includes("tech") ||
  text.includes("technology")
){

  interests.push(
    "טכנולוגיה" as InterestArea
  );

}


if(
  text.includes("פיננסים") ||
  text.includes("finance") ||
  text.includes("bank")
){

  interests.push(
    "פיננסים" as InterestArea
  );

}


if(
  text.includes("אנרגיה") ||
  text.includes("energy")
){

  interests.push(
    "אנרגיה" as InterestArea
  );

}


if(
  text.includes("נדלן") ||
  text.includes("נדל״ן") ||
  text.includes("real estate")
){

  interests.push(
    "נדל״ן" as InterestArea
  );

}


  return {

    rawText,

    age,

    riskLevel,

    horizon,

    knowledgeLevel,

    interests,

    preferences:[],

    goal:null

  };


}



// ------------------------------------------------------------
// Risk Score Engine
// ------------------------------------------------------------


export function computeRiskScore(
  flags:ProfileFlags
):number {


  let score = 5;



  if(flags.riskLevel === "very_low")
    score = 2;



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

  if(
    flags.knowledgeLevel === "experienced"
  ){

    score += 1;

  }



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
      band:"נמוך",
      volatility:"נמוכה",
      psychology:"העדפה ליציבות ושמירה על הון."
    };
  }

  if(score <= 6){
    return {
      band:"בינוני",
      volatility:"בינונית",
      psychology:"שילוב בין צמיחה לניהול סיכון."
    };
  }

  return {
    band:"גבוה",
    volatility:"גבוהה",
    psychology:"מוכנות לתנודתיות עבור צמיחה."
  };

}


// ------------------------------------------------------------
// Investor Classification
// ------------------------------------------------------------


export function classifyInvestor(
  score:number
): InvestorClassification {


  if(score <= 3){

    return {
      type:
        "משקיע שמרני" as InvestorType,

      reason:
        "סיכון נמוך והעדפה ליציבות ושמירה על הון."
    };

  }



  if(score <= 6){

    return {
      type:
        "משקיע מאוזן" as InvestorType,

      reason:
        "איזון בין צמיחה לבין ניהול סיכון."
    };

  }



  return {

    type:
      "משקיע צמיחה" as InvestorType,

    reason:
      "נכונות להתמודד עם תנודתיות עבור פוטנציאל צמיחה."

  };

}


// ------------------------------------------------------------
// Explainability Engine
// ------------------------------------------------------------

export function buildExplainability(
  flags: ProfileFlags,
  classification: InvestorClassification,
  score: number
): string[] {

  const reasons: string[] = [];

  reasons.push(
    `סיווג משקיע: ${classification.type}`
  );

  reasons.push(
    `הסבר: ${classification.reason}`
  );

  reasons.push(
    `ציון סיכון: ${score}/10`
  );

  if(flags.riskLevel){

    reasons.push(
      `העדפת סיכון שזוהתה: ${flags.riskLevel}`
    );

  }

  if(flags.horizon){

    reasons.push(
      `אופק השקעה שזוהה: ${flags.horizon}`
    );

  }

  if(flags.age !== null){

    reasons.push(
      `גיל משתמש: ${flags.age}`
    );

  }

  if(
    flags.interests &&
    flags.interests.length > 0
  ){

    reasons.push(
      `תחומי עניין: ${flags.interests.join(", ")}`
    );

  }

  return reasons;

}

// ------------------------------------------------------------
// Investment Strategy Recommendation Engine
// ------------------------------------------------------------

export function recommendStrategies(
  score: number,
  flags: ProfileFlags
): string[] {

  const strategies: string[] = [];

  if(score <= 3){

    strategies.push(
      "השקעה פסיבית במדדים רחבים",
      "שילוב קרנות אג״ח איכותיות",
      "שמירה על רמת נזילות גבוהה"
    );

  }


  if(score > 3 && score <= 6){

    strategies.push(
      "השקעה פסיבית במדדים",
      "שילוב מניות ואג״ח",
      "פיזור בין שווקים שונים"
    );

  }


  if(score > 6){

    strategies.push(
      "השקעה במדדי מניות",
      "חשיפה לסקטורי צמיחה",
      "השקעה לטווח ארוך"
    );

  }


  if(
    flags.interests.includes("טכנולוגיה" as InterestArea)
  ){

    strategies.push(
      "למידה על תחום הטכנולוגיה והשפעתו על שוק ההון"
    );

  }


  if(
    flags.interests.includes("פיננסים" as InterestArea)
  ){

    strategies.push(
      "מעקב אחר סקטור הפיננסים"
    );

  }


  return strategies;

}


// ------------------------------------------------------------
// Learning Path Generator
// ------------------------------------------------------------
export function generateLearningPath(
  flags: ProfileFlags
): string[] {

  const path: string[] = [];


  if(flags.knowledgeLevel === "beginner"){

    path.push(
      "היכרות עם מניות, אג״ח וקרנות סל",
      "הבנת מושגי סיכון ותשואה",
      "בניית בסיס פיננסי אישי"
    );

  }


  if(flags.knowledgeLevel === "some"){

    path.push(
      "בניית אסטרטגיית השקעה",
      "הקצאת נכסים וניהול תיק",
      "פיזור וניהול סיכונים"
    );

  }


  if(flags.knowledgeLevel === "experienced"){

    path.push(
      "ניתוח מתקדם של תיק השקעות",
      "מדדי ביצוע כמו Sharpe ו-Beta",
      "אופטימיזציה של הקצאת נכסים"
    );

  }


  // במקרה שלא זוהתה רמת ידע
  if(path.length === 0){

    path.push(
      "בסיס פיננסי",
      "היכרות עם שוק ההון",
      "בניית אסטרטגיית השקעה",
      "העמקה בניהול סיכונים"
    );

  }


  return path;

}

// ------------------------------------------------------------
// Portfolio Style Explanation
// ------------------------------------------------------------

export function explainInvestorStyle(
  classification: InvestorClassification
): string {

  switch(classification.type){

    case "משקיע שמרני":

      return "המשקיע מתמקד בשמירה על ההון, יציבות והפחתת תנודתיות.";

    case "משקיע מאוזן":

      return "המשקיע מחפש איזון בין צמיחה לבין ניהול סיכונים.";

    case "משקיע צמיחה":

      return "המשקיע מוכן להתמודד עם תנודתיות גבוהה עבור פוטנציאל תשואה גבוה.";

    default:

      return "סגנון השקעה מאוזן.";

  }

}


// ------------------------------------------------------------
// Horizon Helpers
// ------------------------------------------------------------

export function horizonBucket(
  horizon: ProfileFlags["horizon"]
): HorizonBucket {

  if (horizon === "long") {
    return "long" as HorizonBucket;
  }

  if (horizon === "short") {
    return "short" as HorizonBucket;
  }

  return "medium" as HorizonBucket;
}



export function horizonExplanation(
  horizon: ProfileFlags["horizon"]
): string {

  if (horizon === "long") {
    return "אופק השקעה ארוך מאפשר חשיפה גבוהה יותר לנכסי צמיחה והתמקדות בטווח הארוך.";
  }

  if (horizon === "short") {
    return "אופק השקעה קצר דורש דגש על נזילות, יציבות והפחתת תנודתיות.";
  }

  return "אופק השקעה בינוני מאפשר שילוב בין צמיחה לבין ניהול סיכון.";
}






