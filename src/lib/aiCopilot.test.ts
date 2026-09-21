import { describe, expect, it, vi } from "vitest";
import type { MarketAsset } from "@/types";
import { processAIMessage, type AIConversationDependencies } from "./aiConversationService";
import { createConversationSession } from "./conversationContext";
import { buildRuleBasedAnalysis } from "./analysisService";

function fixture(symbol: string, source: "yahoo_finance" | "mock" = "yahoo_finance"): MarketAsset {
  const prices = symbol === "AMD" ? [100, 106, 96, 112] : [100, 101, 100, 103];
  return { symbol, name: symbol, price: prices.at(-1)!, changePercent: symbol === "AMD" ? 5 : 2, currency: "USD", history: prices.map((price, i) => ({ date: `2026-01-0${i+1}`, price, open: price, high: price, low: price, close: price })), dataSource: source, timestamp: "2026-09-21T07:00:00Z", freshness: source === "mock" ? "simulated" : "current", isMock: source === "mock" };
}
function setup(overrides: Partial<Record<string, MarketAsset | null>> = {}) {
  const fetchAsset = vi.fn(async (symbol: string) => symbol in overrides ? overrides[symbol]! : fixture(symbol));
  const deps: AIConversationDependencies = { fetchAsset, enhance: vi.fn(async () => null) };
  return { deps, fetchAsset };
}

