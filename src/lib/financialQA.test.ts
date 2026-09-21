// ---------------------------------------------------------------------------
// InvestED — Financial Q&A benchmark
//
// Broad, natural-language coverage of the deterministic financial Q&A engine:
// both languages, paraphrases, tricky wording, missing-input clarification,
// multi-turn follow-ups, mixed RTL text, and unavailable-data behavior.
// ---------------------------------------------------------------------------

import { describe, expect, it, vi } from "vitest";
import type { MarketAsset } from "@/types";
import { processAIMessage, type AIConversationDependencies } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";

function fixture(symbol: string, source: "yahoo_finance" | "mock" = "yahoo_finance"): MarketAsset {
  return {
    symbol, name: symbol, price: 100, changePercent: 1, currency: "USD",
    history: [100, 101, 100, 103].map((price, i) => ({ date: `2026-01-0${i + 1}`, price, open: price, high: price, low: price, close: price })),
    dataSource: source, timestamp: "2026-09-21T07:00:00Z",
    freshness: source === "mock" ? "simulated" : "current", isMock: source === "mock",
  };
}

function setup(overrides: Partial<Record<string, MarketAsset | null>> = {}) {
  const fetchAsset = vi.fn(async (symbol: string) => (symbol in overrides ? overrides[symbol]! : fixture(symbol)));
  const deps: AIConversationDependencies = { fetchAsset, enhance: vi.fn(async () => null) };
  return { deps, fetchAsset };
}

const NO_METADATA = /מקור|עדכניות|חותמת זמן|Source:|freshness:/i;

async function ask(message: string, lang: "he" | "en" = "he", overrides: Parameters<typeof setup>[0] = {}) {
  const { deps, fetchAsset } = setup(overrides);
  const turn = await processAIMessage(createConversationSession(), message, lang, deps);
  return { turn, fetchAsset };
}

describe("financial QA benchmark — concepts", () => {
  it("explains an ETF in Hebrew with a direct answer", async () => {
    const { turn, fetchAsset } = await ask("מה זה תעודת סל?");
    expect(turn.response.text).toContain("נסחרת בבורסה");
    expect(fetchAsset).not.toHaveBeenCalled();
  });
  it("explains an ETF in English", async () => {
    const { turn } = await ask("What is an ETF?", "en");
    expect(turn.response.text).toContain("exchange");
  });
  it("answers a difference-between question with both sides labeled", async () => {
    const { turn } = await ask("מה ההבדל בין קרן נאמנות לתעודת סל?");
    expect(turn.response.text).toContain("קרן נאמנות");
    expect(turn.response.text).toContain("קרן סל");
  });
  it("answers an English stock-vs-bond difference", async () => {
    const { turn } = await ask("What is the difference between a stock and a bond?", "en");
    expect(turn.response.text).toContain("Stock");
    expect(turn.response.text).toContain("Bond");
  });
  it.each([
    ["מה זה מינוף?", "כסף שאול"],
    ["מה זה שורט?", "מכירה בחסר"],
    ["מה זו קרן השתלמות?", "פטור"],
    ["מה זה כלל ה-72?", "72"],
  ])("explains %s", async (q, needle) => {
    const { turn } = await ask(q);
    expect(turn.response.text).toContain(needle);
  });
  it.each([
    ["What is dollar cost averaging?", "fixed amount"],
    ["What is a REIT?", "real estate"],
    ["What does blue chip mean?", "established"],
  ])("explains %s", async (q, needle) => {
    const { turn } = await ask(q, "en");
    expect(turn.response.text).toContain(needle);
  });
});

