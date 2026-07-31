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
    "׳׳•׳›׳ ׳׳”׳×׳׳•׳“׳“ ׳¢׳ ׳×׳ ׳•׳“׳×׳™׳•׳×",
    "׳¦׳׳™׳—׳”",
    "growth",
    "high risk",
    "׳׳’׳¨׳¡׳™׳‘׳™"
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
    "׳˜׳•׳•׳— ׳׳¨׳•׳",
    "׳׳˜׳•׳•׳— ׳׳¨׳•׳",
    "30 ׳©׳ ׳”",
    "20 ׳©׳ ׳”",
    "10 ׳©׳ ׳™׳",
    "׳¢׳¦׳׳׳•׳× ׳›׳׳›׳׳™׳×",
    "׳₪׳¨׳™׳©׳”",
    "׳₪׳ ׳¡׳™׳”",
    "long term"
  ],


  medium:[
    "5 ׳©׳ ׳™׳",
    "׳‘׳™׳ ׳•׳ ׳™",
    "medium term"
  ],


  short:[
    "׳©׳ ׳×׳™׳™׳",
    "׳©׳ ׳”",
    "׳¦׳¨׳™׳ ׳׳× ׳”׳›׳¡׳£ ׳‘׳§׳¨׳•׳‘",
    "׳‘׳˜׳•׳•׳— ׳”׳§׳¦׳¨",
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
    text.includes("beginner")
  ){

    knowledgeLevel =
      "beginner";

  }


  if(
    text.includes("׳‘׳™׳ ׳•׳ ׳™") ||
    text.includes("׳‘׳™׳ ׳•׳ ׳™׳×") ||
    text.includes("׳™׳“׳¢ ׳‘׳™׳ ׳•׳ ׳™") ||
    text.includes("some") ||
    text.includes("intermediate")
  ){

    knowledgeLevel =
      "some";

  }


  if(
    text.includes("׳ ׳™׳¡׳™׳•׳") ||
    text.includes("׳׳ ׳•׳¡׳”") ||
    text.includes("experienced")
  ){

    knowledgeLevel =
      "experienced";

  }



  const interests:InterestArea[] = [];



  if(
    text.includes("׳˜׳›׳ ׳•׳׳•׳’׳™׳”") ||
    text.includes("tech")
  ){

    interests.push(
      "׳˜׳›׳ ׳•׳׳•׳’׳™׳”" as InterestArea
    );

  }



  if(
    text.includes("׳₪׳™׳ ׳ ׳¡׳™׳") ||
    text.includes("finance")
  ){

    interests.push(
      "׳₪׳™׳ ׳ ׳¡׳™׳" as InterestArea
    );

  }



  if(
    text.includes("׳׳ ׳¨׳’׳™׳”") ||
    text.includes("energy")
  ){

    interests.push(
      "׳׳ ׳¨׳’׳™׳”" as InterestArea
    );

  }



  if(
    text.includes("׳ ׳“׳׳") ||
    text.includes("׳ ׳“׳\"׳") ||
    text.includes("real estate")
  ){

    interests.push(
      "׳ ׳“׳\"׳" as InterestArea
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
  flags:ProfileFlags,
  classification:InvestorClassification,
  score:number
):string[] {


  const reasons:string[] = [];



  reasons.push(
    `׳¡׳™׳•׳•׳’ ׳׳©׳§׳™׳¢: ${classification}`
  );


  reasons.push(
    `׳¦׳™׳•׳ ׳¡׳™׳›׳•׳: ${score}/10`
  );



  if(flags.riskLevel){

    reasons.push(
      `׳”׳¢׳“׳₪׳× ׳¡׳™׳›׳•׳ ׳©׳–׳•׳”׳×׳”: ${flags.riskLevel}`
    );

  }



  if(flags.horizon){

    reasons.push(
      `׳׳•׳₪׳§ ׳”׳©׳§׳¢׳” ׳©׳–׳•׳”׳”: ${flags.horizon}`
    );

  }



  if(flags.age){

    reasons.push(
      `׳’׳™׳ ׳׳©׳×׳׳©: ${flags.age}`
    );

  }



  if(
    flags.interests &&
    flags.interests.length > 0
  ){

    reasons.push(
      `׳×׳—׳•׳׳™ ׳¢׳ ׳™׳™׳: ${flags.interests.join(", ")}`
    );

  }



  return reasons;

}


// ------------------------------------------------------------
// Investment Strategy Recommendation Engine
// ------------------------------------------------------------


export function recommendStrategies(
  score:number,
  flags:ProfileFlags
):string[] {


  const strategies:string[] = [];


  // Conservative profile

  if(score <= 3){

    strategies.push(
      "׳”׳©׳§׳¢׳” ׳₪׳¡׳™׳‘׳™׳× ׳‘׳׳“׳“׳™׳ ׳¨׳—׳‘׳™׳",
      "׳§׳¨׳ ׳•׳× ׳׳’׳´׳— ׳׳™׳›׳•׳×׳™׳•׳×",
      "׳©׳׳™׳¨׳” ׳¢׳ ׳ ׳–׳™׳׳•׳× ׳’׳‘׳•׳”׳”"
    );

  }



  // Balanced profile

  if(score > 3 && score <= 6){

    strategies.push(
      "׳”׳©׳§׳¢׳” ׳₪׳¡׳™׳‘׳™׳× ׳‘׳׳“׳“׳™׳",
      "׳©׳™׳׳•׳‘ ׳׳ ׳™׳•׳× ׳•׳׳’׳´׳—",
      "׳₪׳™׳–׳•׳¨ ׳‘׳™׳ ׳©׳•׳•׳§׳™׳ ׳©׳•׳ ׳™׳"
    );

  }



  // Growth profile

  if(score > 6){

    strategies.push(
      "׳”׳©׳§׳¢׳” ׳‘׳׳“׳“׳™ ׳׳ ׳™׳•׳×",
      "׳—׳©׳™׳₪׳” ׳׳¡׳§׳˜׳•׳¨׳™ ׳¦׳׳™׳—׳”",
      "׳”׳©׳§׳¢׳” ׳׳˜׳•׳•׳— ׳׳¨׳•׳"
    );

  }



  // Interest based adjustment


  if(
    flags.interests.includes(
      "׳˜׳›׳ ׳•׳׳•׳’׳™׳”" as InterestArea
    )
  ){

    strategies.push(
      "׳—׳©׳™׳₪׳” ׳׳™׳׳•׳“׳™׳× ׳׳×׳—׳•׳ ׳”׳˜׳›׳ ׳•׳׳•׳’׳™׳”"
    );

  }



  if(
    flags.interests.includes(
      "׳₪׳™׳ ׳ ׳¡׳™׳" as InterestArea
    )
  ){

    strategies.push(
      "׳׳¢׳§׳‘ ׳׳—׳¨ ׳¡׳§׳˜׳•׳¨ ׳₪׳™׳ ׳ ׳¡׳™"
    );

  }



  return strategies;

}





// ------------------------------------------------------------
// Learning Path Generator
// ------------------------------------------------------------


export function generateLearningPath(
  flags:ProfileFlags
):string[] {


  const path:string[] = [];



  if(
    flags.knowledgeLevel === "beginner"
  ){

    path.push(
      "׳”׳™׳›׳¨׳•׳× ׳¢׳ ׳׳ ׳™׳•׳×, ׳׳’׳´׳— ׳•׳§׳¨׳ ׳•׳× ׳¡׳",
      "׳”׳‘׳ ׳× ׳׳•׳©׳’׳™ ׳¡׳™׳›׳•׳ ׳•׳×׳©׳•׳׳”",
      "׳‘׳ ׳™׳™׳× ׳‘׳¡׳™׳¡ ׳₪׳™׳ ׳ ׳¡׳™"
    );

  }



  if(
    flags.knowledgeLevel === "some"
  ){

    path.push(
      "׳‘׳ ׳™׳™׳× ׳׳¡׳˜׳¨׳˜׳’׳™׳™׳× ׳”׳©׳§׳¢׳”",
      "׳”׳§׳¦׳׳× ׳ ׳›׳¡׳™׳",
      "׳₪׳™׳–׳•׳¨ ׳•׳ ׳™׳”׳•׳ ׳¡׳™׳›׳•׳ ׳™׳"
    );

  }



  if(
    flags.knowledgeLevel === "experienced"
  ){

    path.push(
      "׳ ׳™׳×׳•׳— ׳׳×׳§׳“׳ ׳©׳ ׳×׳™׳§ ׳”׳©׳§׳¢׳•׳×",
      "׳׳“׳“׳™ ׳‘׳™׳¦׳•׳¢ ׳›׳׳• Sharpe ׳•-Beta",
      "׳׳•׳₪׳˜׳™׳׳™׳–׳¦׳™׳™׳× ׳×׳™׳§"
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