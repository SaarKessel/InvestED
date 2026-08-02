// ---------------------------------------------------------------------------
// InvestED - Goal Planning Engine
// ---------------------------------------------------------------------------


export interface FinancialGoal {

  targetAmount:number;

  currentAmount:number;

  years:number;

  requiredMonthlyContribution:number;

  expectedFinalValue:number;

  progressPercentage:number;

  achievable:boolean;

}






// =====================================================
// Detect Target Amount
// =====================================================


export function detectTargetAmount(
  text:string
):number {


const normalized =
text
.toLowerCase()
.replace(/,/g,"")
.trim();





// חצי מיליון

if(
normalized.includes("חצי מיליון")
){

return 500000;

}





// מיליון וחצי

const millionHalf =
normalized.match(
/(\d+(?:\.\d+)?)\s*מיליון\s*(וחצי)?/
);



if(millionHalf){

let value =
Number(millionHalf[1]) * 1000000;


if(millionHalf[2]){

value += 500000;

}


return Math.round(value);

}





let amount = 0;



const matches =
normalized.matchAll(

/(\d+(?:\.\d+)?)\s*(אלף|מיליון|k|m)?/g

);





for(const match of matches){


let value =
Number(match[1]);



if(isNaN(value)){

continue;

}



const unit =
match[2];



if(
unit==="אלף" ||
unit==="k"
){

value *= 1000;

}



if(
unit==="מיליון" ||
unit==="m"
){

value *= 1000000;

}



if(value > amount){

amount = value;

}


}






return Math.round(amount);


}









// =====================================================
// Required Monthly Contribution
// =====================================================


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






return Math.round(
monthlyContribution
);


}









// =====================================================
// Goal Progress
// =====================================================


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









// =====================================================
// Full Goal Analysis
// =====================================================


export function analyzeFinancialGoal(

currentAmount:number,

targetAmount:number,

years:number,

annualReturnPct:number = 8,

monthlyContribution:number = 0

):FinancialGoal{





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

Math.round(
futureValue
),



progressPercentage:

calculateGoalProgress(

currentAmount,

targetAmount

),



achievable:

futureValue >= targetAmount


};


}