describe("Phase 5 central AI Copilot orchestration", () => {
  it("routes market data and preserves provenance in the final response", async () => { const { deps, fetchAsset } = setup(); const turn = await processAIMessage(createConversationSession(), "What is NVDA doing?", "en", deps); expect(fetchAsset).toHaveBeenCalledWith("NVDA"); expect(turn.response.assets[0].symbol).toBe("NVDA"); expect(turn.response.dataSources).toEqual(["yahoo_finance"]); expect(turn.response.dataFreshness).toEqual(["current"]); expect(turn.response.text).not.toMatch(/Source:|מקור:/); });
  it("resolves NVDA to AMD follow-up in the final response", async () => { const session=createConversationSession(); const {deps}=setup(); await processAIMessage(session,"What is NVDA's price?","en",deps); const turn=await processAIMessage(session,"What about AMD?","en",deps); expect(turn.response.assets.map(a=>a.symbol)).toEqual(["AMD"]); });
  it("financial follow-ups use the financial engine and preserve currency", async () => { const session=createConversationSession(); const {deps,fetchAsset}=setup(); await processAIMessage(session,"Calculate 2,000 USD per month for 15 years at 7%.","en",deps); const turn=await processAIMessage(session,"What if I increase it to 3,000?","en",deps); expect(turn.result?.scenario).toMatchObject({monthlyContribution:3000,years:15,currency:"USD"}); expect(turn.response.calculation?.totalContributed).toBe(540000); expect(turn.response.dataDependencies).toEqual(["financial_engine"]); expect(fetchAsset).not.toHaveBeenCalled(); });
  it("preserves financial context when a mixed follow-up adds VTI", async () => { const session=createConversationSession(); const {deps}=setup(); await processAIMessage(session,"Calculate 2,000 ILS per month for 15 years at 7%.","en",deps); const turn=await processAIMessage(session,"What if instead I invest it in VTI?","en",deps); expect(turn.resolution.currentAsset).toBe("VTI"); expect(turn.resolution.financialParameters).toMatchObject({monthlyContribution:2000,years:15,currency:"ILS",annualReturnPct:7}); expect(turn.response.dataDependencies).toContain("market"); });
  it("uses only a genuine supplied profile and otherwise clarifies", async () => { const {deps}=setup(); const missing=await processAIMessage(createConversationSession(),"How does NVDA fit my investor profile?","en",deps); expect(missing.response.clarification?.missing).toContain("investor_profile"); const session=createConversationSession({investorProfile:{classification:"balanced",riskScore:5,summary:"moderate"}}); const present=await processAIMessage(session,"How does NVDA fit my investor profile?","en",deps); expect(present.response.profileContextUsed).toBe(true); expect(present.response.dataDependencies).toContain("investor_profile"); });
  it("clarifies a singular market question after a multi-asset comparison", async () => {
    const session = createConversationSession();
    const { deps, fetchAsset } = setup();
    await processAIMessage(session, "Compare NVDA and AMD.", "en", deps);
    fetchAsset.mockClear();

    const turn = await processAIMessage(session, "What is the price?", "en", deps);

    expect(turn.resolution.status).toBe("needs_clarification");
    expect(turn.resolution.intent).toBe("asset_analysis");
    expect(turn.resolution.comparisonSet).toEqual(["NVDA", "AMD"]);
    expect(turn.response.clarification?.missing).toContain("asset");
    expect(turn.response.text).toContain("NVDA and AMD");
    expect(turn.assetAnalyses).toEqual([]);
    expect(fetchAsset).not.toHaveBeenCalled();
  });

  it("keeps comparative follow-ups on both assets without clarification", async () => {
    const session = createConversationSession();
    const { deps, fetchAsset } = setup();
    await processAIMessage(session, "Compare NVDA and AMD.", "en", deps);
    fetchAsset.mockClear();

    const turn = await processAIMessage(session, "Which is more volatile?", "en", deps);

    expect(turn.resolution.status).toBe("resolved");
    expect(turn.response.clarification).toBeNull();
    expect(turn.response.comparison?.map((asset) => asset.symbol)).toEqual(["NVDA", "AMD"]);
    expect(fetchAsset).toHaveBeenCalledTimes(2);
  });

  it("comparison follow-ups retain both assets", async () => { const session=createConversationSession(); const {deps}=setup(); await processAIMessage(session,"Compare NVDA and AMD.","en",deps); const turn=await processAIMessage(session,"Which has performed better recently?","en",deps); expect(turn.response.comparison?.map(a=>a.symbol)).toEqual(["NVDA","AMD"]); expect(turn.response.text).toContain("AMD"); });
  it("marks mock values as simulated in final response and metadata", async () => { const {deps}=setup({NVDA:fixture("NVDA","mock")}); const turn=await processAIMessage(createConversationSession(),"What is NVDA's RSI?","en",deps); expect(turn.response.text).toContain("simulated value"); expect(turn.response.dataFreshness).toEqual(["simulated"]); });
  it.each([["מה המחיר של NVDA?","he"],["What is NVDA's volatility?","en"],["תסביר לי את volatility של NVDA","mixed"]] as const)("preserves language for %s", async(message,language)=>{const {deps}=setup(); const turn=await processAIMessage(createConversationSession(),message,"en",deps); expect(turn.response.language).toBe(language);});
  it("keeps sessions isolated", async()=>{const {deps}=setup(); const a=createConversationSession(), b=createConversationSession(); await processAIMessage(a,"What is NVDA's price?","en",deps); const turn=await processAIMessage(b,"What about it?","en",deps); expect(turn.response.clarification).not.toBeNull(); expect(turn.response.assets).toEqual([]);});
  it("does not call market service for educational questions", async()=>{const {deps,fetchAsset}=setup(); const turn=await processAIMessage(createConversationSession(),"What is an ETF?","en",deps); expect(turn.response.intent).toBe("educational_question"); expect(turn.response.text).toContain("An ETF"); expect(fetchAsset).not.toHaveBeenCalled();});
  it("never fabricates unavailable market values", async()=>{const {deps}=setup({NVDA:null}); const turn=await processAIMessage(createConversationSession(),"What is NVDA trading at?","en",deps); expect(turn.response.assets).toEqual([]); expect(turn.response.text).toContain("unavailable"); expect(turn.response.text).not.toMatch(/\d+\.\d+/);});

  it("projects an explicit lump sum instead of treating it as zero", async () => {
    const session = createConversationSession({
      investorProfile: { classification: "balanced", riskScore: 5, summary: "onboarding profile" },
    });
    const { deps } = setup();
    const turn = await processAIMessage(
      session,
      "If I invest 100000 ILS for 10 years at 7%, what is the projected value?",
      "en",
      deps
    );

    expect(turn.resolution.scenario).toMatchObject({
      initialInvestment: 100000,
      initialInvestmentSpecified: true,
      monthlyContribution: 0,
      years: 10,
      annualReturnPct: 7,
      currency: "ILS",
    });
    expect(turn.response.calculation?.totalContributed).toBe(100000);
    expect(turn.response.calculation?.finalBalance).toBeGreaterThan(100000);
  });

  it("preserves explicit lump-sum parameters in a years-only follow-up", async () => {
    const session = createConversationSession({
      investorProfile: { classification: "balanced", riskScore: 5, summary: "onboarding profile" },
    });
    const { deps } = setup();
    await processAIMessage(
      session,
      "If I invest 100000 ILS for 10 years at 7%, what is the projected value?",
      "en",
      deps
    );
    const turn = await processAIMessage(session, "And after 15 years?", "en", deps);

    expect(turn.resolution.scenario).toMatchObject({
      initialInvestment: 100000,
      initialInvestmentSpecified: true,
      monthlyContribution: 0,
      years: 15,
      annualReturnPct: 7,
      currency: "ILS",
    });
    expect(turn.resolution.inheritedFromContext).toEqual(
      expect.arrayContaining(["initialInvestment", "annualReturnPct", "currency"])
    );
    expect(turn.response.calculation?.totalContributed).toBe(100000);
  });
  it("keeps rule-based response when Ollama fallback returns null", async()=>{const {deps}=setup(); const turn=await processAIMessage(createConversationSession(),"Calculate 2,000 ILS per month for 15 years at 7%.","en",deps); expect(turn.result).not.toBeNull(); expect(turn.response.text).toContain("financial engine");});
});

