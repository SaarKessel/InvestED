import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, AlertOctagon, Milestone, Info } from "lucide-react";

import type { AnalysisResult } from "@/types";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/primitives";

import {
  Accordion,
  Tooltip,
} from "@/components/ui/interactive";

import {
  FINANCE_CONCEPTS,
  COMMON_MISTAKES,
  LEARNING_ROADMAP,
} from "@/lib/educationContent";

import { useLanguage } from "@/context/languageContext";



export function ConceptsCard(){


  const { t } = useLanguage();


  return (

    <motion.div

      initial={{
        opacity:0,
        y:16,
      }}

      animate={{
        opacity:1,
        y:0,
      }}

      transition={{
        delay:0.35,
      }}

    >

      <Card>


        <CardHeader>


          <div className="flex items-center gap-2 text-primary">

            <BookOpen className="h-4 w-4"/>

            <span className="text-xs font-bold uppercase tracking-wide">

              {t("learning_title", "מושגים שכדאי ללמוד")}

            </span>

          </div>



          <CardTitle className="text-xl">

            {t("learning_terms_label", "מילון מונחים מהיר")}

          </CardTitle>


        </CardHeader>




        <CardContent>


          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{


            FINANCE_CONCEPTS.map(concept=>(


              <Tooltip

                key={concept.term}

                label={concept.definition}

              >

                <span

                  className="
                  w-full cursor-help rounded-lg border
                  border-border bg-muted/30 px-3 py-2
                  text-xs font-semibold transition-colors
                  hover:bg-accent
                  "

                >

                  {concept.term}


                </span>


              </Tooltip>


            ))


          }</div>


        </CardContent>


      </Card>


    </motion.div>


  );



}




export function MistakesCard(){


  const { t } = useLanguage();


  return (

    <motion.div

      initial={{
        opacity:0,
        y:16,
      }}

      animate={{
        opacity:1,
        y:0,
      }}

      transition={{
        delay:0.4,
      }}

    >

      <Card>


        <CardHeader>


          <div className="flex items-center gap-2 text-danger">

            <AlertOctagon className="h-4 w-4"/>

            <span className="text-xs font-bold uppercase tracking-wide">

              {t("learning_mistakes_title", "טעויות נפוצות")}

            </span>


          </div>



          <CardTitle className="text-xl">

            {t("learning_mistakes_subtitle", "מה כדאי להימנע ממנו")}

          </CardTitle>


        </CardHeader>




        <CardContent>


          <div className="grid gap-3 sm:grid-cols-2">{


            COMMON_MISTAKES.map(mistake=>(


              <div

                key={mistake.title}

                className="
                rounded-xl border border-danger/25
                bg-danger/5 p-4
                "

              >

                <p className="mb-1 text-sm font-bold text-danger">

                  {mistake.title}

                </p>


                <p className="text-xs leading-relaxed text-muted-foreground">

                  {mistake.detail}

                </p>


              </div>


            ))


          }</div>


        </CardContent>


      </Card>


    </motion.div>


  );



}




export function RoadmapCard(
{
 result
}:{
 result:AnalysisResult
}
){


  const { t } = useLanguage();



const orderedStages =
useMemo(()=>{


const knowledge =
result.flags.knowledgeLevel;



const base =
LEARNING_ROADMAP ?? [];





  if (knowledge === "experienced") {
    return [
      ...base.slice(2),
      {
        ...base[0],
        title: `${base[0]?.title ?? t("learning_default_title", "בסיס")} (${t("learning_optional_refresh", "רענון אופציונלי")})`,
      },
      {
        ...base[1],
        title: `${base[1]?.title ?? t("learning_default_title", "בסיס")} (${t("learning_optional_refresh", "רענון אופציונלי")})`,
      },
    ];
  }




if(
knowledge === "some"
){

return base.slice(1);

}



return base;


},[
result.flags.knowledgeLevel,

t

]);




const explanation =


result.flags.knowledgeLevel === "experienced"


?


t("learning_note_experienced", "זיהינו שכבר יש לך ידע פיננסי — לכן המסלול מתחיל ישר מהשלבים המתקדמים, ושלבי הבסיס מופיעים בסוף כרענון אופציונלי בלבד.")


:


result.flags.knowledgeLevel === "some"


?


t("learning_note_some", "מכיוון שציינת שיש לך כבר בסיס ידע, דילגנו על שלב המבוא והתחלנו משלב ההיכרות עם שוק ההון.")


:


t("learning_note_unknown", "מכיוון שלא ציינת רמת ידע פיננסית קודמת, בנינו לך מסלול מלא שמתחיל מהבסיס.");




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
delay:0.45
}}

>


<Card>


<CardHeader>


<div className="flex items-center gap-2 text-primary">




<Milestone className="h-4 w-4"/>



<span className="text-xs font-bold uppercase tracking-wide">

  {t("learning_roadmap_title", "מסלול למידה אישי")}

</span>


</div>



<CardTitle className="text-xl">

  {t("learning_where_to_start", "מאיפה להתחיל?")}

</CardTitle>


</CardHeader>






<CardContent>



<div className="
mb-4 flex items-start gap-2 rounded-lg
bg-primary/5 p-3 text-xs leading-relaxed
text-muted-foreground
"
>


<Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"/>


{explanation}


</div>




<Accordion

items={orderedStages.map(stage=>(
{

id:
`${stage.stage}-${stage.title}`,


title:(

<span className="flex items-center gap-2">




<span className="
flex h-6 w-6 items-center
justify-center rounded-full
bg-primary/10 text-[11px]
font-bold text-primary
">

{stage.stage.replace("שלב ","")}

</span>



{stage.title}


</span>

),


content:(

<ul className="space-y-1.5">{


stage.topics.map(topic=>(

<li

key={topic}

className="flex items-start gap-2"
>

<span className="
mt-1.5 h-1 w-1 shrink-0
rounded-full bg-primary
"/>

{topic}

</li>

))


}</ul>

)


}

))}


/>


</CardContent>


</Card>


</motion.div>


);


}
