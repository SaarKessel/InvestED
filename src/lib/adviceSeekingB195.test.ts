import { describe, expect, it } from "vitest";
import { createQAMemory, planFinancialQA } from "./financialQA";
const refused = (q: string, l: "en" | "he") => planFinancialQA(q, l, createQAMemory())?.kind === "advice_boundary";
describe("B195 pick-a-stock / where-to-put-money phrasings get the advice boundary", () => {
  it.each([
    "pick me a stock to buy", "recommend a stock", "tell me what to buy", "best stock to buy right now", "give me a hot stock tip",
    "where should I put my money", "is AAPL a buy", "is now a good time to sell", "what to buy with 10000 dollars", "should I put my savings into bitcoin",
    "what should I buy tomorrow", "which stock should I buy", "should I buy NVDA now?",
  ])("EN %s", (q) => expect(refused(q, "en")).toBe(true));
  it.each([
    "איזו מניה לקנות", "במה להשקיע", "תמליץ לי על מניה", "תמליצי לי על מניה לקנות", "מה לקנות מחר", "האם לקנות מניות של טסלה",
    "איזו מניה תעלה מחר", "תן לי טיפ למניה חמה", "לקנות או למכור את אנבידיה", "אפל קנייה?", "איפה כדאי לשים 100 אלף שקל", "מה כדאי לי לקנות מחר",
  ])("HE %s", (q) => expect(refused(q, "he")).toBe(true));
  it.each([
    ["what is a stock?", "en"], ["how many shares of AAPL can I buy with 1000 dollars", "en"], ["what does buy and hold mean", "en"], ["is a buy order a market order", "en"],
    ["כמה מניות אפשר לקנות ב-1000 דולר", "he"], ["מהי מניה?", "he"], ["מה זה קנייה ומכירה בבורסה", "he"],
  ] as const)("not refused: %s", (q, l) => expect(refused(q, l)).toBe(false));
});
