import type {
  ProfileFlags,
  RiskDescription,
  InvestorClassification,
  InterestArea,
  HorizonBucket,
} from "@/types";


const RISK_KEYWORDS = {

  very_low:[
    "שמרן מאוד",
    "סיכון נמוך מאוד",
    "שימור הון",
    "very conservative"
  ],

  low:[
    "שמרן",
    "סיכון נמוך",
    "יציב",
    "conservative"
  ],

  moderate:[
    "סיכון בינוני",
    "מאוזן",
    "balanced"
  ],

  high:[
    "סיכון גבוה",
    "אגרסיבי",
    "high risk"
  ],

  very_high:[
    "אגרסיבי מאוד",
    "ספקולטיבי",
    "very aggressive"
  ]

};


const HORIZON_KEYWORDS = {

  short:[
    "טווח קצר",
    "שנה",
    "שנתיים"
  ],

  medium:[
    "טווח בינוני",
    "5 שנים"
  ],

  long:[
    "טווח ארוך",
    "פרישה",
    "20 שנה",
    "30 שנה"
  ]

};


function containsAny(
  text:string,
  arr:string[]
){

  return arr.some(x=>text.includes(x));

}



export function extractProfileFlags(
 rawText:string
):ProfileFlags {


 const text =
 rawText.toLowerCase();


 let riskLevel:ProfileFlags["riskLevel"]=null;


 for(
 const level of Object.keys(RISK_KEYWORDS)
 ){

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



 let horizon:ProfileFlags["horizon"]=null;


 for(
 const h of Object.keys(HORIZON_KEYWORDS)
 ){

   if(
    containsAny(
      text,
      HORIZON_KEYWORDS[h as keyof typeof HORIZON_KEYWORDS]
    )
   ){

    horizon =
      h as ProfileFlags["horizon"];

    break;

   }

 }



 return {

  rawText,

  age:null,

  riskLevel,

  horizon,

  knowledgeLevel:null,

  interests:[] as InterestArea[],

  preferences:[],

  goal:null

 };

}





export function computeRiskScore(
 flags:ProfileFlags
):number {


 let score=5;


 if(flags.riskLevel==="very_low")
  score=2;

 if(flags.riskLevel==="low")
  score=3;

 if(flags.riskLevel==="moderate")
  score=5;

 if(flags.riskLevel==="high")
  score=8;

 if(flags.riskLevel==="very_high")
  score=9;


 if(flags.horizon==="long")
  score+=1;


 if(flags.horizon==="short")
  score-=1;


 return Math.max(
 1,
 Math.min(
 10,
 Math.round(score)
 ));

}




export function riskScoreDescription(
 score:number
):RiskDescription {


 if(score<=3)
 return {
  band:"שמרני",
  volatility:"תנודתיות נמוכה",
  psychology:"עדיפות ליציבות"
 };


 if(score>=8)
 return {
  band:"אגרסיבי",
  volatility:"תנודתיות גבוהה",
  psychology:"מתאים למשקיע ארוך טווח"
 };


 return {
  band:"מאוזן",
  volatility:"תנודתיות בינונית",
  psychology:"איזון בין סיכון לצמיחה"
 };


}





export function horizonBucket(
 flags:ProfileFlags
):HorizonBucket {


 if(flags.horizon==="short")
 return "קצר";


 if(flags.horizon==="long")
 return "ארוך";


 return "בינוני";

}



export function horizonExplanation(
  bucket:HorizonBucket
):string {

  if(bucket === "קצר")
    return "אופק קצר דורש יותר יציבות ונזילות.";

  if(bucket === "ארוך")
    return "אופק ארוך מאפשר חשיפה גבוהה יותר לצמיחה.";

  return "אופק בינוני מאפשר שילוב בין צמיחה וניהול סיכון.";
}



export function classifyInvestor(
  _flags:ProfileFlags,
  riskScore:number
):InvestorClassification {

  if(riskScore <= 3){

    return {
      type:"משקיע שמרני",
      reason:"רמת סיכון נמוכה והתמקדות ביציבות."
    };

  }


  if(riskScore <= 5){

    return {
      type:"משקיע מאוזן",
      reason:"שילוב בין צמיחה לבין ניהול סיכון."
    };

  }


  if(riskScore <= 7){

    return {
      type:"משקיע צמיחה",
      reason:"יכולת להתמודד עם תנודתיות לטובת תשואה ארוכת טווח."
    };

  }


  return {
    type:"משקיע צמיחה",
    reason:"סיבולת סיכון גבוהה והעדפה לצמיחה."
  };

}



export function buildExplainability(
  _flags:ProfileFlags,
  riskScore:number,
  investor:InvestorClassification
){

  return {

    signals:[
      `סיווג משקיע: ${investor.type}`,
      `ציון סיכון: ${riskScore}/10`
    ],

    summary:
      `המערכת סיווגה את המשתמש כ-${investor.type} לפי מאפייני הפרופיל.`

  };

}