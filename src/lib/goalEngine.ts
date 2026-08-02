 // ---------------------------------------------------------------------------
// InvestED - Goal Planning Engine
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





export function detectTargetAmount(text:string):number{


const normalized = text
.toLowerCase()
.replace(/,/g,"");



let amount = 0;



const matches = normalized.matchAll(

/(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m)?/g

);



for(const match of matches){


let value = Number(match[1]);



if(isNaN(value)){

continue;

}



if(
match[2]==="אלף" ||
match[2]==="k"
){

value*=1000;

}



if(
match[2]==="מיליון" ||
match[2]==="m"
){

value*=1000000;

}



if(value > amount){

amount=value;

}


}





const millionMatch = normalized.match(

/(\d+(?:\.\d+)?)\s*מיליון/

);



if(millionMatch){

amount =
Number(millionMatch[1]) *
1000000;

}



return Math.round(amount);


}







export function calculateRequiredMonthlyContribution(

targetAmount:number,

currentAmount:number,

years:number,

annualReturnPct:number = 8

):number{


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





const monthlyContribution =

remainingAmount *

monthlyRate /

(

Math.pow(

1 + monthlyRate,

months

)

-1

);





return Math.round(monthlyContribution);


}







export function calculateGoalProgress(

currentAmount:number,

targetAmount:number

):number{


if(targetAmount <= 0){

return 0;

}



return Math.min(

Math.round(

(currentAmount / targetAmount) * 100

),

100

);


}







export function analyzeFinancialGoal(

currentAmount:number,

targetAmount:number,

years:number,

annualReturnPct:number = 8,

monthlyContribution:number = 0

):GoalAnalysis{





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

-1

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

currentAmount,

targetAmount

),



achievable:

futureValue >= targetAmount


};


}

