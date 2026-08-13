// ---------------------------------------------------------------------------
// InvestED - Goal Planning Engine v2
// Smart Financial Goal Detection
// ---------------------------------------------------------------------------


export interface GoalAnalysis {

  targetAmount:number;

  currentAmount:number;

  years:number;

  requiredMonthlyContribution:number;

  expectedFinalValue:number;

  progressPercentage:number;

  achievable:boolean;

}





// ---------------------------------------------------------------------------
// Detect Target Amount
// ---------------------------------------------------------------------------


export function detectTargetAmount(
  text:string
):number {


  const normalized =
    text
      .toLowerCase()
      .replace(/,/g,"")
      .trim();



  let amount = 0;



  // --------------------------------------------------
  // Ignore age numbers
  // --------------------------------------------------

  const cleanedText =
    normalized.replace(
      /בן\s+\d+/g,
      ""
    );





  // --------------------------------------------------
  // Half million
  // --------------------------------------------------

  if(
    cleanedText.includes("חצי מיליון")
  ){

    amount = Math.max(
      amount,
      500000
    );

  }




  // --------------------------------------------------
  // Million and a half
  // --------------------------------------------------

  const millionHalfMatch =
    cleanedText.match(
      /מיליון\s+וחצי/
    );


  if(millionHalfMatch){

    amount = Math.max(
      amount,
      1500000
    );

  }







  // --------------------------------------------------
  // X million
  // Example:
  // 2 מיליון
  // 2.5 מיליון
  // מיליון
  // --------------------------------------------------


  const millionMatch =
    cleanedText.match(
      /(\d+(?:\.\d+)?)\s*מיליון/
    );



  if(millionMatch){

    amount =
      Math.max(
        amount,
        Number(millionMatch[1]) * 1000000
      );

  }




  if(
    cleanedText.includes("מיליון")
    &&
    amount === 0
  ){

    amount =
      Math.max(
        amount,
        1000000
      );

  }





  // --------------------------------------------------
  // Thousand
  // Example:
  // 500 אלף
  // 150k
  // --------------------------------------------------


  const thousandMatch =
    cleanedText.match(
      /(\d+(?:\.\d+)?)\s*(אלף|k)/
    );



  if(thousandMatch){

    amount =
      Math.max(
        amount,
        Number(thousandMatch[1]) * 1000
      );

  }





  // --------------------------------------------------
  // Direct currency amounts
  // Example:
  // 1000000 שקל
  // 500000 ₪
  // --------------------------------------------------


  const currencyMatch =
    cleanedText.match(
      /(\d{5,})\s*(שקל|₪)?/
    );



  if(currencyMatch){

    amount =
      Math.max(
        amount,
        Number(currencyMatch[1])
      );

  }





  return Math.round(amount);

}









// ---------------------------------------------------------------------------
// Calculate Required Monthly Contribution
// ---------------------------------------------------------------------------


export function calculateRequiredMonthlyContribution(

  targetAmount:number,

  currentAmount:number,

  years:number,

  annualReturnPct:number = 8

):number {


  if(years <= 0){

    return 0;

  }



  const monthlyRate =
    annualReturnPct / 100 / 12;



  const months =
    years * 12;





  const futureCurrentAmount =

    currentAmount *

    Math.pow(
      1 + monthlyRate,
      months
    );





  const remainingAmount =

    Math.max(
      targetAmount - futureCurrentAmount,
      0
    );





  if(monthlyRate === 0){

    return Math.round(
      remainingAmount / months
    );

  }





  const contribution =

    remainingAmount *

    monthlyRate /

    (
      Math.pow(
        1 + monthlyRate,
        months
      )
      -
      1
    );





  return Math.round(contribution);

}









// ---------------------------------------------------------------------------
// Goal Progress
// ---------------------------------------------------------------------------


export function calculateGoalProgress(

  projectedAmount:number,

  targetAmount:number

):number {


  if(targetAmount <= 0){

    return 0;

  }



  return Math.min(

    Math.round(
      (projectedAmount / targetAmount) * 100
    ),

    100

  );

}









// ---------------------------------------------------------------------------
// Full Goal Analysis
// ---------------------------------------------------------------------------


export function analyzeFinancialGoal(

  currentAmount:number,

  targetAmount:number,

  years:number,

  annualReturnPct:number = 8,

  monthlyContribution:number = 0

):GoalAnalysis {



  const monthlyRequired =

    calculateRequiredMonthlyContribution(

      targetAmount,

      currentAmount,

      years,

      annualReturnPct

    );





  const months =
    years * 12;



  const monthlyRate =
    annualReturnPct / 100 / 12;





  const futureValue =

    currentAmount *

    Math.pow(
      1 + monthlyRate,
      months
    )

    +

    (

      monthlyRate === 0

      ?

      monthlyContribution * months

      :

      monthlyContribution *

      (

        (
          Math.pow(
            1 + monthlyRate,
            months
          )
          -
          1
        )

        /

        monthlyRate

      )

    );







  return {

    targetAmount,

    currentAmount,

    years,


    requiredMonthlyContribution:
      monthlyRequired,


    expectedFinalValue:
      Math.round(futureValue),


    progressPercentage:

      calculateGoalProgress(

        futureValue,

        targetAmount

      ),



    achievable:

      futureValue >= targetAmount


  };


}