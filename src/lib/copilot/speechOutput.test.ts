import { describe, expect, it } from "vitest";
import { chunkForSpeech, cleanForSpeech, getSynth, hasHebrew, pickVoice, textLocale } from "./speechOutput";
describe("speech output", () => {
  it("detects language from the text", () => { expect(textLocale("מה זה ריבית?")).toBe("he-IL"); expect(textLocale("What is interest?")).toBe("en-US"); expect(hasHebrew("abc")).toBe(false); });
  it("picks exact, then same-language, else null", () => {
    const v = [{ lang: "en-GB", name: "a" }, { lang: "he_IL", name: "h" }, { lang: "en-US", name: "u" }];
    expect(pickVoice(v, "he-IL")?.name).toBe("h"); expect(pickVoice(v, "en-US")?.name).toBe("u");
    expect(pickVoice([{ lang: "en-GB", name: "a" }], "he-IL")).toBeNull();
    expect(pickVoice([{ lang: "en-GB", name: "a" }], "en-US")?.name).toBe("a");
  });
  it("cleans markup and links", () => { expect(cleanForSpeech("**Hi** see https://x.com `code` ok")).toBe("Hi see code ok"); });
  it("chunks long text by sentence", () => { const c = chunkForSpeech("One sentence here. ".repeat(30), 100); expect(c.length).toBeGreaterThan(1); expect(c.every((x) => x.length <= 200)).toBe(true); });
  it("reports unsupported browsers", () => { expect(getSynth({})).toBeNull(); });
});