describe("financial QA benchmark — percentages", () => {
  it("computes percent of an amount in Hebrew", async () => {
    const { turn } = await ask("כמה זה 15% מ-80,000 שקל?");
    expect(turn.response.text).toContain("12,000");
    expect(turn.response.text).not.toMatch(NO_METADATA);
  });
  it("computes percent of an amount in English", async () => {
    const { turn } = await ask("what is 15% of 80,000?", "en");
    expect(turn.response.text).toContain("12,000");
  });
  it("computes part-of-total percent in Hebrew", async () => {
    const { turn } = await ask("כמה אחוזים זה 50 מתוך 200?");
    expect(turn.response.text).toContain("25%");
  });
  it("computes part-of-total percent in English", async () => {
    const { turn } = await ask("what percent is 50 of 200?", "en");
    expect(turn.response.text).toContain("25%");
  });
  it("adds a percent on top of an amount", async () => {
    const { turn } = await ask("כמה זה 80,000 פלוס 15%?");
    expect(turn.response.text).toContain("92,000");
  });
  it("subtracts a percent (discount)", async () => {
    const { turn } = await ask("כמה זה 200 פחות 10%?");
    expect(turn.response.text).toContain("180");
  });
  it("computes percent change up in Hebrew", async () => {
    const { turn } = await ask("המניה עלתה מ-80 ל-100, בכמה אחוזים היא עלתה?");
    expect(turn.response.text).toContain("עלייה של 25%");
  });
  it("computes percent change down in English", async () => {
    const { turn } = await ask("the price fell from 200 to 150, what is the change?", "en");
    expect(turn.response.text).toContain("25% decrease");
  });
});

describe("financial QA benchmark — tricky phrasing", () => {
  it("answers the classic recovery question in Hebrew", async () => {
    const { turn } = await ask("אם המניה ירדה ב-50%, בכמה אחוזים היא צריכה לעלות כדי לחזור לקדמותה?");
    expect(turn.response.text).toContain("100%");
  });
  it("answers the recovery question in English", async () => {
    const { turn } = await ask("a stock is down 20%, how much does it need to recover?", "en");
    expect(turn.response.text).toContain("25%");
  });
  it("computes gain with quantity in Hebrew", async () => {
    const { turn } = await ask("קניתי 50 מניות ב-100 ומכרתי ב-120, כמה הרווחתי?");
    expect(turn.response.text).toContain("רווח של 20");
    expect(turn.response.text).toContain("20%");
    expect(turn.response.text).toContain("1,000");
  });
  it("computes a loss with quantity in English", async () => {
    const { turn } = await ask("I bought 10 shares at 50 and sold at 40. How much did I lose?", "en");
    expect(turn.response.text).toContain("loss of 10");
    expect(turn.response.text).toContain("20%");
    expect(turn.response.text).toContain("100");
  });
  it("computes CAGR in Hebrew", async () => {
    const { turn } = await ask("מה התשואה השנתית הממוצעת אם 100 אלף גדלו ל-180 אלף ב-6 שנים?");
    expect(turn.response.text).toContain("10.29%");
  });
  it("computes CAGR in English", async () => {
    const { turn } = await ask("what is the CAGR from 100k to 180k over 6 years?", "en");
    expect(turn.response.text).toContain("10.29%");
  });
  it("answers doubling time with rule of 72 in Hebrew", async () => {
    const { turn } = await ask("בתשואה של 10% לשנה, תוך כמה זמן הכסף מוכפל?");
    expect(turn.response.text).toContain("7.3");
  });
  it("answers doubling time in English", async () => {
    const { turn } = await ask("at 8% a year, how long until my money doubles?", "en");
    expect(turn.response.text).toContain("9");
  });
});

