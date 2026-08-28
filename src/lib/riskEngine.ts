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
    "שמרני",
    "סיכון נמוך",
    "שמירת הון",
    "יציבות",
    "conservative",
    "low risk"
  ],


  moderate:[
    "מאוזן",
    "סיכון בינוני",
    "balanced",
    "moderate"
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
    "ספקולטיבי",
    "מסחר יומי",
    "סיכון קיצוני",
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
  text.includes("מתחיל") ||
  text.includes("חדש בשוק ההון") ||
  text.includes("אין לי ניסיון") ||
  text.includes("ללא ניסיון") ||
  text.includes("beginner")
){

  knowledgeLevel =
    "beginner";

}


if(
  text.includes("ידע בינוני") ||
  text.includes("ניסיון בינוני") ||
  text.includes("משקיע כבר") ||
  text.includes("כמה שנים") ||
  text.includes("intermediate")
){

  knowledgeLevel =
    "some";

}


if(
  text.includes("מנוסה") ||
  text.includes("ותיק") ||
  text.includes("ניסיון רב") ||
  text.includes("experienced")
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
    "technology" as InterestArea
  );

}


if(
  text.includes("פיננסים") ||
  text.includes("finance") ||
  text.includes("bank")
){

  interests.push(
    "finance" as InterestArea
  );

}


if(
  text.includes("אנרגיה") ||
  text.includes("energy")
){

  interests.push(
    "energy" as InterestArea
  );

}


if(
  text.includes("נדלן") ||
  text.includes("נדל״ן") ||
  text.includes("real estate")
){

  interests.push(
    "real_estate" as InterestArea

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
      band:"low",
      volatility:"low",
      psychology:"Preference for stability and capital preservation."
    };
  }

  if(score <= 6){
    return {
      band:"medium",
      volatility:"medium",
      psychology:"Balance between growth and risk management."
    };
  }

  return {
    band:"high",
    volatility:"high",
    psychology:"Willingness to cope with volatility for growth potential."
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
        "conservative" as InvestorType,

      reason:
        "Low risk and preference for stability and capital preservation."
    };

  }



  if(score <= 6){

    return {
      type:
        "balanced" as InvestorType,

      reason:
        "Balance between growth and risk management."
    };

  }



  return {

    type:
      "growth" as InvestorType,

    reason:
      "Willingness to cope with volatility for growth potential."

  };

}


// ------------------------------------------------------------
// Explainability Engine
// ------------------------------------------------------------

export function buildExplainability(
  flags: ProfileFlags,
  classification: InvestorClassification,
  score: number,
  language: string = "en"
): string[] {

  const reasons: string[] = [];

  const isHebrew = language === "he";

  reasons.push(
    isHebrew
      ? `סיווג משקיע: ${classification.type}`
      : `Investor classification: ${classification.type}`
  );

  reasons.push(
    isHebrew
      ? `הסבר: ${classification.reason}`
      : `Explanation: ${classification.reason}`
  );

  reasons.push(
    isHebrew
      ? `ציון סיכון: ${score}/10`
      : `Risk score: ${score}/10`
  );

  if(flags.riskLevel){

    reasons.push(
      isHebrew
        ? `העדפת סיכון שזוהתה: ${flags.riskLevel}`
        : `Identified risk preference: ${flags.riskLevel}`
    );

  }

  if(flags.horizon){

    reasons.push(
      isHebrew
        ? `אופק השקעה שזוהה: ${flags.horizon}`
        : `Identified investment horizon: ${flags.horizon}`
    );

  }

  if(flags.age !== null){

    reasons.push(
      isHebrew
        ? `גיל משתמש: ${flags.age}`
        : `User age: ${flags.age}`
    );

  }

  if(
    flags.interests &&
    flags.interests.length > 0
  ){

    reasons.push(
      isHebrew
        ? `תחומי עניין: ${flags.interests.join(", ")}`
        : `Interest areas: ${flags.interests.join(", ")}`
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
      "Passive investment in broad indices",
      "Combination of quality bond funds",
      "Maintaining a high liquidity level"
    );

  }


  if(score > 3 && score <= 6){

    strategies.push(
      "Passive investment in indices",
      "Combination of stocks and bonds",
      "Diversification across different markets"
    );

  }


  if(score > 6){

    strategies.push(
      "Investment in stock indices",
      "Exposure to growth sectors",
      "Long-term investment"
    );

  }


  if(
    flags.interests.includes("technology" as InterestArea)
  ){

    strategies.push(
      "Learning about the technology sector and its impact on the stock market"
    );

  }


  if(
    flags.interests.includes("finance" as InterestArea)
  ){

    strategies.push(
      "Tracking the finance sector"
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
      "Introduction to stocks, bonds and ETFs",
      "Understanding risk and return concepts",
      "Building a personal financial foundation"
    );

  }


  if(flags.knowledgeLevel === "some"){

    path.push(
      "Building an investment strategy",
      "Asset allocation and portfolio management",
      "Diversification and risk management"
    );

  }


  if(flags.knowledgeLevel === "experienced"){

    path.push(
      "Advanced investment portfolio analysis",
      "Performance metrics like Sharpe and Beta",
      "Asset allocation optimization"
    );

  }


  if(path.length === 0){

    path.push(
      "Financial basics",
      "Introduction to the stock market",
      "Building an investment strategy",
      "Deepening risk management"
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

    case "conservative":

      return "The investor focuses on capital preservation, stability, and reducing volatility.";

    case "balanced":

      return "The investor seeks a balance between growth and risk management.";

    case "growth":

      return "The investor is willing to cope with high volatility for high return potential.";

    default:

      return "Balanced investment style.";

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
    return "Long investment horizon allows higher exposure to growth assets and focus on the long term.";
  }

  if (horizon === "short") {
    return "Short investment horizon requires emphasis on liquidity, stability, and reducing volatility.";
  }

  return "Medium investment horizon allows combining growth potential with risk management.";
}






