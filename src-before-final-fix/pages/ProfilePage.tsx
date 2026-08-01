import { useState } from "react";

import {
analyzeProfile,
saveProfile
} from "@/engine/ProfileEngine";



import type {
FinancialProfile
} from "@/engine/ProfileEngine";





export default function ProfilePage(){



const [input,setInput] =
useState("");



const [profile,setProfile] =
useState<FinancialProfile | null>(null);





function createProfile(){


if(!input.trim())
return;



const result =
analyzeProfile(input);



saveProfile(result);


setProfile(result);


}





return (

<div

dir="rtl"

className="
min-h-screen
bg-[#050B16]
text-white
p-6
"

>


<div

className="
max-w-5xl
mx-auto
"

>


<h1

className="
text-4xl
font-bold
mb-4
"

>

🧬 Financial DNA

</h1>



<p

className="
text-slate-300
mb-8
"

>

ספרו לנו קצת על עצמכם וקבלו ניתוח פיננסי אישי.

</p>




<div

className="
bg-[#0B1628]
border
border-[#1E3A5F]
rounded-3xl
p-6
"

>


<textarea

value={input}

onChange={
e=>setInput(e.target.value)
}


placeholder="
לדוגמה:
אני בן 30, יש לי 300 אלף שקל,
אני משקיע במדדים ורוצה עצמאות כלכלית
"


className="
w-full
h-40
bg-[#050B16]
border
border-[#1E3A5F]
rounded-xl
p-4
text-white
resize-none
"

/>



<button

onClick={createProfile}


className="
mt-5
bg-emerald-400
hover:bg-emerald-500
text-black
font-bold
px-8
py-3
rounded-xl
"

>

צור פרופיל 🚀

</button>



</div>







{

profile &&


<div

className="
grid
md:grid-cols-2
gap-5
mt-8
"

>


<Card
title="גיל"
value={`${profile.age}`}
/>


<Card
title="הון נוכחי"
value={`${profile.currentAssets.toLocaleString("he-IL")} ₪`}
/>


<Card
title="רמת סיכון"
value={profile.riskLevel}
/>


<Card
title="מטרה"
value={profile.goal}
/>


<Card
title="ניסיון השקעות"
value={profile.experience}
/>


<Card
title="תחומי עניין"
value={
profile.interests.length
?
profile.interests.join(", ")
:
"כללי"
}
/>


</div>


}





</div>

</div>


);


}







function Card({

title,

value

}:{

title:string;

value:string;

}){


return (

<div

className="
bg-[#0B1628]
border
border-[#1E3A5F]
rounded-2xl
p-5
"

>


<p

className="
text-slate-400
"

>

{title}

</p>



<p

className="
text-2xl
font-bold
mt-2
"

>

{value}

</p>


</div>


);


}
