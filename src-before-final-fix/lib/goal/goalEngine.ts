// ---------------------------------------------------------------------------
// InvestED — Goal Planning Engine
// ---------------------------------------------------------------------------


export interface GoalPlanResult {

targetAmount:number;

currentAmount:number;

years:number;

requiredMonthlyContribution:number;

expectedFinalValue:number;

progressPercentage:number;

achievable:boolean;

}




export function calculateGoalPlan(

targetAmount:number,

currentAmount:number,

years:number,

annualReturnPct:number,

currentMonthlyContribution:number = 0

):GoalPlanResult{



const months = years * 12;


const monthlyRate =
annualReturnPct / 100 / 12;



// כמה הסכום הקיים יגדל

const futureCurrentAmount =
currentAmount *
Math.pow(
1 + annualReturnPct / 100,
years
);



// חישוב כמה צריך להוסיף כל חודש

let requiredMonthlyContribution = 0;



if(months > 0){

const futureValueNeeded =
targetAmount - futureCurrentAmount;



if(futureValueNeeded > 0){

requiredMonthlyContribution =

futureValueNeeded *

monthlyRate /

(
Math.pow(
1 + monthlyRate,
months
)
-1
);

}

}




requiredMonthlyContribution =
Math.max(
0,
Math.round(requiredMonthlyContribution)
);





const expectedFinalValue =

futureCurrentAmount +

currentMonthlyContribution *

(
(
Math.pow(
1 + monthlyRate,
months
)-1
)
/
monthlyRate
);





const progressPercentage =

Math.min(

100,

Math.round(

(
currentAmount /
targetAmount
)
*100

)

);





return {


targetAmount,


currentAmount,


years,


requiredMonthlyContribution,


expectedFinalValue:
Math.round(expectedFinalValue),



progressPercentage,



achievable:

expectedFinalValue >= targetAmount


};


}