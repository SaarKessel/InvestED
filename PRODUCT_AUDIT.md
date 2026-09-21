# InvestED product audit - learning-business stage

Baseline: `09523da72f2624e758e0f87d0e30da5ea74e6096`

## Product and UX

The product has strong individual tools, but discovery is feature-led and the dashboard is a dense output page. There was no persistent learning loop connecting profile, content, retrieval practice, simulation, feedback and progress. This release adds that orchestration as `/learn`, reusing Strategy Lab, Trivia, Simulation and Copilot rather than duplicating them.

The diagnostic is deliberately short and editable. Progress is visible, local-only and reversible. It avoids streak pressure, artificial scarcity and performance claims. The nav now gives learning a first-class entry point.

## Architecture and data

The current product is anonymous and browser-local. Analysis context is ephemeral; quiz, simulation and learning state use separate localStorage modules. The new journey has a versioned storage boundary and pure progress/next-step functions with tests. It reads existing quiz and simulation state but does not invent unified cloud identity or completion evidence.

A later account layer should introduce a server-owned learning-event model with consented sync, migrations, export/delete, idempotency and offline reconciliation. Do not retrofit billing into localStorage.

## Content, AI and safety

The first path teaches connected concepts, retrieval, application and reflection. “AI feedback” is labeled as rule-based guidance from local activity. Copilot remains educational and should never claim suitability, guaranteed outcomes, live facts it did not retrieve, or regulated advice. News implications remain general educational context linked to sources.

Before scaling content: add editorial ownership, learning objectives, citations where facts can change, review dates, misconception tags, difficulty calibration and a bilingual review workflow.

## Cost and operational readiness

The added loop is client-side and adds no model, database or licensed-data cost. Future generative coaching needs budgets, caching, rate limits, abuse controls, observability, provider fallbacks and a deterministic non-AI path. Market/news usage needs provider-term and redistribution review before commercial scale.

## Monetization readiness - not activated

The product remains free. No paywall, checkout, subscription, price, entitlement or locked lesson was added. Premium-ready boundaries can later cover deeper coaching, multi-device history, advanced cohorts or instructor tools, but only after a product decision.

Before charging, InvestED needs: authenticated identity; server-side entitlements; billing and tax handling; restore/cancel/refund flows; privacy and data-retention controls; analytics consent; licensed data review; legal review of claims, disclosures and jurisdiction; support and incident processes; accessibility review; and a user-owned packaging decision. Premium should add depth or service, not withhold basic safety education.
