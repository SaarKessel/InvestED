/** Languages supported by GapSheet. Hebrew is the default; every user-facing string has a natural Hebrew and English form. */
export type Lang = "he" | "en";
export const LANGS: Lang[] = ["he", "en"];
export const isLang = (v: unknown): v is Lang => v === "he" || v === "en";
export const dirOf = (lang: Lang): "rtl" | "ltr" => (lang === "he" ? "rtl" : "ltr");
/** Pick the string for a language. Keeps both versions side by side so they stay in sync when edited. */
export const pick = <T>(lang: Lang, he: T, en: T): T => (lang === "en" ? en : he);

/** Clock text (HH:MM) for the save status and version list. Hebrew follows the Israeli 24-hour policy whatever the device locale is; English keeps the existing device-locale format. Display only: the stored ISO value and the time zone are untouched. */
export function formatClock(iso: string, lang: Lang, timeZone?: string): string {
  const d = new Date(iso);
  return lang === "he"
    ? d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", hour12: false, ...(timeZone ? { timeZone } : {}) })
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", ...(timeZone ? { timeZone } : {}) });
}
