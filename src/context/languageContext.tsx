import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  getLanguagePreference,
  setLanguagePreference,
  type AppLanguage,
} from "@/lib/languagePreferenceStorage";

export interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => getLanguagePreference());

  useEffect(() => {
    setLanguagePreference(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
    toggleLanguage: () => setLanguageState((current) => current === "he" ? "en" : "he"),
  }), [language]);

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
