export type AppLanguage = "he" | "en";

const LANGUAGE_PREFERENCE_KEY = "invested_language_preference";

export function getLanguagePreference(): AppLanguage {
  if (typeof window === "undefined") {
    return "he";
  }

  const stored = window.localStorage.getItem(LANGUAGE_PREFERENCE_KEY);
  return stored === "en" ? "en" : "he";
}

export function setLanguagePreference(language: AppLanguage): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LANGUAGE_PREFERENCE_KEY, language);
}
