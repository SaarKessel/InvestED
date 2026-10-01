import { describe, expect, it } from "vitest";
import { appendDictation, getSpeechRecognition, joinTranscript, speechLocale } from "./voiceInput";
describe("voice input", () => {
  it("detects support and hides gracefully when absent", () => {
    expect(getSpeechRecognition({})).toBeNull();
    class X {}
    expect(getSpeechRecognition({ webkitSpeechRecognition: X })).toBe(X);
  });
  it("maps language to locale", () => { expect(speechLocale("he")).toBe("he-IL"); expect(speechLocale("en")).toBe("en-US"); });
  it("joins segments and appends without replacing typed text", () => {
    expect(joinTranscript([[{ transcript: "מה המחיר" }], [{ transcript: " של VOO" }]])).toBe("מה המחיר של VOO");
    expect(appendDictation("", "hello")).toBe("hello");
    expect(appendDictation("compare ", "VOO and QQQ")).toBe("compare VOO and QQQ");
    expect(appendDictation("keep", "  ")).toBe("keep");
  });
});

import { voiceProblem } from "./voiceInput";
describe("voiceProblem", () => {
  it("tells permission from no speech, network, mic and language", () => {
    expect(voiceProblem("not-allowed")).toBe("permission");
    expect(voiceProblem("no-speech")).toBe("no_speech"); expect(voiceProblem("audio-capture")).toBe("no_mic");
    expect(voiceProblem("network")).toBe("network"); expect(voiceProblem("language-not-supported")).toBe("language");
    expect(voiceProblem("aborted")).toBeNull(); expect(voiceProblem(undefined)).toBe("permission");
  });
});

import { isIOS } from "./voiceInput";
describe("iOS and service errors", () => {
  it("service-not-allowed is its own problem, separate from microphone permission", () => { expect(voiceProblem("service-not-allowed")).toBe("service"); });
  it("detects iPhone, iPad and iPadOS-as-Mac, not Android or desktop", () => {
    expect(isIOS({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" })).toBe(true);
    expect(isIOS({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 5 })).toBe(true);
    expect(isIOS({ userAgent: "Mozilla/5.0 (Linux; Android 14)", platform: "Linux armv8l", maxTouchPoints: 5 })).toBe(false);
    expect(isIOS({ userAgent: "Mozilla/5.0 (Macintosh)", platform: "MacIntel", maxTouchPoints: 0 })).toBe(false);
  });
});
