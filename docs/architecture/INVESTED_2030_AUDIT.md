# InvestED 2030: architecture audit, target, migration map, phase plan

Status: PROPOSAL for Saar's review. Nothing in this document is implemented except where it says "exists today".
Source of truth for the target: the INVESTED 2030 Master Blueprint (Saar's WhatsApp message, 2026-10-01 17:20 IDT).
Audited at commit 5d73475 on main (live: https://investeducationai.vercel.app/).
Rule that governs everything below: do not break InvestED 3.0 / InvestED+; add layers on top; wrap, do not duplicate.

## 1. Current architecture (what exists today)

Size: about 45,000 lines of TypeScript/TSX. 241 files in src/lib (28.4k lines), 118 in src/components (12.7k), 29 in src/pages (4k). 139 test files, 1,081 tests, all passing. 9 serverless endpoints in api/. 2 Supabase migrations. 283 commits.

### 1.1 Shell
- One route: `<Route path="*">` renders `AICopilotPage`. The chat is the whole product shell. Everything else is a lazy page loaded inside the chat's tool panel (`components/dashboard/chatTools.ts`, 24 lazy page entries: calculator, loans, insurance reports, research, news, strategy lab, simulation, trivia, learn, career lab and its four games, knowledge, data controls, dashboard, overview, start).
- Providers: Language (en/he, RTL/LTR), Auth (Supabase), Theme, ErrorBoundary, Analysis (investor profile result, localStorage).
- UI: React 18, Vite, Tailwind, framer-motion, Lightweight Charts (Apache-2.0). Locale files en.json and he.json with a parity test.

### 1.2 The chat ("InvestED+") pipeline
`src/components/dashboard/AIChatCard.tsx` (424 lines) owns `send()`. Per question:
1. `planQuestion()` (`lib/copilot/planner.ts`, 64 lines) picks one route: tool, career, learnpath, site, calc, math, fx, wb, scenario, desk, copilot.
2. Deterministic desks answer: calcDesk, mathDesk, fxDesk, worldBankDesk, symbolDesk, scenarioDesk, dataDesk (movers, policy rate, insurance yields), learnDesk, deepResearch (bounded, sequential).
3. Otherwise `aiConversationService` (324 lines) + `conversationContext` (861 lines) resolve intent and entities, call market/strategy/profile/portfolio/education engines and build a structured response.
4. Optional rewording through `/api/copilot-chat` behind the `AIProvider` interface (RuleBased and Gemini). A validator rejects any reworded text that adds a number or fact. Per-track time budgets (5/8/10/14 s).
5. Depth passes per level track (BASIC/Junior/Senior/Professional) in `lib/copilot/depth.ts`.
6. Cards render the result; the trace shows steps with a trust label; agent tags show which registry agent (Investing, Insurance, Loans and credit, Savings and pension) routed it.

### 1.3 Domains and engines that already exist (all deterministic)
| Domain | Where | What |
|---|---|---|
| Financial | calculatorEngine, goalEngine, loanEngine, retirementPlanning, copilot/mathDesk, calcDesk, scenarioDesk | compound growth, goals, loans/pmt, fv, cagr, real return, expression parser, multi-part scenarios |
| Market | lib/market/* (router, providers, cache, freshness, indicators), marketData, marketMovers, tickerStrip, api/market-quote, api/market-movers | Yahoo and fallback providers, RSI/volatility, live/cached/fallback labels, ticker strip |
| FX / macro | fxDesk (Frankfurter/ECB), worldBankDesk (+api/worldbank), bisPolicyRate (+api/bis-policy-rates), insuranceData (+api/insurance-reports) | read-only open data |
| Symbols | data/symbols.json (2,624, FinanceDatabase MIT), symbolDesk | name, sector, size, issuer |
| Portfolio / risk | portfolioEngine, portfolioIntelligence, portfolioResearchEngine, riskEngine, backtestingEngine, stockSimulationEngine | allocation, risk score, backtests |
| Strategy | lib/strategy/*, strategies, recommendationEngine | strategies and profile fit |
| Research | lib/research/*, assetResearchEngine | asset research |
| News | newsClient, newsIntelligence, newsRefresh, newsPopup, api/news, api/news-summary | feed, impact enrichment, pop-up, AI summary with credit |
| Knowledge | lib/knowledge/concepts (registry and about 120 concepts, en/he), knowledge.ts, feeds, Supabase knowledge_items | stored explanations, aliases, related graph (concept `related` edges exist) |
| Education | financialEducation, conceptExplanations, learningJourney, quizBank, educationContent, Learn and Trivia pages | lessons, quizzes, progress |
| Career / simulation | lib/career/* (engine, tracks, 4 games, committee cases, paper ledger, stress, practice runs, source quotes), lib/simulation/* | Career Lab, Analyst/Portfolio/Operations/Accountant games, paper ledger |
| Intelligence | lib/intelligence/* (orchestrator 11 lines, toolRegistry 15, provenance 18, verificationEngine 13) | see gaps |
| Memory / identity | account/userMemory (local store, scopes), supabaseClient, Supabase chat_conversations, chat_messages, app_owners, knowledge_items, answer_feedback, knowledge_gaps (RLS on) | |
| Agents | lib/agents.ts | declarative registry of 4 topical agents (routing and colour only) |
| Production | lib/production/hardening, error boundary, DataControlsPage | |

### 1.4 Storage today
- Browser localStorage, 25 `invested_*` keys (analysis, learning progress, quiz, career games and archives, paper ledger, simulation, language, user memory v1, onboarding).
- Supabase (project invested-plus): chat history, knowledge items, feedback, gaps. Row-level security on.
- No server-side store for simulations, skills, decisions, or a personal profile.

## 2. What InvestED+ already implements against the blueprint
Present in working form: trust classification (DATA, KNOWLEDGE, CALCULATION, ANALYSIS, SIMULATION, EDUCATIONAL) shown on trace steps and depth blocks; a planner and visible trace; AIProvider abstraction; rephrase-only model use with a no-new-facts validator; bounded deep research; deterministic engines owning every number; live/cached/fallback labels; provenance on cards (source, date, license); a declarative agent registry; a four-level track system; bilingual RTL/LTR; data controls and delete; chat history with RLS.
Present as seeds only: orchestrator (8 engine ids, intent to engines map), tool registry (labels, "wraps nothing yet"), memory store (local, 7 scopes), concept graph (related edges), career games (as separate pages), paper ledger, committee cases.

## 3. Duplication found (must be resolved by wrapping, not rewriting)
1. Two routers. `lib/copilot/planner.ts` (route per question, the live path for desks) and `lib/intelligence/orchestrator.ts` (intent to engine ids, used only by aiConversationService). They answer the same question ("which engine?") with different vocabularies.
2. Two registries of engines. `intelligence/toolRegistry.ts` (8 ids, label only) and the desks that planner.ts calls directly. The registry names tools but cannot run them.
3. Trust and provenance defined in three places: `TrustClass` in verificationEngine, `TraceStep.trust` in planner, per-card source lines written by hand in each card.
4. Question parsing is spread over mathDesk, calcDesk, scenarioDesk (own splitters), multiPart, toolKeywords and conversationContext (861 lines of intent rules). Overlapping regexes for amounts and currency.
5. Persistence is per feature (25 keys, each with its own read/parse/validate), plus a separate `userMemory` store that most features do not use.
6. Concept data exists twice: `conceptExplanations.ts` (answers) and `knowledge/concepts/data.ts` (registry and edges), linked by a label string.

## 4. Gaps against the blueprint (honest)
| Blueprint area | State |
|---|---|
| Orchestrator + task graph (multi-step plan across engines, dependencies) | partial: scenario splits into independent parts; no dependency graph, no carry-over between steps |
| Agent registry with permissions | agents are topic tags only; no tool permissions, no per-agent tool access |
| Tool registry that executes | labels only |
| Provenance as data | strings in cards; no common object |
| Verification + self-critique | numeric no-new-facts check on rewording only |
| Personal memory with safety | local store, not Supabase-backed, no consent per scope in the chat |
| Knowledge graph | concept edges only; no entities (assets, events, skills), no versioning |
| Financial Twin | none (Analysis result and goal planner are the nearest inputs) |
| Career/Skill graph, skill evidence, proof of work | career games exist; no skill model, no evidence ledger |
| University / adaptive curriculum | lessons and quizzes exist; no learning objects or mastery model |
| Professional simulations | games exist as pages; no shared simulation core, no decision record, no reproducible seeds |
| Financial World simulator, historical mode | none |
| Research monitoring, radar, notifications | news pop-up and ticker only |
| Observability, feature flags, security (agent permissions, injection handling) | error boundary and hardening module; no flags; no tool-permission layer |
Not started and not cheap: anything needing server storage beyond chat history (Twin, skills, decisions) needs new Supabase tables and RLS, which is a database change Saar must approve at the time.

## 5. Target architecture (layers above what exists)
Principle: every domain exposes one stable interface; InvestED+ calls them through one orchestrator. Existing engines are wrapped by adapters.

```
UI shell (chat, cards, tool panel, cockpit)           [exists]
  InvestED+ Intelligence layer                        [grows from lib/intelligence + lib/copilot]
    Orchestrator: plan -> task graph -> execute -> verify -> compose
    Agent registry (topic, colour, allowed tools)     [lib/agents.ts grows]
    Tool registry (id, domain, trust, live, run())    [lib/intelligence/toolRegistry grows]
    Provenance + trust on every result                [one ResultEnvelope]
    Verification + critique                           [no-new-facts, number tracing]
  Domain interfaces (adapters over existing engines)
    FinancialEngine  MarketEngine  ResearchEngine  NewsEngine
    PortfolioEngine  RiskEngine    SimulationEngine
    LearningEngine   CareerEngine  KnowledgeEngine  MemoryEngine
  Stores: local (today) behind MemoryEngine; Supabase tables when approved
```

Core contract (the one new idea): `ToolResult<T> = { value: T; trust: TrustClass; provenance: { source, license?, asOf?, state: "live" | "cached" | "fallback" | "calculated" }; assumptions?: string[] }`. Every tool returns it; cards and trace read it; a number with no deterministic source cannot be rendered.

Directory shape (new folders hold interfaces and adapters only; existing files stay in place until a later cleanup):
`src/lib/intelligence/` (orchestrator, planner, taskGraph, registry, envelope, verify), `src/lib/domains/<finance|market|research|news|portfolio|risk|learning|career|simulation|knowledge|memory>/index.ts` each exporting the engine interface and an adapter to current code.

Rules carried from the blueprint into the code gate: no invented data or sources; simulated experience is always labelled simulation; no future information in historical simulations; reproducible simulations (seeded); skill claims need evidence; external content cannot override instructions; model output is never a fact source; agents get only the tools in their permission list.

## 6. Migration map
Pattern for every item: existing engine -> adapter -> unified interface -> registered tool -> orchestrator. Pages and cards keep working at every step.

| Step | Existing code | Becomes | Risk |
|---|---|---|---|
| M1 | calcDesk, mathDesk, fxDesk, worldBankDesk, symbolDesk, scenarioDesk, dataDesk | registered tools returning `ToolResult` (adapters; desk code untouched) | low |
| M2 | planner.ts + intelligence/orchestrator.ts | one orchestrator: planner's route table moves into the registry; old exports re-exported | medium (two call sites) |
| M3 | per-card source lines | rendered from `provenance` | low |
| M4 | agents.ts | adds `tools: string[]` allow-list, enforced by the orchestrator | low |
| M5 | userMemory + 25 localStorage keys | `MemoryEngine` facade over the same keys (no data migration), consent per scope | medium |
| M6 | concepts registry + conceptExplanations | one `KnowledgeEngine` (explain, related, search); later entity types | low |
| M7 | career games, paper ledger, simulation | `SimulationEngine` interface: seed, step, decision record, evaluation; games adopt it one at a time | high, later |
| M8 | lessons, quiz | `LearningEngine` with learning objects and mastery | later |
Nothing is deleted in M1-M6. Each step ships with its own tests and the full gate.

## 7. Phase plan (mapped to the blueprint's 15 phases)
Each phase ends with: typecheck, lint (6-warning baseline), unit and integration tests, build, visual, 390px, RTL/LTR, and a security pass; then commit, push, deploy and a live-link report (Saar's standing approval for InvestED).
| Phase | Scope | Notes |
|---|---|---|
| 1 | Architecture audit | this document |
| 2 | Intelligence Foundation: M1-M4 (ToolResult, tool registry that runs, one orchestrator, agent permissions, provenance, verification) | first slice below |
| 3 | Unified domain interfaces for the engines that exist (Financial, Market, Research, News, Portfolio, Risk, Learning) | adapters only |
| 4 | Memory: M5 with consent, export, delete; Supabase-backed only after approval | database change needs Saar's yes |
| 5 | Knowledge graph: M6, entities (asset, concept, event), edges with sources, change detection later | |
| 6 | Financial Twin v1: inputs from profile, goal planner, calculators; scenarios by the existing engines | local first |
| 7 | Career / skill graph and evidence ledger | simulation-labelled |
| 8 | University: learning objects, adaptive path | content at scale is a separate effort |
| 9 | Professional simulations on the shared core (M7) | seeded, reproducible |
| 10 | Financial World simulator, historical mode with no look-ahead | |
| 11-12 | Research monitoring, intelligence radar, notifications | no emails to anyone; in-app only |
| 13 | Public proof of work | privacy review first |
| 14 | B2B / institutional | design only until decided |
| 15 | Production hardening, observability, feature flags | |
Not scheduled: anything in the blueprint's economics, partnerships, employer and recruiter layers. Those are product decisions for Saar, not engineering work.

## 8. Smallest high-value vertical slice (proposed, not started)
Name: "One result envelope, one tool registry, one orchestrator" (Phase 2, steps M1 to M3).
What it does for a user: no visible redesign. Every answer card shows the same provenance line (source, as-of date, live/cached/fallback, assumptions) built from data, and the trace is generated from the registry. A complex question ("I have 50,000 and add 1,000 a month, convert 500 euros, and what is Israel's inflation") is planned as a task list by one orchestrator and run through registered tools.
What it changes in code:
1. `ToolResult` envelope type and `registry.run(id, input)`.
2. Adapters for the six desks (calc, math, fx, wb, symbol, scenario). Desk code unchanged.
3. `planner.ts` reads the registry; `intelligence/orchestrator.ts` becomes a thin re-export so aiConversationService keeps working.
4. Cards read provenance from the envelope. ChatTrace is built from the same data.
Why this first: it removes duplication 1 to 3 in section 3, it is the base every later phase (memory, twin, simulations) calls through, and it does not touch the database or any page.
Acceptance: all 1,081 existing tests still pass; new tests for the envelope, registry permission checks and the multi-step plan; live check in Hebrew and English at desktop and 390px; no card loses its current content; eslint at 6 warnings.
Estimated size: about 600 to 900 lines plus tests, in 3 to 4 commits.

## 9. Decisions Saar needs to make before Phase 4 and later
1. Supabase tables for memory, Twin, skills and decisions (new migrations, RLS). Not started; needs his explicit yes.
2. Whether the Financial Twin may store a personal profile on the server or stays on the device in its first version.
3. The cron for feeds with a service-role secret (asked earlier, no answer, not started).
4. Document generation (V1.5) stays on hold.

## 10. Unchanged boundaries
Free tiers and free, clearly licensed data only; no paid APIs; no emails to anyone for data. Invented teaching numbers stay labelled. Market panels read-only. Deterministic engines own numbers; the model only rephrases. Commits authored SaarKessel. The QA account still exists and is deleted at the end.
