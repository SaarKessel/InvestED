# Career Lab progression and experience-record contracts

Assessed locally on September 30, 2026 against the restored cumulative checkpoint. No remote push or deployment. Scope: the original Career Lab pipeline (`src/lib/career/engine.ts`, `src/pages/CareerLabPage.tsx`) and the shared experience-record contracts (`practiceRuns.ts`, role-game validators). This audit changes no game rules; it fixes validator/storage contracts and records what each contract promises.

## Progression contract (engine.ts)

- Stages: lesson → practice → research → defense → review → improve → complete. `canAdvance` gates every stage except review (advisory) and complete (terminal). `advance` refuses to skip; `completedAt` is set exactly once, on entering complete.
- Validation is stage-consistent: `isResearchCase` requires every field that an earlier stage gate required, so a readable record can always continue from its own stage. A complete record must carry non-blank answers and a validated source evidence snapshot (symbol, currency, source, freshness, timestamp not after capture).
- Review findings (thin thesis, stale evidence, mandate breaches) are advisory and never computed from price moves; no scoring of returns or certification of analysis quality.
- Stale-tab safety: `saveCase` compares the entire previous record, not a timestamp; conflicts throw `CaseConflictError`.

## Findings fixed in this milestone

1. **Analyst submitted-record memo threshold mismatch.** The first local analyst generation (before the board choice existed) required a 40-character memo to submit. The next generation required 20 plus a board choice, and the validator later routed every legacy submitted record through the current `readyToSubmit`. A first-generation submitted record (no `boardChoice`, 40-character memo, legitimately submitted under its own rule) then failed validation and was silently discarded on read. `isAnalystGame` now validates a submitted record under the rule in force when it was written: no board choice and no evidence field means the 40-character memo rule; otherwise the current rule applies. Regression tests pin both generations and a storage round-trip.
2. **Completed experience records were destroyed by starting a new case.** "Start another case" overwrote the single save key, losing the completed Simulation-Based Experience record — while all four role games archive their runs. Completed cases are now archived (device-local, deduplicated by case id, capped at 10) the moment a case completes, including once on page load for cases completed before the archive existed. The complete stage lists archived records with honest labels (self-reported, not verified).
3. **Career Lab had no stale-tab recovery.** A conflict only showed "reload the page", discarding unsaved draft text. There is now an explicit load-latest control matching the committee/operations contract: recovery reads the newer snapshot without writing; the next save is a fresh guarded write.

## Contracts left unchanged (assessment notes)

- Review thresholds (80/50/50/50) are stricter than advance gates (20) by design: passing a stage is not a quality claim.
- `practiceRuns` accepts at most 20 runs per role with the six shared metric keys; the unused `<=8` key bound is harmless and kept for storage-shape stability.
- Role games already archive bounded run summaries and expose them in `PracticeHistory`; the portfolio desk stores pre-rounded metrics.
- Committee and operations desks already implement explicit conflict recovery and versioned exercises; the Career Lab now matches that standard.

## Honest limits

- All records are device-local and self-reported. The archive is not anti-tamper verification, a credential, or employment history.
- Live source evidence (Yahoo) remains unverified in production; the research stage still refuses mock or unvalidated quotes.
