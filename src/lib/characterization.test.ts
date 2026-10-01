// Characterization of today's routing. Records, for ~100 questions in English and Hebrew, which route the
// planner picks, which tools it names, what intent and engines the older intent stage picks, and how the
// answer text starts. It pins current behaviour so the router merge can be proven not to change it.
// It is not a statement that every answer is ideal. Update the snapshot only on purpose.
import { describe, expect, it, vi } from "vitest";
import type { MarketAsset } from "@/types";
import { processAIMessage, type AIConversationDependencies } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";
import { planQuestion } from "./copilot/planner";

const QUESTIONS: [string, "en" | "he"][] = [
  // concepts
  ["What is a mutual fund?", "en"], ["what is compound interest?", "en"], ["what is diversification", "en"], ["What is an ETF?", "en"], ["explain inflation", "en"],
  ["what is a bond", "en"], ["what is a dividend", "en"], ["what is the P/E ratio", "en"], ["what is RSI", "en"], ["what is volatility", "en"],
  ["what is a stop-loss", "en"], ["what is a recession", "en"], ["what is a deductible", "en"], ["what is APR", "en"], ["what is a credit score", "en"],
  ["מהי קרן נאמנות?", "he"], ["מה זה ריבית דריבית", "he"], ["מה זה פיזור סיכונים", "he"], ["מה זה ETF", "he"], ["הסבר על אינפלציה", "he"],
  ["מה זה אג״ח", "he"], ["מה זה דיבידנד", "he"], ["מה זה RSI?", "he"], ["מה זה תנודתיות", "he"], ["מה זה סטופ לוס", "he"],
  ["מה זה מיתון", "he"], ["מה זו השתתפות עצמית", "he"], ["מה זה ביטוח חיים", "he"], ["מה זה דירוג אשראי", "he"], ["מה זה תקציב", "he"],
  // calculators and math
  ["I have 10000 and add 500 per month for 10 years at 6%", "en"], ["invest 20000 for 15 years at 7%", "en"], ["what is 2+3*4", "en"], ["calculate 15% of 2400", "en"], ["what is 12.5 * 8", "en"],
  ["pmt(200000, 5, 30)", "en"], ["loan of 200000 at 5% for 30 years", "en"], ["I invest 5000 and add 200 per month for 20 years. Then what is 3*7?", "en"], ["what is 100/0", "en"], ["compute (4+6)^2", "en"],
  ["יש לי 10000 ואני מוסיף 500 בחודש ל-10 שנים ב-6%", "he"], ["כמה זה 15% מ-2400", "he"], ["חשב 12.5 כפול 8", "he"], ["הלוואה של 200000 ב-5% ל-30 שנה", "he"], ["כמה זה 100/0", "he"],
  // fx
  ["100 USD to ILS", "en"], ["convert 500 euros to dollars", "en"], ["200 GBP to EUR", "en"], ["כמה זה 100 דולר בשקלים", "he"], ["500 יורו לדולר", "he"],
  // world bank
  ["Israel inflation 2020-2025", "en"], ["US unemployment", "en"], ["GDP growth in Germany", "en"], ["אינפלציה בישראל", "he"], ["אבטלה בארצות הברית", "he"],
  // symbols and market
  ["what is VOO", "en"], ["what is AAPL stock", "en"], ["how much are 10 VOO shares worth?", "en"], ["compare AAPL and MSFT", "en"], ["how is TSLA doing", "en"],
  ["כמה שווה 199 מניות של TSLA?", "he"], ["מה זה VOO", "he"], ["השווה בין AAPL ל-MSFT", "he"], ["מה המחיר של NVDA", "he"], ["מה קורה עם הנאסדק", "he"],
  // data desks
  ["top gainers today", "en"], ["what is the Bank of Israel interest rate", "en"], ["insurance fund yields", "en"], ["המניות שעלו היום", "he"], ["מה ריבית בנק ישראל", "he"],
  // tools and site
  ["open the calculator", "en"], ["I want to practice a career", "en"], ["what can this site do", "en"], ["show me a learning path", "en"], ["open the loan page", "en"],
  ["פתח את המחשבון", "he"], ["אני רוצה להתנסות בקריירה", "he"], ["מה האתר יכול לעשות", "he"], ["תבנה לי מסלול למידה", "he"], ["פתח את עמוד ההלוואות", "he"],
  // strategy and profile
  ["is the dividend strategy right for me", "en"], ["which strategy fits a low risk investor", "en"], ["explain the index fund strategy", "en"], ["האם אסטרטגיית דיבידנד מתאימה לי", "he"], ["איזו אסטרטגיה מתאימה למשקיע זהיר", "he"],
  // tricky and honest-answer cases
  ["will TSLA go up tomorrow", "en"], ["guarantee me 20% returns", "en"], ["what is the weather today", "en"], ["tell me a joke", "en"], ["should I buy bitcoin", "en"],
  ["האם TSLA תעלה מחר", "he"], ["תבטיח לי 20% תשואה", "he"], ["מה מזג האוויר היום", "he"], ["ספר לי בדיחה", "he"], ["כדאי לקנות ביטקוין", "he"],
  // insurance, credit, savings topics
  ["do I need life insurance", "en"], ["how big should an emergency fund be", "en"], ["how does a pension work", "en"], ["fixed vs variable rate", "en"], ["should I refinance my mortgage", "en"],
  ["האם אני צריך ביטוח חיים", "he"], ["כמה גדולה צריכה להיות קרן חירום", "he"], ["איך עובדת פנסיה", "he"], ["ריבית קבועה או משתנה", "he"], ["כדאי למחזר משכנתא", "he"],
];

