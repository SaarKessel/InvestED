import { useState } from "react";

import i18n, { Language } from "../lib/i18n";


export function useLanguage(){


const [language,setLanguageState] = useState<Language>(

(localStorage.getItem("language") as Language)

|| "en"

);




function setLanguage(lang:Language){


setLanguageState(lang);


localStorage.setItem(

"language",

lang

);



i18n.changeLanguage(lang);



document.documentElement.dir =

lang === "he"

? "rtl"

: "ltr";



}



return {

language,

setLanguage

};


}
