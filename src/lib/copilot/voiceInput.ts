/** Phase 3: browser speech-to-text (Web Speech API). Free, no API call from our side. */
export interface SpeechRecognitionLike {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
  start(): void; stop(): void;
}
type Ctor = new () => SpeechRecognitionLike;

export function getSpeechRecognition(win: unknown = typeof window === "undefined" ? undefined : window): Ctor | null {
  const w = win as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor } | undefined;
  return w?.SpeechRecognition ?? w?.webkitSpeechRecognition ?? null;
}
export const speechLocale = (language: string): string => (language === "he" ? "he-IL" : "en-US");

/** Joins recognized segments into the text that should land in the input. */
export function joinTranscript(results: ArrayLike<ArrayLike<{ transcript: string }>>): string {
  return Array.from(results).map((r) => r[0]?.transcript ?? "").join(" ").replace(/\s+/g, " ").trim();
}
/** Appends dictated text to whatever is already typed, never replacing it. */
export function appendDictation(existing: string, dictated: string): string {
  const d = dictated.trim(); if (!d) return existing;
  return existing.trim() ? `${existing.trimEnd()} ${d}` : d;
}
