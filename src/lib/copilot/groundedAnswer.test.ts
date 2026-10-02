import { describe, expect, it } from "vitest";
import { UNKNOWN_ANSWER } from "../copilotResponse";
import { groundAnswer, isUnknownAnswer, notKnownText } from "./groundedAnswer";

describe("grounded retrieval answer", () => {
  it("leaves answers the engine already produced alone", () => {
    expect(groundAnswer("what is a sharpe ratio", "en", "educational_question", "A real engine answer.")).toBeNull();
  });
  it("leaves non-knowledge intents alone even on the fallback text", () => {
    expect(groundAnswer("sharpe ratio", "en", "asset_analysis", UNKNOWN_ANSWER.en)).toBeNull();
  });
  it("answers from the stored explanation with a source line (en)", () => {
    const g = groundAnswer("explain the sharpe ratio", "en", "general", UNKNOWN_ANSWER.en);
    expect(g?.kind).toBe("grounded");
    expect(g?.text).toContain("Sharpe");
    expect(g?.text).toContain("Source: InvestED concept library");
    expect(g?.sources.length).toBe(1);
  });
  it("answers in Hebrew with a Hebrew source line", () => {
    const g = groundAnswer("מהו יחס שארפ", "he", "educational_question", UNKNOWN_ANSWER.he);
    expect(g?.kind).toBe("grounded");
    expect(g?.text).toContain("מקור: ספריית המושגים של InvestED");
  });
  it("says it is not known when nothing is retrieved, and cites nothing", () => {
    const g = groundAnswer("qqqzzz xxxyyy wwwvvv", "en", "general", UNKNOWN_ANSWER.en);
    expect(g).toEqual({ kind: "unknown", text: notKnownText("en"), sources: [] });
    expect(notKnownText("he")).toMatch(/[א-ת]/);
  });
  it("never adds numbers that are not in the stored text", () => {
    const g = groundAnswer("explain the sharpe ratio", "en", "general", UNKNOWN_ANSWER.en)!;
    const nums = (t: string) => t.match(/\d+/g) ?? [];
    const body = g.text.split("\n\n")[0];
    expect(nums(g.text)).toEqual(nums(body));
  });
  it("recognises both fallback texts", () => {
    expect(isUnknownAnswer(UNKNOWN_ANSWER.he)).toBe(true);
    expect(isUnknownAnswer(UNKNOWN_ANSWER.en)).toBe(true);
    expect(isUnknownAnswer("something else")).toBe(false);
  });
});