function fixture(symbol: string): MarketAsset {
  return { symbol, name: symbol, price: 103, changePercent: 2, currency: "USD",
    history: [100, 101, 100, 103].map((price, i) => ({ date: `2026-01-0${i + 1}`, price, open: price, high: price, low: price, close: price })),
    dataSource: "yahoo_finance", timestamp: "2026-09-21T07:00:00Z", freshness: "current", isMock: false };
}
const deps = (): AIConversationDependencies => ({ fetchAsset: vi.fn(async (s: string) => fixture(s)), enhance: vi.fn(async () => null) });

async function signature(q: string, lang: "en" | "he") {
  const plan = planQuestion(q);
  const turn = await processAIMessage(createConversationSession(), q, lang, deps());
  return {
    q, route: plan.route, tools: plan.tools,
    intent: turn.resolution.intent, engines: turn.orchestrationPlan.engines,
    clarifies: turn.clarification !== null,
    head: turn.response.text.replace(/\s+/g, " ").slice(0, 70),
  };
}

describe("characterization: routing and answer heads", () => {
  it("has about 100 questions in both languages", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(95);
    expect(QUESTIONS.filter(([, l]) => l === "he").length).toBeGreaterThanOrEqual(40);
  });
  it("matches the recorded signatures", async () => {
    const sigs = [];
    for (const [q, l] of QUESTIONS) sigs.push(await signature(q, l));
    await expect(JSON.stringify(sigs, null, 1)).toMatchFileSnapshot("./__snapshots__/characterization.json");
  });
  it("is deterministic across two runs", async () => {
    const a = await signature("what is compound interest?", "en");
    const b = await signature("what is compound interest?", "en");
    expect(a).toEqual(b);
  });
});

import { routeRequest } from "./intelligence/router";
describe("characterization: the single router entry agrees with both stages", () => {
  it("returns the planner plan, and the intent stage only for plain-answer routes", () => {
    for (const [q] of QUESTIONS) {
      const r = routeRequest(q, createConversationSession());
      expect(r.plan.route).toBe(planQuestion(q).route);
      if (r.plan.route === "copilot") { expect(r.resolution).not.toBeNull(); expect(r.engines.length).toBeGreaterThan(0); }
      else { expect(r.resolution).toBeNull(); expect(r.engines).toEqual([]); }
    }
  });
  it("matches the recorded intent and engines for plain-answer questions", async () => {
    const recorded = JSON.parse((await import("node:fs")).readFileSync(new URL("./__snapshots__/characterization.json", import.meta.url), "utf8")) as { q: string; route: string; intent: string; engines: string[] }[];
    for (const row of recorded.filter((x) => x.route === "copilot")) {
      const r = routeRequest(row.q, createConversationSession());
      expect(r.resolution?.intent, row.q).toBe(row.intent);
      expect(r.engines, row.q).toEqual(row.engines);
    }
  });
  it("without a session it stays on stage 1", () => {
    expect(routeRequest("what is compound interest?").resolution).toBeNull();
  });
});
