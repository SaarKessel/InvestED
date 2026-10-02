// Small helper for the media-literacy features: every user-facing string carries both languages.
export type Lang = "he" | "en";
export interface Bi { en: string; he: string }
export const pick = (b: Bi, lang: Lang): string => b[lang];
export const bi = (en: string, he: string): Bi => ({ en, he });
