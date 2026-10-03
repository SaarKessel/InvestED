import { describe, expect, it } from "vitest";
import { appendDictation, joinTranscript, isIOS, speechLocale, voiceProblem } from "./voiceInput";
const rows = ["", "  ", "Typed question", "  Typed question  ", "שאלה קיימת"].flatMap((existing) => ["", "  ", "new words", "  new words  ", "מילים חדשות"].map((dictated) => [existing, dictated] as const));
describe("[sweep] B156 dictation appends without replacing typed content", () => {
  it.each(rows)("existing %s dictated %s", (existing, dictated) => {
    const d = dictated.trim();
    expect(appendDictation(existing, dictated)).toBe(!d ? existing : existing.trim() ? `${existing.trimEnd()} ${d}` : d);
  });
});
const platforms = ["MacIntel", "Linux", "Win32", undefined];
const iosRows = ["iPhone", "iPad", "iPod", "Chrome", undefined].flatMap((userAgent) => platforms.flatMap((platform) => [0, 1, 2, 5].map((maxTouchPoints) => [userAgent, platform, maxTouchPoints] as const)));
describe("[sweep] B156 iOS browser detection preserves iPad desktop-mode exception", () => {
  it.each(iosRows)("UA %s platform %s touch %s", (userAgent, platform, maxTouchPoints) => expect(isIOS({ userAgent, platform, maxTouchPoints })).toBe(/iPhone|iPad|iPod/.test(userAgent ?? "") || (platform === "MacIntel" && maxTouchPoints > 1)));
});
describe("[hand] B156 transcript and voice errors preserve safe UI states", () => {
  it("joins only first transcript choices and normalizes segment whitespace", () => {
    expect(joinTranscript([[{ transcript: "  hello " }, { transcript: "alternative" }], [], [{ transcript: " world  " }]])).toBe("hello world");
    expect(voiceProblem("aborted")).toBeNull();
    expect(voiceProblem("network")).toBe("network");
    expect(voiceProblem("audio-capture")).toBe("no_mic");
    expect(speechLocale("he")).toBe("he-IL");
    expect(speechLocale("en")).toBe("en-US");
    expect(isIOS(undefined)).toBe(false);
  });
});
