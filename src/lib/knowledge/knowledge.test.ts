import { describe, expect, it } from "vitest";
import { relevantHits, tokenizeQuestion, wantsKnowledgeLookup } from "./knowledge";

const items = [
  { title: "Bank of Israel rate", body: "The Bank of Israel policy interest rate was held at 4.5 percent." },
  { title: "ETF basics", body: "An ETF is a fund that trades like a stock." },
];

describe("knowledge", () => {
  it("drops stop words and keeps Hebrew words", () => {
    expect(tokenizeQuestion("What is the Bank of Israel interest rate?")).toEqual(["bank", "israel", "interest", "rate"]);
    expect(tokenizeQuestion("מה זה דמי ניהול?")).toEqual(["דמי", "ניהול"]);
  });
  it("needs two shared words for a longer question", () => {
    expect(relevantHits("What is the Bank of Israel interest rate?", items)).toHaveLength(1);
    expect(relevantHits("Is a stock a good rate of return story?", items)).toHaveLength(0);
  });
  it("accepts a single word for a very short question", () => {
    expect(relevantHits("what is an ETF", items)[0].title).toBe("ETF basics");
  });
  it("only looks up general-style intents", () => {
    expect(wantsKnowledgeLookup("general")).toBe(true);
    expect(wantsKnowledgeLookup("asset_analysis")).toBe(false);
  });
});
