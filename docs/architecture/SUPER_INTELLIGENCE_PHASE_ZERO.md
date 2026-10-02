# InvestED+ SUPER INTELLIGENCE: Phase Zero audit

Audited at commit 390c923 on main (live: https://investeducationai.vercel.app/, asset index-t5JvzmWA.js).
Spec: Saar's SUPER INTELLIGENCE master prompt, WhatsApp 2026-10-02 10:23 IDT. Earlier audit it builds on: docs/architecture/INVESTED_2030_AUDIT.md.
Gate state: 1257 tests, tsc clean, eslint 6 warnings (baseline), build ok. No CI workflow exists in the repo (no .github/workflows).

Labels: VERIFIED EXISTING (VE), VERIFIED DEFECT (VD), MISSING (M), PARTIAL (P), BLOCKED BY EXTERNAL (B), REQUIRES MANUAL VERIFICATION (RMV).
Rule from the spec and from Saar: wrap and adapt, do not rebuild. Git: the spec says keep Git local unless authorized. Saar's standing grant (WhatsApp Oct 1 9:55 and Oct 2 10:15) covers pushing InvestED work, so I push each verified slice. If Saar wants local-only, he says so.

## Section map

| Spec section | Status | Evidence (source files) | Gap |
|---|---|---|---|
| 2.1 Preserve existing product | VE | characterization.test.ts, chatBenchmark.test.ts, 1257 tests | none |
| 2.2 Financial correctness | VE | calculatorEngine, loanEngine, goalEngine, riskEngine, src/lib/risk/* (new), verifyNumbers | numbers from models are checked only when a draft passes through verifyNumbers |
| 2.3 AI reliability | P | api/copilot-chat.ts (Gemini rephrase-only, 20 req/min per-instance limiter), intelligence/critique.ts | no multi-provider fallback; one model provider |
| 2.4 Security and user control | P | Supabase RLS on chat_history, user_memory, knowledge, daily_feed; memory consent gate; sanitizeLog in production/hardening.ts | rate limit is best effort per instance; no dedicated security test suite |
| 2.5 Dev and release controls | P | tsc, eslint, vitest, vite build | no CI, no production smoke test script |
| 3 Phase Zero audit | this file | | |
| 4 Target architecture | P | intelligence/{tools,toolRegistry,domains,router,orchestrator,envelope,provenance,verificationEngine,critique,traceStore,superAgents}.ts | layers exist as modules; there is no single "task state" object |
| 5.1 Request interpretation | VE | copilot/planner.ts, conversationContext.ts, multiPart.ts, decompose.ts | |
| 5.2 Task complexity (Quick, Analyze, Deep, Super) | P | copilot/depth.ts, levels.ts (answer levels), deepResearch.ts (58 lines, bounded, sequential) | no explicit four-tier router with budgets |
| 5.3 Task planning (state, dependencies) | P | copilot/orchestrate.ts (39 lines), intelligence/orchestrator.ts (11 lines, intent to engines) | plans are flat lists; no dependency graph or per-step state |
| 5.4 Execution resilience (bounded retries, partial results) | P | market/errors.ts, production/withTimeout, per-tool "unavailable" outcome | no retry policy object; partial results are shown per tool but not as a plan state |
| 6 Tool registry and contracts | VE | intelligence/tools.ts (9 desks: calc, math, fx, wb, symbol, scenario, risk, rssnews, marketsim) + toolRegistry.ts (8 engines); ToolSpec has domain, trust class, network flag | contracts lack input/output schemas and timeout/cost fields |
| 7 Verification engine | P | verificationEngine.ts (13 lines: numbers in a draft must appear in tool output), provenance.ts, envelope.ts DataState (live, cached, fallback, static, calculated, synthetic), freshness.ts | no source-link check, contradiction handling or completeness check; outcome classes not formalised |
| 8.1 Unified data model | P | market/providers/types.ts, marketDataService.ts, envelope.ts | news, FX, World Bank use separate shapes |
| 8.2 Provider architecture | VE | market/router.ts, providers/{yahooFinance,alphaVantage}.ts, cache.ts | Alpha Vantage needs a key (RMV: is one set in Vercel?) |
| 8.3 Data coverage | P | Yahoo quotes, movers, news; RSS (Fed, SEC, ECB, BoE); BIS policy rates; World Bank; FX | no fundamentals, filings or earnings data; B: free licensed sources only |
| 9 Deep research engine | P | copilot/deepResearch.ts, research/assetResearchEngine.ts, AssetResearchPage | no reusable report artifact, no claim-level verification pass |
| 10 Portfolio and risk engine | P | riskEngine.ts, portfolioIntelligence.ts (469 lines), risk/riskMetrics.ts (volatility, worst drop, beta), PortfolioCard | stress scenarios on real holdings, correlation and concentration not exposed in chat |
| 11 Dynamic workspace and component registry | P | terminal/{TerminalShell,CommandCenter,MarketsWorkspace}.tsx, dashboard/chatTools.ts (tool panel), 40+ Chat*Card components | components are mapped by hand in AIChatCard, not by an approved registry keyed by structured result type |
| 12 Context and memory | VE | conversationContext.ts, memory/*, user_memory table, consent gate, MemoryPanel | |
| 13 Knowledge engine | VE | knowledge/*, supabase knowledge table, concepts registry, graph.ts, KnowledgeMapPage | evidence-grounded citations in answers are partial (stored knowledge shown verbatim) |
| 14 Radar and monitoring | P | monitoringEngine.ts (pure rule evaluation, 7 lines of types + evaluateRule), daily feed cron (api/cron/daily-feed.ts, stores movers and headlines) | no user alert rules UI, no notification provider; do not claim monitoring |
| 15.1 Evaluation dataset | P | chatBenchmark.test.ts (279 lines), characterization tests | not a labelled eval set; no scoring script |
| 15.2 Evaluation dimensions | M | | none measured |
| 15.3 Execution tracing | P | intelligence/traceStore.ts (on-device, hashed question, last 200), ChatTrace.tsx | no server-side trace, no cost view |
| 16 AI provider architecture | P | ai/provider.ts (39 lines), ollamaClient.ts, api/copilot-chat.ts | Gemini only in production; Ollama is local only |
| 17 Career simulation | VE | career/* (tracks, 4 games, paper ledger, stress, board evidence), CareerLabPage | spec says "later expansion"; no work needed |
| 18 Security, privacy, safety | P | RLS, consent, redaction, no secrets in client (service key is Vercel server only), labels on invented data | no automated security tests; rate limit weak |
| 19 Phases 1-10 | see plan | | |
| 20 Testing and acceptance | P | 1257 unit tests | no E2E, no production smoke test, no accessibility test in CI (axe was run by hand) |

## Verified defects found while auditing

1. VD: no CI. Nothing blocks a failing build from reaching main except my own gate.
2. VD (small): api/copilot-chat.ts rate limit is per serverless instance, so it can be bypassed by load across instances. Documented in code; Hobby plan has one WAF rule, already used.
3. VD: verifyNumbers accepts any number that appears anywhere in the tool results, so a wrong pairing of two real numbers still passes. It checks presence, not meaning.
4. VD (fixed today): simulator card showed English text inside the Hebrew UI (390c923).
5. RMV: Alpha Vantage key presence, real iPhone speech, real PDF/photo upload, mobile 390px visuals of risk, simulator and /news after today's merges.

## Duplicate or conflicting logic

- Two planners: copilot/planner.ts (route per question) and intelligence/orchestrator.ts (intent to engines). They do not conflict today but should converge on one plan object.
- riskEngine.ts (795 lines, profile-based risk scoring) and risk/riskMetrics.ts (price-based metrics) measure different things under the name "risk". Keep both; label them differently in the UI.
- Three data shapes for "an answer with sources": ToolResult envelope, chat message `trace`, and Copilot gateway payload.

## Prioritised plan (vertical slices, each with its own gate)

1. Phase 2 slice: one Plan object (steps, dependencies, per-step state, bounded retry, partial result) used by the existing multi-part and deep-research paths. Wrap planner and orchestrator, do not replace. Gate: a two-step question shows steps with states in the trace; a failing step yields a partial answer.
2. Phase 3 slice: extend verification beyond number presence: label each claim (calculated, sourced, educational), check source links exist in the tool result, check freshness against a threshold, surface contradictions. Gate: tests for pass, unavailable and contradiction outcomes.
3. Phase 7 slice (cheap, high value): CI workflow (tsc, eslint, vitest, build) and a production smoke script (hit /api/news, /api/market-quote, /api/news-feeds, cron 401). Gate: workflow green on GitHub. Needs a token scope check for pushing workflow files (RMV).
4. Phase 4: provider health endpoint and data-status truthfulness review.
5. Phase 5: reusable research report (equity or asset) with claim verification. Depends on 2 and 3.
6. Phase 6: component registry keyed by result type, replacing the hand-written dispatch in AIChatCard.
7. Phases 8, 9, 10: mostly exist. Extend portfolio stress scenarios only on real holdings with real history.

Not by Sunday Oct 4: full phases 5 to 10. Slices 1 to 3 are realistic.

## Migration strategy

Every slice adds a module beside the existing ones and routes one path through it behind the current UI. Existing tests stay green at each step. No file is rewritten wholesale; AIChatCard.tsx (the largest dispatcher) changes only where a slice needs a hook.

## Needs Saar's decision

- Local-only Git (the spec's default) or keep pushing under the standing grant.
- Whether he wants CI added (adds .github/workflows; needs a token that can push workflow files).