describe("financial QA benchmark — interest, dividends, ratios", () => {
  it("computes simple interest in Hebrew", async () => {
    const { turn } = await ask("כמה זה ריבית פשוטה של 5% על 200 אלף שקל לשנה?");
    expect(turn.response.text).toContain("10,000");
  });
  it("computes simple interest over years in English", async () => {
    const { turn } = await ask("simple interest of 4% on 10,000 for 3 years", "en");
    expect(turn.response.text).toContain("1,200");
    expect(turn.response.text).toContain("11,200");
  });
  it("computes dividend yield in Hebrew", async () => {
    const { turn } = await ask("מניה במחיר 120 מחלקת דיבידנד של 3 לשנה, מה תשואת הדיבידנד?");
    expect(turn.response.text).toContain("2.5%");
  });
  it("computes dividend yield in English", async () => {
    const { turn } = await ask("dividend of 5 with a price of 100, what is the yield?", "en");
    expect(turn.response.text).toContain("5%");
  });
  it("computes average cost basis in Hebrew", async () => {
    const { turn } = await ask("קניתי 10 מניות ב-100 ועוד 20 מניות ב-90, מה המחיר הממוצע?");
    expect(turn.response.text).toContain("93.33");
  });
  it("computes average cost basis in English", async () => {
    const { turn } = await ask("what is my average if I have 10 shares at 100 and 5 shares at 120?", "en");
    expect(turn.response.text).toContain("106.67");
  });
  it("computes P/E in Hebrew", async () => {
    const { turn } = await ask("מה מכפיל הרווח אם המחיר 100 והרווח למניה 4?");
    expect(turn.response.text).toContain("25");
  });
  it("computes P/E in English", async () => {
    const { turn } = await ask("what is the P/E with a price of 50 and EPS of 2?", "en");
    expect(turn.response.text).toContain("25");
  });
});

describe("financial QA benchmark — inflation, fees, allocation", () => {
  it("computes inflation erosion in Hebrew", async () => {
    const { turn } = await ask("מה יהיה שווי 100 אלף שקל בעוד 10 שנים עם אינפלציה של 3%?");
    expect(turn.response.text).toContain("74,409.39");
    expect(turn.response.text).toContain("134,391.64");
  });
  it("asks for the missing inflation rate instead of guessing", async () => {
    const { turn } = await ask("מה יהיה שווי 100 אלף בעוד 10 שנים עם אינפלציה?");
    expect(turn.clarification).toBeTruthy();
    expect(turn.response.text).toContain("קצב האינפלציה");
  });
  it("compares fund fees over time in Hebrew", async () => {
    const { turn } = await ask("מה ההבדל בין דמי ניהול של 1% ל-0.2% על 100 אלף ל-20 שנה?");
    expect(turn.response.text).toContain("פער של כ-");
    expect(turn.response.text).toContain("0.2%");
    expect(turn.response.text).toContain("1%");
  });
  it("clarifies a fee comparison missing amount and years", async () => {
    const { turn } = await ask("כמה יעלו דמי ניהול של 1% מול 0.2%?");
    expect(turn.response.text).toContain("סכום");
  });
  it("splits an allocation in Hebrew", async () => {
    const { turn } = await ask("יש לי 100 אלף שקל, איך לחלק 60% מניות 40% אג\"ח?");
    expect(turn.response.text).toContain("60,000");
    expect(turn.response.text).toContain("40,000");
  });
  it("splits an allocation in English", async () => {
    const { turn } = await ask("split 10,000 into 70% stocks and 30% bonds", "en");
    expect(turn.response.text).toContain("7,000");
    expect(turn.response.text).toContain("3,000");
  });
  it("computes a rebalance move in Hebrew", async () => {
    const { turn } = await ask("התיק שלי שווה 200 אלף, כרגע 70% מניות ואני רוצה לאזן ל-60%");
    expect(turn.response.text).toContain("20,000");
  });
});

