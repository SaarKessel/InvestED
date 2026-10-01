/** Phase 3: browser speech-to-text (Web Speech API). Free, no API call from our side. */
export interface SpeechRecognitionLike {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((event?: { error?: string }) => void) | null; onend: (() => void) | null;
  onstart?: (() => void) | null; onaudiostart?: (() => void) | null; onspeechstart?: (() => void) | null; onnomatch?: (() => void) | null;
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

export type VoiceProblem = "permission" | "service" | "no_speech" | "no_mic" | "network" | "language" | "unsupported" | null;
/** Maps the browser's error code to what the user can actually do. "aborted" is a normal stop, not a problem. */
export function voiceProblem(code: string | undefined): VoiceProblem {
  switch (code) {
    case "not-allowed": return "permission";
    case "service-not-allowed": return "service";
    case "no-speech": return "no_speech";
    case "audio-capture": return "no_mic";
    case "network": return "network";
    case "language-not-supported": return "language";
    case "aborted": return null;
    default: return "permission";
  }
}

/** iPhone and iPad, including iPadOS that reports as a Mac. Every iOS browser runs WebKit. */
export function isIOS(nav: { userAgent?: string; platform?: string; maxTouchPoints?: number } | undefined = typeof navigator === "undefined" ? undefined : navigator): boolean {
  if (!nav) return false;
  return /iPhone|iPad|iPod/.test(nav.userAgent ?? "") || (nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1);
}
