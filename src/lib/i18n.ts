import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import he from "../locales/he.json";
import en from "../locales/en.json";


export type Language = "he" | "en";


i18n
.use(initReactI18next)
.init({

resources: {

he: {
translation: he
},

en: {
translation: en
}

},


lng:

(localStorage.getItem("language") as Language)

|| "en",


fallbackLng:"en",


interpolation:{
escapeValue:false
}


});


export default i18n;