describe("financial QA benchmark — splits, loans, taxes, boundaries", () => {
  it("computes a stock split in English", async () => {
    const { turn } = await ask("I have 10 shares at 1000, what happens in a 10-for-1 split?", "en");
    expect(turn.response.text).toContain("100 shares");
    expect(turn.response.text).toContain("100");
  });
  it("computes a stock split in Hebrew", async () => {
    const { turn } = await ask("פיצול של 1 ל-10 על 5 מניות במחיר 500");
    expect(turn.response.text).toContain("50 מניות");
  });
  it("computes a Hebrew mortgage payment", async () => {
    const { turn } = await ask("משכנתא של 1.2 מיליון בריבית 4.8% ל-25 שנה, מה ההחזר החודשי?");
    expect(turn.response.text).toContain("החזר חודשי קבוע");
    expect(turn.response.text).toContain("ריבית");
  });
  it("computes an English mortgage payment", async () => {
    const { turn } = await ask("what is the monthly payment on a 500k mortgage at 5% for 30 years?", "en");
    expect(turn.response.text).toContain("2,684");
  });
  it("estimates Israeli capital gains tax with caveats", async () => {
    const { turn } = await ask("כמה מס אשלם בישראל על רווח של 10,000 שקל?");
    expect(turn.response.text).toContain("2,500");
    expect(turn.response.text).toContain("לא ייעוץ מס");
  });
  it("asks for jurisdiction when a tax question has none", async () => {
    const { turn } = await ask("כמה מס אשלם על רווח של 10,000?");
    expect(turn.response.text).toContain("מדינה");
  });
  it("computes tax at an explicitly stated rate", async () => {
    const { turn } = await ask("what is the tax on a 10,000 gain at 25%?", "en");
    expect(turn.response.text).toContain("2,500");
  });
  it("holds the advice boundary in Hebrew", async () => {
    const { turn } = await ask("כדאי לי לקנות עכשיו מניות?");
    expect(turn.response.text).toContain("לא יכולה לומר לך מה לקנות");
  });
  it("holds the advice boundary in English", async () => {
    const { turn } = await ask("should I invest in stocks now?", "en");
    expect(turn.response.text).toContain("cannot tell you what to buy");
  });
});

describe("financial QA benchmark — live market answers without metadata noise", () => {
  const vym = { ...fixture("VYM"), price: 140, currency: "USD" };
  const fx35 = { ...fixture("USDILS=X"), price: 3.5, currency: "ILS" };

  it("values holdings with real data and no provenance line", async () => {
    const { turn } = await ask("אם יש לי 199 מניות של TSLA מה השווי של זה?", "he", { TSLA: { ...fixture("TSLA"), price: 250.25 } });
    expect(turn.response.holdingValuation?.total).toBeCloseTo(49_799.75, 6);
    expect(turn.response.text).toContain("49,799.75");
    expect(turn.response.text).not.toMatch(NO_METADATA);
    expect(turn.response.dataSources).toContain("yahoo_finance");
  });
  it("refuses to value holdings from simulated data", async () => {
    const { turn } = await ask("אם יש לי 199 מניות של TSLA מה השווי?", "he", { TSLA: fixture("TSLA", "mock") });
    expect(turn.response.holdingValuation?.available).toBe(false);
    expect(turn.response.text).toContain("לא אשתמש בנתונים מדומים");
  });
  it("computes cross-currency buying power (the user's benchmark)", async () => {
    const { turn } = await ask("יש לי 300 אלף שקל, לפי שער עדכני כמה מניות של VYM אוכל לקנות?", "he", { VYM: vym, "USDILS=X": fx35 });
    expect(turn.response.purchasePower?.wholeShares).toBe(612);
    expect(turn.response.text).toContain("מניות שלמות");
    expect(turn.response.text).not.toMatch(NO_METADATA);
  });
  it("converts USD to ILS with a live rate", async () => {
    const { turn } = await ask("כמה זה 1,000 דולר בשקלים?", "he", { "USDILS=X": fx35 });
    expect(turn.response.text).toContain("3,500 ILS");
  });
  it("converts USD to EUR in English", async () => {
    const { turn } = await ask("convert 100 USD to EUR", "en", { "USDEUR=X": { ...fixture("USDEUR=X"), price: 0.85, currency: "EUR" } });
    expect(turn.response.text).toContain("85 EUR");
  });
  it("converts ILS to EUR through the USD bridge", async () => {
    const { turn } = await ask("כמה זה 3,500 שקל ביורו?", "he", { "USDILS=X": fx35, "USDEUR=X": { ...fixture("USDEUR=X"), price: 0.85, currency: "EUR" } });
    expect(turn.response.text).toContain("850 EUR");
  });
  it("refuses FX conversion on simulated rates", async () => {
    const { turn } = await ask("כמה זה 1,000 דולר בשקלים?", "he", { "USDILS=X": fixture("USDILS=X", "mock") });
    expect(turn.response.text).toContain("לא אשתמש בשער מדומה");
  });
});

