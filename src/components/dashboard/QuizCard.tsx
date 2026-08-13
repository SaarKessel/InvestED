import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Check,
  X,
  RotateCcw,
  Trophy,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui/primitives";

import {
  QUIZ_BANK,
  type QuizQuestion,
} from "@/lib/quizBank";
import {
  getQuizProgress,
  saveQuizProgress,
  clearQuizProgress,
} from "@/lib/quizProgressStorage";

import { cn } from "@/lib/utils";





function shuffleQuestions(
  questions: QuizQuestion[]
){

  return [...questions]
    .map(value=>({
      value,
      sort:Math.random(),
    }))
    .sort(
      (a,b)=>a.sort-b.sort
    )
    .map(
      item=>item.value
    );

}





function pickRandomQuestions(
  count:number
){

  return shuffleQuestions(QUIZ_BANK)
    .slice(
      0,
      Math.min(
        count,
        QUIZ_BANK.length
      )
    );

}









export function QuizCard(){


const savedProgress = getQuizProgress();

const [questions,setQuestions] =
useState<QuizQuestion[]>(
()=>pickRandomQuestions(5)
);



const [step,setStep] =
useState(0);



const [selected,setSelected] =
useState<number|null>(null);



const [score,setScore] =
useState(savedProgress?.score ?? 0);



const [finished,setFinished] =
useState(savedProgress?.completed ?? false);





useEffect(() => {

  if (!finished) {
    return;
  }

  saveQuizProgress({
    completed: true,
    score,
    total: questions.length,
    finishedAt: new Date().toISOString(),
  });

}, [finished, score, questions.length]);



const current =
questions[step];





const progressPct =
useMemo(()=>{


if(
questions.length===0
){

return 0;

}


return (
(step / questions.length) * 100
);


},[
step,
questions.length
]);








if(!current){

return null;

}









function handleAnswer(
idx:number
){


if(selected!==null){

return;

}



setSelected(idx);



if(
idx === current.correctIndex
){

setScore(
s=>s+1
);

}


}









function handleNext(){


if(
step + 1 >= questions.length
){

setFinished(true);

return;

}



setStep(
s=>s+1
);


setSelected(null);


}









function handleRestart(){


setQuestions(
pickRandomQuestions(5)
);


setStep(0);


setSelected(null);


setScore(0);


setFinished(false);

clearQuizProgress();


}









return (

<motion.div

initial={{
opacity:0,
y:16
}}

animate={{
opacity:1,
y:0
}}

transition={{
delay:0.5
}}

>


<Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">


<CardHeader>


<div className="flex items-center gap-2 text-primary">

<Brain className="h-4 w-4"/>

<span className="text-xs font-bold uppercase tracking-wide">

בוחן ידע מהיר

</span>

</div>



<CardTitle className="text-xl">

בדקו את עצמכם — 5 שאלות, 2 דקות

</CardTitle>


</CardHeader>





<CardContent>


{
finished ? (


<div className="flex flex-col items-center py-8 text-center">


<div className="
mb-3 flex h-16 w-16 items-center
justify-center rounded-2xl bg-primary/10 text-primary
">


<Trophy className="h-7 w-7"/>


</div>



<p className="font-display text-2xl font-extrabold">

{score} / {questions.length}

</p>




<p className="mt-1 text-sm text-muted-foreground">


{
score === questions.length

?

"ציון מושלם! נראה שהמושגים האלה כבר ברורים לך."

:

score >= questions.length / 2

?

"לא רע בכלל! כדאי לחזור על המושגים שהחמצת."

:

"התחלה טובה — כדאי לעבור שוב על החומר ולנסות שוב."

}


</p>




<Button

className="mt-6 gap-2"

onClick={handleRestart}

>


<RotateCcw className="h-4 w-4"/>

בוחן חדש


</Button>


</div>


)

:

(


<div>


<div className="mb-5 flex items-center gap-3">


<div className="
h-1.5 flex-1 overflow-hidden
rounded-full bg-muted
">


<motion.div

className="
h-full rounded-full gradient-brand
"

animate={{
width:`${progressPct}%`
}}

transition={{
duration:0.4
}}


/>


</div>




<span className="
whitespace-nowrap text-xs
font-semibold text-muted-foreground
">


{step+1} / {questions.length}


</span>


</div>







<AnimatePresence mode="wait">


<motion.div

key={current.id}

initial={{
opacity:0,
x:12
}}

animate={{
opacity:1,
x:0
}}

exit={{
opacity:0,
x:-12
}}

transition={{
duration:0.25
}}


>


<h4 className="
mb-4 font-display text-base
font-bold leading-relaxed
">


{current.question}


</h4>





<div className="space-y-2">


{

current.options.map(
(option,idx)=>{


const correct =
idx === current.correctIndex;


const chosen =
idx === selected;


const show =
selected !== null;



return (

<button

key={option}

disabled={show}

onClick={()=>
handleAnswer(idx)
}


className={cn(

"flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-right text-sm font-medium transition-colors",

!show &&
"border-border hover:bg-accent",

show &&
correct &&
"border-success bg-success/10 text-success",

show &&
chosen &&
!correct &&
"border-danger bg-danger/10 text-danger",

show &&
!chosen &&
!correct &&
"border-border opacity-50"

)}

>


{option}



{
show &&
correct &&
<Check className="h-4 w-4 shrink-0"/>
}



{
show &&
chosen &&
!correct &&
<X className="h-4 w-4 shrink-0"/>
}



</button>


);


}

)

}


</div>







{
selected!==null &&

<motion.div

initial={{
opacity:0,
height:0
}}

animate={{
opacity:1,
height:"auto"
}}

className="
mt-4 overflow-hidden rounded-xl
bg-muted/50 p-4 text-xs
leading-relaxed text-muted-foreground
"

>

{current.explanation}

</motion.div>

}






{
selected!==null &&


<Button

className="mt-4 w-full"

onClick={handleNext}

>

{
step+1 >= questions.length

?

"סיום הבוחן"

:

"לשאלה הבאה"

}


</Button>

}



</motion.div>


</AnimatePresence>



</div>


)

}


</CardContent>


</Card>


</motion.div>


);


}