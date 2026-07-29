export interface FinancialProfile {

  age:number;

  income:number;

  currentAssets:number;

  riskLevel:
  "low" |
  "medium" |
  "high";

  goal:
  "financial_independence" |
  "retirement" |
  "wealth" |
  "general";

  targetAge:number | null;

  experience:
  "beginner" |
  "intermediate" |
  "advanced";

}










export function analyzeProfile(
  text:string
):FinancialProfile{


  const lower =
    text.toLowerCase();



  const ageMatch =
    lower.match(
      /בן\s*(\d+)/
    );


  const age =
    ageMatch
    ?
    Number(ageMatch[1])
    :
    30;




  const moneyMatches =
    text.match(
      /\d[\d,]*\s*(אלף|מיליון|שקל|₪)?/g
    );



  let assets = 0;



  if(moneyMatches?.length){


    const first =
      moneyMatches[0];


    const number =
      Number(
        first.replace(/\D/g,"")
      );


    if(first.includes("אלף"))
      assets = number * 1000;


    else if(first.includes("מיליון"))
      assets = number * 1000000;


    else
      assets = number;


  }





  let goal:
  FinancialProfile["goal"]
  =
  "general";



  if(
    lower.includes("עצמאות") ||
    lower.includes("פרישה") ||
    lower.includes("לפרוש")
  ){

    goal =
    "financial_independence";

  }

  else if(
    lower.includes("עושר") ||
    lower.includes("הון")
  ){

    goal =
    "wealth";

  }




  let risk:
  FinancialProfile["riskLevel"]
  =
  "medium";



  if(
    lower.includes("סיכון נמוך")
  ){

    risk="low";

  }


  if(
    lower.includes("סיכון גבוה")
  ){

    risk="high";

  }





  let experience:
  FinancialProfile["experience"]
  =
  "beginner";



  if(
    lower.includes("השקעות") ||
    lower.includes("מניות") ||
    lower.includes("מדד")
  ){

    experience="intermediate";

  }





  return {

    age,

    income:0,

    currentAssets:assets,

    riskLevel:risk,

    goal,

    targetAge:null,

    experience

  };


}