describe("Copilot profile privacy", () => {
  it("does not pass the in-session investor profile to Ollama for unrelated turns", async () => {
    const session = createConversationSession({
      investorProfile: { classification: "balanced", riskScore: 5, summary: "private profile summary" },
    });
    const resolution = session.processTurn("What is an ETF?");
    const result = buildRuleBasedAnalysis("What is an ETF?", "en", resolution, []);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ response: "Educational response" }),
    } as Response);

    const { explainConversationTurn } = await import("./ollamaClient");
    await explainConversationTurn(result, resolution, []);

    const request = fetchSpy.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body));
    expect(body.prompt).toContain("Investor profile supplied by the application: null.");
    expect(body.prompt).not.toContain("private profile summary");
    fetchSpy.mockRestore();
  });
  it("answers broad Hebrew concept questions without depending on an LLM", async () => {
    const { deps, fetchAsset } = setup();
    const turn = await processAIMessage(createConversationSession(), "מה זה קרן נאמנות?", "he", deps);
    expect(turn.response.text).toContain("כלי השקעה");
    expect(turn.response.text).toContain("דמי ניהול");
    expect(fetchAsset).not.toHaveBeenCalled();
  });

  it("calculates a Hebrew holdings valuation from current sourced market data", async () => {
    const { deps, fetchAsset } = setup({ TSLA: { ...fixture("TSLA"), price: 250.25 } });
    const turn = await processAIMessage(createConversationSession(), "אם יש לי 199 מניות של TSLA מה השווי של זה?", "he", deps);
    expect(fetchAsset).toHaveBeenCalledWith("TSLA");
    expect(turn.response.holdingValuation?.total).toBeCloseTo(49_799.75, 8);
    expect(turn.response.text).toContain("49,799.75");
    expect(turn.response.text).not.toMatch(/מקור|עדכניות|חותמת זמן|Source:/);
    expect(turn.response.dataSources).toContain("yahoo_finance");
  });

  it("refuses to value holdings from simulated fallback data", async () => {
    const { deps } = setup({ TSLA: fixture("TSLA", "mock") });
    const turn = await processAIMessage(createConversationSession(), "I own 199 shares of TSLA. What are they worth?", "en", deps);
    expect(turn.response.holdingValuation?.available).toBe(false);
    expect(turn.response.text).toContain("real market data is unavailable");
    expect(turn.response.text).not.toContain("= ");
  });

  it("calculates cross-currency buying power with asset and FX provenance", async () => {
    const vym = { ...fixture("VYM"), price: 140, currency: "USD" };
    const fx = { ...fixture("USDILS=X"), price: 3.5, currency: "ILS" };
    const { deps, fetchAsset } = setup({ VYM: vym, "USDILS=X": fx });
    const turn = await processAIMessage(createConversationSession(), "יש לי 300 אלף שקל, לפי שער עדכני כמה מניות של VYM אוכל לקנות?", "he", deps);
    expect(fetchAsset).toHaveBeenCalledWith("VYM");
    expect(fetchAsset).toHaveBeenCalledWith("USDILS=X");
    expect(turn.response.purchasePower?.wholeShares).toBe(612);
    expect(turn.response.text).toContain("מניות שלמות");
    expect(turn.response.text).toContain("עמלות מסחר");
    expect(turn.response.text).not.toMatch(/מקור|עדכניות|חותמת זמן|Source:/);
    expect(turn.response.dataSources).toContain("yahoo_finance");
  });

});
