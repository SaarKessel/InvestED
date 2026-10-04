import { describe, expect, it } from "vitest";
import { groundAnswer, isUnknownAnswer, notKnownText } from "./groundedAnswer";
import { UNKNOWN_ANSWER } from "../copilotResponse";
const rows = ["general", "educational_question", "strategy_question", "asset_analysis", "financial_projection", "comparison", "profile_analysis", "unknown-intent"].flatMap((intent) => ["en", "he"].map((lang) => [intent, lang as "en" | "he"] as const));
describe("[sweep] B179 stored retrieval cannot replace an existing engine answer", () => {
  it.each(rows)("intent %s language %s", (intent, lang) => {
    expect(groundAnswer("inflation", lang, intent, "Existing sourced engine answer.")).toBeNull();
    expect(isUnknownAnswer(UNKNOWN_ANSWER[lang])).toBe(true);
    expect(isUnknownAnswer(`${UNKNOWN_ANSWER[lang]} `)).toBe(false);
    const result = groundAnswer("b179unmatchedtopic", lang, intent, UNKNOWN_ANSWER[lang]);
    if (["general", "educational_question", "strategy_question"].includes(intent)) expect(result).toEqual({ kind: "unknown", text: notKnownText(lang), sources: [] });
    else expect(result).toBeNull();
  });
});
describe("[hand] B179 absent knowledge never cites an unrelated book for a ticker score", () => {
  it("the exact reported TSLA score/source query stays unknown in this fallback", () => {
    const result = groundAnswer("מה הציון של TSLA ולמה? תראה לי את המקורות", "he", "general", UNKNOWN_ANSWER.he);
    expect(result).toEqual({ kind: "unknown", text: notKnownText("he"), sources: [] });
    expect(result!.text).not.toContain("Zero to One");
  });
});