describe("financial QA benchmark — multi-turn follow-ups", () => {
  const vym = { ...fixture("VYM"), price: 140, currency: "USD" };
  const fx35 = { ...fixture("USDILS=X"), price: 3.5, currency: "ILS" };

  it("revalues a new quantity of the same holding", async () => {
    const { deps } = setup({ TSLA: { ...fixture("TSLA"), price: 250.25 } });
    const session = createConversationSession();
    await processAIMessage(session, "אם יש לי 199 מניות של TSLA מה השווי?", "he", deps);
    const follow = await processAIMessage(session, "ועם 50 מניות?", "he", deps);
    expect(follow.response.holdingValuation?.quantity).toBe(50);
    expect(follow.response.text).toContain("12,512.5");
  });
  it("revalues the same quantity of a new symbol", async () => {
    const { deps } = setup({ TSLA: { ...fixture("TSLA"), price: 250.25 } });
    const session = createConversationSession();
    await processAIMessage(session, "אם יש לי 199 מניות של TSLA מה השווי?", "he", deps);
    const follow = await processAIMessage(session, "ומה עם NVDA?", "he", deps);
    expect(follow.response.holdingValuation?.symbol).toBe("NVDA");
    expect(follow.response.text).toContain("19,900");
  });
  it("recomputes buying power for a new amount", async () => {
    const { deps } = setup({ VYM: vym, "USDILS=X": fx35 });
    const session = createConversationSession();
    await processAIMessage(session, "יש לי 300 אלף שקל, לפי שער עדכני כמה מניות של VYM אוכל לקנות?", "he", deps);
    const follow = await processAIMessage(session, "ועם 500 אלף?", "he", deps);
    expect(follow.response.purchasePower?.wholeShares).toBe(1020);
  });
  it("recomputes buying power for a new symbol", async () => {
    const { deps } = setup({ VYM: vym, QQQ: { ...fixture("QQQ"), price: 500 }, "USDILS=X": fx35 });
    const session = createConversationSession();
    await processAIMessage(session, "יש לי 300 אלף שקל, כמה מניות של VYM אוכל לקנות?", "he", deps);
    const follow = await processAIMessage(session, "ומה עם QQQ?", "he", deps);
    expect(follow.response.purchasePower?.symbol).toBe("QQQ");
    expect(follow.response.purchasePower?.wholeShares).toBe(171);
  });
  it("keeps sessions isolated for follow-up memory", async () => {
    const { deps } = setup({ VYM: vym, "USDILS=X": fx35 });
    await processAIMessage(createConversationSession(), "יש לי 300 אלף שקל, כמה מניות של VYM אוכל לקנות?", "he", deps);
    const other = await processAIMessage(createConversationSession(), "ועם 500 אלף?", "he", deps);
    expect(other.response.purchasePower).toBeNull();
  });
});

describe("financial QA benchmark — graceful unsupported behavior", () => {
  it("does not invent numbers for a non-financial question", async () => {
    const { turn } = await ask("מה השעה עכשיו?");
    expect(turn.response.text).not.toMatch(/\d/);
  });
  it("does not invent a price when market data is unavailable", async () => {
    const { turn } = await ask("מה המחיר של NVDA?", "he", { NVDA: null });
    expect(turn.response.text).toContain("אינם זמינים");
    expect(turn.response.text).not.toMatch(/\d+\.\d+/);
  });
});
