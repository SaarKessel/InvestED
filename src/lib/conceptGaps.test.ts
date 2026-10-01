import { describe, expect, it } from "vitest";
import { explainFinancialConcepts } from "./financialEducation";

describe("concept routing gaps found by the baseline audit", () => {
  const cases: [string, "en" | "he", RegExp][] = [
    ["מה זה מניה?", "he", /חלק קטן מהבעלות/],
    ["What is the stock market?", "en", /buy and sell shares/],
    ["מה זה שוק ההון?", "he", /קונים ומוכרים/],
    ["What is risk in investing?", "en", /chance that the result is different/],
    ["מה זה סיכון בהשקעות?", "he", /הסיכוי שהתוצאה/],
    ["What is the S&P 500?", "en", /about 500 large companies/],
    ["מה זה S&P 500?", "he", /500 חברות/],
    ["What is a provident fund?", "en", /provident fund/],
    ["מה זה ממוצע עלות דולרית?", "he", /אותו סכום/],
    ["What is a robo-advisor?", "en", /questionnaire/],
    ["מה זה יועץ השקעות אוטומטי?", "he", /שאלון/],
    ["Where do I start investing?", "en", /emergency fund/],
    ["מאיפה מתחילים להשקיע?", "he", /קרן חירום/],
  ];
  for (const [q, lang, re] of cases) {
    it(`${lang}: ${q}`, () => expect(explainFinancialConcepts(q, lang)).toMatch(re));
  }
  it("does not hijack a price question", () => {
    expect(explainFinancialConcepts("What is the S&P 500 price today?", "en")).toBeNull();
  });
});
