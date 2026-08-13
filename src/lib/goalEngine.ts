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


// ---------------------------------------------------------------------------
// Retirement Planning Engine
// ---------------------------------------------------------------------------

export interface RetirementPlanInput {

  currentAge:number;

  expectedRetirementAge:number;

  currentAssets:number;

  monthlyInvestment:number;

  annualReturnPct:number;

  inflationPct:number;

  targetMonthlyIncome:number;

}


export interface RetirementScenarioAlternative {

  label:string;

  annualReturnPct:number;

  futureValue:number;

  monthlyIncomeDuringRetirement:number;

}


export interface RetirementPlan {

  yearsRemaining:number;

  currentAssets:number;

  monthlyInvestment:number;

  futureValue:number;

  requiredMonthlyContribution:number;

  monthlyIncomeDuringRetirement:number;

  probabilityOfSuccess:number;

  scenarioAlternatives:RetirementScenarioAlternative[];

  recommendations:string[];

}


export function buildRetirementPlan(
  input:RetirementPlanInput
):RetirementPlan {

  const yearsRemaining = Math.max(
    input.expectedRetirementAge - input.currentAge,
    0
  );

  const months = yearsRemaining * 12;

  const annualReturn = Math.max(
    input.annualReturnPct,
    0
  ) / 100;

  const monthlyRate =
    annualReturn / 12;

  const inflationRate = Math.max(
    input.inflationPct,
    0
  ) / 100;

  const monthlyInvestment = Math.max(
    input.monthlyInvestment,
    0
  );

  const currentAssets = Math.max(
    input.currentAssets,
    0
  );

  const targetMonthlyIncome = Math.max(
    input.targetMonthlyIncome,
    0
  );


  // --------------------------------------------------
  // Future value of existing assets + contributions
  // --------------------------------------------------

  let futureValue = currentAssets;

  if(months > 0){

    if(monthlyRate > 0){

      futureValue =
        currentAssets *
        Math.pow(
          1 + monthlyRate,
          months
        )
        +
        monthlyInvestment *
        (
          (
            Math.pow(
              1 + monthlyRate,
              months
            ) - 1
          )
          /
          monthlyRate
        );

    } else {

      futureValue =
        currentAssets +
        monthlyInvestment * months;

    }

  }


  futureValue = Math.round(
    futureValue
  );


  // --------------------------------------------------
  // Retirement income estimate
  // --------------------------------------------------

  const annualWithdrawalRate = 0.04;

  const monthlyIncomeDuringRetirement =
    Math.round(
      (
        futureValue *
        annualWithdrawalRate
      ) / 12
    );


  // --------------------------------------------------
  // Inflation-adjusted target
  // --------------------------------------------------

  const futureMonthlyIncomeTarget =
    targetMonthlyIncome *
    Math.pow(
      1 + inflationRate,
      yearsRemaining
    );


  const targetRetirementCapital =
    futureMonthlyIncomeTarget *
    12 /
    annualWithdrawalRate;


  // --------------------------------------------------
  // Required monthly contribution
  // --------------------------------------------------

  let requiredMonthlyContribution = 0;

  if(
    targetRetirementCapital >
    futureValue
  ){

    const remainingCapital =
      targetRetirementCapital -
      (
        currentAssets *
        Math.pow(
          1 + monthlyRate,
          months
        )
      );

    if(months > 0){

      if(monthlyRate > 0){

        requiredMonthlyContribution =
          remainingCapital *
          monthlyRate /
          (
            Math.pow(
              1 + monthlyRate,
              months
            ) - 1
          );

      } else {

        requiredMonthlyContribution =
          remainingCapital / months;

      }

    }

  }

  requiredMonthlyContribution = Math.max(
    Math.round(requiredMonthlyContribution),
    0
  );


  // --------------------------------------------------
  // Scenario alternatives
  // --------------------------------------------------

  const scenarioReturns = [
    {
      label:"שמרני",
      annualReturnPct:5
    },
    {
      label:"בסיס",
      annualReturnPct:input.annualReturnPct
    },
    {
      label:"צמיחה",
      annualReturnPct:10
    }
  ];


  const scenarioAlternatives =
    scenarioReturns.map(
      scenario => {

        const rate =
          scenario.annualReturnPct /
          100 /
          12;

        let value = currentAssets;

        if(months > 0){

          if(rate > 0){

            value =
              currentAssets *
              Math.pow(
                1 + rate,
                months
              )
              +
              monthlyInvestment *
              (
                (
                  Math.pow(
                    1 + rate,
                    months
                  ) - 1
                )
                /
                rate
              );

          } else {

            value =
              currentAssets +
              monthlyInvestment * months;

          }

        }

        value = Math.round(value);

        return {
          label:scenario.label,
          annualReturnPct:
            scenario.annualReturnPct,
          futureValue:value,
          monthlyIncomeDuringRetirement:
            Math.round(
              value *
              annualWithdrawalRate /
              12
            )
        };

      }
    );


  // --------------------------------------------------
  // Success probability
  // --------------------------------------------------

  let probabilityOfSuccess = 0;

  if(targetRetirementCapital > 0){

    probabilityOfSuccess =
      Math.round(
        Math.min(
          futureValue /
          targetRetirementCapital *
          100,
          100
        )
      );

  } else {

    probabilityOfSuccess = 100;

  }


  // --------------------------------------------------
  // Recommendations
  // --------------------------------------------------

  const recommendations:string[] = [];


  if(
    yearsRemaining >= 20
  ){

    recommendations.push(
      "אופק השקעה ארוך מאפשר לריבית דריבית להיות מנוע מרכזי בבניית ההון."
    );

  } else if(
    yearsRemaining > 0
  ){

    recommendations.push(
      "אופק ההשקעה משמעותי, ולכן עקביות בהפקדות יכולה להשפיע מהותית על התוצאה."
    );

  } else {

    recommendations.push(
      "יש לבחון מחדש את יעד הפרישה ואת מקורות ההכנסה הצפויים."
    );

  }


  if(
    monthlyInvestment <
    requiredMonthlyContribution
  ){

    recommendations.push(
      "הגדלת ההפקדה החודשית עשויה לשפר את הסיכוי להגיע ליעד."
    );

  } else {

    recommendations.push(
      "רמת ההפקדה הנוכחית תואמת או עולה על ההפקדה המחושבת לפי ההנחות."
    );

  }


  recommendations.push(
    "התרחיש הוא הדמיה חינוכית המבוססת על תשואה והנחות אינפלציה ואינו מהווה הבטחת תשואה."
  );


  return {

    yearsRemaining,

    currentAssets,

    monthlyInvestment,

    futureValue,

    requiredMonthlyContribution,

    monthlyIncomeDuringRetirement,

    probabilityOfSuccess,

    scenarioAlternatives,

    recommendations

  };

}
