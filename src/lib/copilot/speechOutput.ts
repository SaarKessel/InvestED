/** Spoken replies via the browser's own speechSynthesis (free, on-device, no API call). */
export interface VoiceLike { lang: string; name: string; default?: boolean; localService?: boolean }
export const hasHebrew = (text: string): boolean => /[\u0590-\u05FF]/.test(text);
export const textLocale = (text: string): "he-IL" | "en-US" => (hasHebrew(text) ? "he-IL" : "en-US");
export function getSynth(win: unknown = typeof window === "undefined" ? undefined : window): SpeechSynthesis | null {
  const w = win as { speechSynthesis?: SpeechSynthesis; SpeechSynthesisUtterance?: unknown } | undefined;
  return w?.speechSynthesis && w.SpeechSynthesisUtterance ? w.speechSynthesis : null;
}
/** Picks a voice for the language; null means the device has none (callers must say so, not stay silent). */
export function pickVoice<T extends VoiceLike>(voices: T[], locale: string): T | null {
  const base = locale.slice(0, 2).toLowerCase();
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const exact = voices.filter((v) => norm(v.lang) === locale.toLowerCase());
  const same = voices.filter((v) => norm(v.lang).startsWith(base));
  const pool = exact.length ? exact : same;
  return pool.find((v) => v.localService) ?? pool[0] ?? null;
}
/** Removes markup and symbols a voice would read aloud as noise. */
export function cleanForSpeech(text: string): string {
  return text.replace(/```[\s\S]*?```/g, " ").replace(/https?:\/\/\S+/g, " ").replace(/[*_#>`|~]+/g, " ").replace(/\u200e|\u200f/g, "").replace(/\s+/g, " ").trim();
}
/** Splits long text into sentence chunks; some mobile engines cut off long utterances. */
export function chunkForSpeech(text: string, max = 220): string[] {
  const out: string[] = []; let cur = "";
  for (const s of text.split(/(?<=[.!?։׃\n])\s+/)) {
    if ((cur + " " + s).trim().length > max && cur) { out.push(cur.trim()); cur = s; } else cur = (cur + " " + s).trim();
  }
  if (cur) out.push(cur.trim());
  return out.flatMap((c) => (c.length > max * 2 ? c.match(new RegExp(`.{1,${max}}(?:\\s|$)|.{1,${max}}`, "g")) ?? [c] : [c]));
}
export type SpeakResult = "started" | "no_voice" | "unsupported";
/** Speaks text; resolves "no_voice" when the device has no voice for that language. */
export function speak(text: string, onEnd?: () => void): SpeakResult {
  const synth = getSynth(); if (!synth) return "unsupported";
  const clean = cleanForSpeech(text); if (!clean) return "unsupported";
  const locale = textLocale(clean);
  const voice = pickVoice(synth.getVoices(), locale);
  if (!voice && locale === "he-IL" && synth.getVoices().length > 0) return "no_voice";
  synth.cancel();
  const chunks = chunkForSpeech(clean);
  chunks.forEach((chunk, i) => {
    const u = new SpeechSynthesisUtterance(chunk);
    u.lang = voice?.lang ?? locale; if (voice) u.voice = voice as SpeechSynthesisVoice;
    if (i === chunks.length - 1) { u.onend = () => onEnd?.(); u.onerror = () => onEnd?.(); }
    synth.speak(u);
  });
  return "started";
}
export function stopSpeaking(): void { getSynth()?.cancel(); }
/** Call inside a tap handler: mobile browsers only allow speech after a user gesture. */
export function unlockSpeech(): void {
  const synth = getSynth(); if (!synth) return;
  const u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u);
}
