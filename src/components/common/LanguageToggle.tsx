import { Language } from "../../lib/i18n";


interface Props {

 language: Language;

 setLanguage:(lang:Language)=>void;

}


export function LanguageToggle({

language,

setLanguage

}:Props){



function changeLanguage(){


const next =

language === "he"

? "en"

: "he";



setLanguage(next);



}



return (

<button

onClick={changeLanguage}

className="rounded-xl border px-4 py-2 text-sm font-medium"

>

{

language === "he"

? "English 🇺🇸"

: "עברית 🇮🇱"

}


</button>

);


}
