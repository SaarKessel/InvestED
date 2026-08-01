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

  very_low:[
    "שמרן",
    "לא אוהב סיכון",
    "שמירת הון",
    "יציבות",
    "conservative"
  ],


  moderate:[
    "מאוזן",
    "בינוני",
    "moderate",
    "סיכון בינוני"
  ],


  high:[
    "מוכן להתמודד עם תנודתיות",
    "סיכון גבוה",
    "אגרסיבי",
    "growth"
  ],


  very_high:[
    "ספקולטיבי",
    "מסחר יומי",
    "very aggressive"
  ]

};



const HORIZON_KEYWORDS = {


 long:[
   "לטווח ארוך",
   "30 שנה",
   "20 שנה",
   "עצמאות כלכלית",
   "פרישה מוקדמת",
   "long term"
 ],


 short:[
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

    if(
      containsAny(
        text,
        RISK_KEYWORDS[
          level as keyof typeof RISK_KEYWORDS
        ]
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

    if(
      containsAny(
        text,
        HORIZON_KEYWORDS[
          item as keyof typeof HORIZON_KEYWORDS
        ]
      )
    ){

      horizon =
        item as ProfileFlags["horizon"];

      break;

    }

  }



  let age:number|null = null;



  const ageMatch =
    text.match(/בן\s+(\d+)/);



  if(ageMatch){

    age =
      Number(ageMatch[1]);

  }




  const interests:InterestArea[] = [];



  if(
    text.includes("טכנולוג")
  ){

    interests.push(
      "טכנולוגיה" as InterestArea
    );

  }


  if(
    text.includes("פיננס")
  ){

    interests.push(
      "פיננסים" as InterestArea
    );

  }


  if(
    text.includes("אנרג")
  ){

    interests.push(
      "אנרגיה" as InterestArea
    );

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

export function computeRiskScore(
  flags:ProfileFlags
):number {


  let score = 5;



  // ------------------------------------------------------------
  // Risk preference
  // ------------------------------------------------------------


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



  // ------------------------------------------------------------
  // Investment horizon adjustment
  // ------------------------------------------------------------


  if(flags.horizon === "short")
    score -= 1;


  if(flags.horizon === "long")
    score += 2;



  // ------------------------------------------------------------
  // Age adjustment
  // Younger investors usually have more time
  // ------------------------------------------------------------


  if(
    flags.age !== null
  ){


    if(flags.age < 35)
      score += 1;


    if(flags.age >= 60)
      score -= 1;


  }



  // ------------------------------------------------------------
  // Knowledge adjustment
  // ------------------------------------------------------------


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
// Risk explanation
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
        "שילוב בין צמיחה לבין ניהול סיכון"

    };

  }




  return {

    band:"אגרסיבי",

    volatility:
      "תנודתיות גבוהה",

    psychology:
      "משקיע ארוך טווח עם סיבולת סיכון גבוהה"

  };


}





// ------------------------------------------------------------
// Investment horizon classification
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


  if(bucket === "קצר"){

    return "אופק קצר דורש יותר יציבות, נזילות והפחתת תנודתיות.";

  }



  if(bucket === "ארוך"){

    return "אופק ארוך מאפשר להתמודד עם ירידות זמניות ולחפש צמיחה.";

  }



  return "אופק בינוני מאפשר שילוב בין צמיחה לבין ניהול סיכונים.";

}

export function classifyInvestor(
  _flags:ProfileFlags,
  riskScore:number
):InvestorClassification {


  // ------------------------------------------------------------
  // Conservative investor
  // ------------------------------------------------------------


  if(riskScore <= 3){

    return {

      type:"משקיע שמרני",

      reason:
        "רמת סיכון נמוכה והתמקדות ביציבות, שמירת הון ונזילות."

    };

  }




  // ------------------------------------------------------------
  // Balanced investor
  // ------------------------------------------------------------


  if(riskScore <= 6){

    return {

      type:"משקיע מאוזן",

      reason:
        "שילוב בין צמיחה לבין ניהול סיכון באמצעות פיזור והשקעה לטווח זמן מתאים."

    };

  }




  // ------------------------------------------------------------
  // Growth investor
  // ------------------------------------------------------------


  return {

    type:"משקיע צמיחה",

    reason:
      "אופק השקעה ארוך וסיבולת סיכון גבוהה מאפשרים חשיפה גבוהה יותר לנכסי צמיחה."

  };


}






// ------------------------------------------------------------
// Explainable AI layer
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
      `העדפת סיכון שזוהתה: ${flags.riskLevel}`
    );

  }




  if(flags.horizon){

    signals.push(
      `אופק השקעה שזוהה: ${flags.horizon}`
    );

  }




  if(flags.age){

    signals.push(
      `גיל משתמש: ${flags.age}`
    );

  }




  if(
    flags.interests &&
    flags.interests.length > 0
  ){

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
