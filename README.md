# InvestED

A bilingual, education-only financial learning platform built by [Saar Kessel](https://www.linkedin.com/in/saarkessel). InvestED connects an explainable investor-profile flow, deterministic financial calculators, a context-aware educational copilot, personalized learning paths, strategy exploration, market and asset research, portfolio simulation, quizzes and sourced financial news.

- Live product: https://investeducationai.vercel.app/
- Languages: Hebrew (RTL) and English (LTR)
- Stack: React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Framer Motion and Vercel serverless functions

> InvestED is for financial education only. It does not provide investment advice, recommendations, suitability decisions or guaranteed outcomes.

## Product surface

| Area | What it does | Data / AI boundary |
|---|---|---|
| Learning Hub | Builds a local personalized learning path and tracks reversible progress | Browser-local state only |
| Investor profile | Converts free text into an explainable educational profile and sample allocation | Deterministic engines; not a suitability assessment |
| AI Copilot | Handles educational concepts, calculations, follow-ups and market questions | Deterministic knowledge and calculation layer; optional local Ollama can rephrase responses |
| Calculator | Parses plain-language scenarios and explains compound-growth calculations | User assumptions, never a forecast |
| Strategy Lab | Explores and compares educational strategy models | Educational comparison, not a recommendation |
| Asset Research | Resolves supported symbols, retrieves price history and computes indicators | Every result carries source, timestamp and freshness; unavailable data stays unavailable |
| Portfolio Simulation | Runs educational historical or structural scenarios | Simulated/historical results are labeled and are not predictions |
| News | Shows sourced market-news items and deterministic educational context | Links to original sources; no hidden sentiment model |
| Trivia | Bilingual quizzes with explanations and local progress | Local-only progress |
| Data controls | Exports or deletes InvestED's browser-local user memory | No remote account or cloud sync |

## Architecture and truthful boundaries

### Browser application

The React application owns routing, localization, presentation and deterministic education logic. User profile, quiz, learning and simulation state use versioned browser storage modules. There is no remote user account or cloud persistence in the current release.

### Market data

The browser calls `api/market-quote.ts`, `api/market-movers.ts` and `api/news.ts`. Provider calls happen server-side. Market quote routing prefers Alpha Vantage only when `ALPHA_VANTAGE_API_KEY` is configured, then falls back to Yahoo Finance on provider availability failures. Responses preserve provider, timestamp and freshness. The production endpoint never silently manufactures a quote. Development-only fallback values are explicitly labeled as simulated.

### AI and calculations

Core educational answers, scenario calculations and conversation context are deterministic and tested. An optional local Ollama service can rephrase approved content, but it is not required for production functionality and is not presented as a cloud model. The product refuses to invent current market values and keeps education-only guardrails in generated responses.

### Privacy

The released product has no authentication, billing, cloud profile database or external notification delivery. Local data controls are available at `/data-controls`. Read the in-product Privacy and Terms pages before using the product.

## Routes

`/`, `/start`, `/dashboard`, `/learn`, `/calculator`, `/strategy-lab`, `/research`, `/chat`, `/trivia`, `/news`, `/simulation`, `/data-controls`, `/about`, `/faq`, `/contact`, `/privacy`, `/terms`, plus a dedicated not-found page.

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm ci
npm run dev
```

The Vite development server does not run Vercel functions. Use `vercel dev` when testing serverless market/news endpoints locally. Ollama is optional and only used if a visitor intentionally runs a compatible local service.

## Quality gates

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The test suite covers core calculators and edge cases, conversation context, bilingual content, market-provider routing and provenance, research indicators, strategies, simulation, portfolio intelligence, storage, learning progress, production guardrails and selected rendered UI states.

## Repository map

```text
api/                 Vercel serverless market and news endpoints
src/components/      Shared UI and feature views
src/context/         Language, theme and analysis providers
src/lib/             Deterministic domain engines, data services and storage boundaries
src/locales/         Complete Hebrew and English dictionaries
src/pages/           Route-level product pages
public/              Brand and social-preview assets
```

## Release constraints

Before commercial or regulated use, the product still needs jurisdiction-specific legal review, provider licensing/redistribution review, production identity and consented server storage if accounts are added, operational monitoring and a formal accessibility audit. Current legal pages are product disclosures, not a substitute for professional legal review.

## License

No open-source license has been granted. The source is publicly viewable, but reuse, modification and redistribution are not permitted unless Saar Kessel grants permission in writing.
