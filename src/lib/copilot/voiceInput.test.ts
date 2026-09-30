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
