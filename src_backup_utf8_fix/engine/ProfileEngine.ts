export interface FinancialProfile {

  age:number;

  income:number;

  currentAssets:number;

  monthlySavings:number;

  riskLevel:
  | "low"
  | "medium"
  | "high";


  goal:
  | "financial_independence"
  | "early_retirement"
  | "wealth_building"
  | "home_purchase"
  | "general";


  experience:
  | "beginner"
  | "intermediate"
  | "advanced";


  interests:string[];

}




function extractMoney(text:string){

  const matches =
    text.match(/\d[\d,]*/g);


  if(!matches)
    return 0;


  const numbers =
    matches.map(
      value =>
      Number(
        value.replace(/,/g,"")
      )
    );


  const largest =
    Math.max(...numbers);



  if(
    text.includes("אלף")
  ){

    return largest * 1000;

  }


  if(
    text.includes("מיליון")
  ){

    return largest * 1000000;

  }


  return largest;

}





function detectGoal(
text:string
):FinancialProfile["goal"]{


const lower =
text.toLowerCase();



if(
lower.includes("פרישה") ||
lower.includes("לפרוש")
){

return "early_retirement";

}



if(
lower.includes("עצמאות כלכלית")
){

return "financial_independence";

}



if(
lower.includes("דירה") ||
lower.includes("בית")
){

return "home_purchase";

}



if(
lower.includes("הון") ||
lower.includes("עושר")
){

return "wealth_building";

}



return "general";


}






function detectRisk(
text:string
):FinancialProfile["riskLevel"]{


const lower =
text.toLowerCase();



if(
lower.includes("סיכון נמוך")
||
lower.includes("שמרני")
){

return "low";

}



if(
lower.includes("סיכון גבוה")
||
lower.includes("אגרסיבי")
){

return "high";

}



return "medium";


}






function detectExperience(
text:string
):FinancialProfile["experience"]{


const lower =
text.toLowerCase();



if(
lower.includes("חדש")
||
lower.includes("מתחיל")
){

return "beginner";

}



if(
lower.includes("מניות")
||
lower.includes("מדד")
||
lower.includes("השקעות")
){

return "intermediate";

}



return "advanced";


}






export function analyzeProfile(
text:string
):FinancialProfile{


const lower =
text.toLowerCase();



const ageMatch =
text.match(
/בן\s*(\d+)/
);



const age =
ageMatch
?
Number(ageMatch[1])
:
30;




const currentAssets =
extractMoney(text);





const interests:string[]=[];



if(
lower.includes("מניות")
){

interests.push("stocks");

}


if(
lower.includes("נדלן")
||
lower.includes("נדל״ן")
){

interests.push("real_estate");

}


if(
lower.includes("קריפטו")
){

interests.push("crypto");

}




return {


age,


income:0,


currentAssets,


monthlySavings:0,


riskLevel:
detectRisk(text),


goal:
detectGoal(text),


experience:
detectExperience(text),


interests


};


}






export function saveProfile(
profile:FinancialProfile
){

localStorage.setItem(
"invested_profile",
JSON.stringify(profile)
);


}






export function loadProfile()
:
FinancialProfile | null{


const data =
localStorage.getItem(
"invested_profile"
);



if(!data)
return null;



return JSON.parse(data);


}

