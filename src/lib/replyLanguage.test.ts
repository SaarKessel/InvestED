import { describe, expect, it } from "vitest";
import { replyLanguageFor } from "./replyLanguage";

describe("replyLanguageFor", () => {
  it("answers Hebrew questions in Hebrew even when the interface is English", () => { expect(replyLanguageFor("כמה שווה 10 מניות?", "en")).toBe("he"); });
  it("answers English questions in English even when the interface is Hebrew", () => { expect(replyLanguageFor("What is an ETF?", "he")).toBe("en"); });
  it("keeps Hebrew when a ticker sits inside a Hebrew sentence", () => { expect(replyLanguageFor("מה המחיר של TSLA היום", "en")).toBe("he"); });
  it("falls back to the interface language when there are no letters", () => { expect(replyLanguageFor("1000 6% 15", "he")).toBe("he"); expect(replyLanguageFor("???", "en")).toBe("en"); });
});
