import {useState} from "react";
import type {FinancialProfile} from "@/types/FinancialProfile";



export default function OnboardingPage(){


const [text,setText]=useState("");



const [profile,setProfile]=useState<FinancialProfile | null>(null);



function analyzeProfile(){


const newProfile:FinancialProfile={


age:
extractNumber(text,"׳‘׳"),


occupation:"",


currentAssets:
extractMoney(text),


monthlyIncome:null,


monthlyInvestment:
0,


riskLevel:
detectRisk(text),


knowledgeLevel:
detectKnowledge(text),


interests:
detectInterests(text),


primaryGoal:
detectGoal(text),


targetAmount:null,


targetAge:null,


rawInput:text,


createdAt:
new Date().toISOString()


};


setProfile(newProfile);


}




return (

<div

className="
min-h-screen
bg-[#07111F]
text-white
p-8
"

>


<div

className="
max-w-3xl
mx-auto
"

>


<h1

className="
text-3xl
font-bold
mb-4
"

>

נ§  ׳¡׳₪׳¨׳• ׳׳ ׳• ׳§׳¦׳× ׳¢׳ ׳¢׳¦׳׳›׳

</h1>



<p

className="
text-slate-400
mb-6
"

>

׳›׳×׳‘׳• ׳‘׳©׳₪׳” ׳—׳•׳₪׳©׳™׳× ג€” ׳’׳™׳, ׳׳˜׳¨׳•׳×, ׳™׳“׳¢ ׳₪׳™׳ ׳ ׳¡׳™,
׳¨׳׳× ׳¡׳™׳›׳•׳ ׳•׳×׳—׳•׳׳™ ׳¢׳ ׳™׳™׳.

</p>



<textarea

value={text}

onChange={
e=>setText(e.target.value)
}

placeholder="
׳׳ ׳™ ׳‘׳ 27, ׳™׳© ׳׳™ 500 ׳׳׳£ ׳©׳§׳,
׳׳ ׳™ ׳׳©׳§׳™׳¢ ׳׳˜׳•׳•׳— ׳׳¨׳•׳ ׳•׳¨׳•׳¦׳” ׳¢׳¦׳׳׳•׳× ׳›׳׳›׳׳™׳×...
"

className="
w-full
h-40
rounded-xl
bg-[#0D1B2A]
border
border-[#1E3A5F]
p-5
mb-5
"

 />



<button

onClick={analyzeProfile}

className="
bg-blue-600
hover:bg-blue-700
px-6
py-3
rounded-xl
font-bold
"

>

׳ ׳×׳— ׳₪׳¨׳•׳₪׳™׳

</button>




{
profile && (

<div

className="
mt-8
bg-[#0D1B2A]
border
border-[#1E3A5F]
rounded-2xl
p-6
"

>


<h2 className="
text-xl
font-bold
mb-4
">

׳”׳₪׳¨׳•׳₪׳™׳ ׳©׳ ׳•׳¦׳¨

</h2>



<pre className="
text-sm
text-slate-300
"

>

{
JSON.stringify(
profile,
null,
2
)
}

</pre>


</div>

)

}



</div>


</div>


);


}





function extractNumber(
text:string,
keyword:string
){


const match=text.match(
new RegExp(
`${keyword}\\s*(\\d+)`
)
);


return match
?
Number(match[1])
:
null;

}




function extractMoney(text:string){


const normalized=text
.replace(/,/g,"");



const match=normalized.match(
/(\d+)\s*(׳׳׳£|׳׳™׳׳™׳•׳)?/
);



if(!match)
return 0;



let value=
Number(match[1]);



if(match[2]==="׳׳׳£")
value*=1000;


if(match[2]==="׳׳™׳׳™׳•׳")
value*=1000000;



return value;


}





function detectRisk(
text:string
):FinancialProfile["riskLevel"]{


if(
text.includes("׳¡׳™׳›׳•׳ ׳’׳‘׳•׳”") ||
text.includes("׳׳’׳¨׳¡׳™׳‘׳™")
)

return "high";


if(
text.includes("׳¡׳•׳׳™׳“׳™") ||
text.includes("׳ ׳׳•׳")
)

return "low";


return "medium";

}





function detectKnowledge(
text:string
):FinancialProfile["knowledgeLevel"]{


if(
text.includes("׳׳×׳§׳“׳") ||
text.includes("׳׳ ׳•׳¡׳”")
)

return "advanced";


if(
text.includes("׳׳×׳—׳™׳")
)

return "beginner";


return "intermediate";

}





function detectInterests(
text:string
){


const interests:string[]=[];


if(text.includes("S&P") || text.includes("׳¡׳ ׳•׳₪׳™"))
interests.push("S&P 500");


if(text.includes("AI") || text.includes("׳‘׳™׳ ׳” ׳׳׳׳›׳•׳×׳™׳×"))
interests.push("AI");


if(text.includes("׳§׳¨׳™׳₪׳˜׳•"))
interests.push("Crypto");


return interests;

}





function detectGoal(
text:string
):FinancialProfile["primaryGoal"]{


if(
text.includes("׳₪׳¨׳™׳©׳”") ||
text.includes("׳¢׳¦׳׳׳•׳× ׳›׳׳›׳׳™׳×")
)

return "retirement";


if(
text.includes("׳‘׳™׳×") ||
text.includes("׳“׳™׳¨׳”")
)

return "home";


if(
text.includes("׳™׳׳“")
)

return "children";


if(
text.includes("׳¢׳•׳©׳¨") ||
text.includes("׳”׳•׳")
)

return "wealth";


return "growth";

}

