import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getLanguagePreference,
  setLanguagePreference,
  type AppLanguage,
} from "@/lib/languagePreferenceStorage";

import enLocale from "@/locales/en.json";
import heLocale from "@/locales/he.json";

export interface LanguageContextValue {
  language: AppLanguage;
  dir: "rtl" | "ltr";
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const dictionaries: Record<AppLanguage, Record<string, string>> = {
  he: heLocale,
  en: enLocale,
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => getLanguagePreference());

  useEffect(() => {
    setLanguagePreference(language);
    const dir = language === "he" ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const dir = language === "he" ? "rtl" : "ltr";
    const currentDict = dictionaries[language] ?? dictionaries.he;

    const t = (key: string, fallback?: string): string => {
      if (currentDict && key in currentDict) {
        return currentDict[key];
      }
      return fallback ?? key;
    };

    return {
      language,
      dir,
      setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
      toggleLanguage: () => setLanguageState((current) => current === "he" ? "en" : "he"),
      t,
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside a LanguageProvider");
  }

  return context;
}

/** Renders children in a fixed language (e.g. the language of the question) regardless of the UI language. */
export function LanguageOverride({ language, children }: { language: AppLanguage; children: React.ReactNode }) {
  const outer = useLanguage();
  const value = useMemo<LanguageContextValue>(() => {
    if (outer.language === language) return outer;
    const dict = dictionaries[language] ?? dictionaries.he;
    return { ...outer, language, dir: language === "he" ? "rtl" : "ltr", t: (key, fallback) => (key in dict ? dict[key] : (fallback ?? key)) };
  }, [outer, language]);
  if (outer.language === language) return <>{children}</>;
  return (
    <LanguageContext.Provider value={value}>
      <div dir={value.dir}>{children}</div>
    </LanguageContext.Provider>
  );
}
