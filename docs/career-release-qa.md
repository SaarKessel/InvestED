# Career games local release QA

Checked locally on September 30, 2026. No remote push or deployment.

## Completed checks

- Hebrew and English: Analyst and Accountant full calculation, evidence selection, submission and reload journeys. Unsupported evidence blocks completion. Submitted fields are locked.
- Hebrew and English: Portfolio buys 100 fictional NST-F shares at 100, answers each client separately each day, closes five days and liquidates at 118. Final cash 11,620, manager fee 180, net return 16.2%, three retained clients. Reload preserves settlement and disables orders.
- Each of the three games: no page-level horizontal overflow at 320, 390, 768 and 1440 CSS-pixel widths.
- Completed run summaries survive restart and reload. New runs clear current answers, holdings and decisions, retaining at most 20 local summaries.
- All three source desks render unavailable without inserting mock prices or changing a fictional ledger.
- Source candle rendering checked with prominently stamped QA fixtures, not live market evidence. Missing provider OHLC remains unavailable rather than generating source candles from closes.
- Full automated suite, typecheck, production build and lint. Six existing lint warnings remain. Production bundle-size warning remains.

## Release limitations

- Live Yahoo success has not been verified. The first external chart request returned HTTP 429; further probes stopped.
- Vite development does not serve the existing serverless market endpoint. Production connectivity requires testing that endpoint in its intended environment, without deploying as part of this assignment.
- Yahoo access is unofficial. Coverage is not universal; prices may be delayed or stale. Public-product data-use rights remain unresolved.
- Source inspection is read-only. Real-source paper trading needs a separate currency-aware ledger and immutable source/time/price snapshots, not a price swap into the fictional five-day game.
- Local summaries are editable/self-reported practice, not credentials or verified work.
- Warm-instance caches, negative caching, request coalescing and cooldown reduce requests but are not a distributed provider-wide rate limiter.

## Shared desks and committee practice

- Operations: evidence must match the classified exception before resolving it. Corrected custody, documented fee, approved fund NAV and preserved-original duplicate handling tested. Market quotes/manual edits cannot clear the exception. Closed legacy records remain readable without claiming evidence resolution.
- Nine fictional committee cases across investment, research and reporting: review, defer and narrowly supported approval. All wrong/right selections persist on reload in Hebrew and English; each desk shows one selected case with completed-case markers.
- Shared committee selectors: 320/390/768/1440 CSS-pixel widths have no page-level horizontal overflow in either language. Stale-tab saves leave the newer local record unchanged and show a conflict warning.
- Full suite at this checkpoint: 784 passing tests across 85 files. Typecheck, production build and lint pass with the existing six warnings.

- Explicit conflict recovery verified in committee and operations desks: loading the latest snapshot does not write to storage, preserves concurrent choices, then allows a fresh guarded save. Blocked committee writes do not show false progress. Eight component tests cover bilingual selectors, independent choices, remount persistence, blocked storage and recovery.

- Supporting operations packet values visually checked in both languages: corrected custody, approved fund units/cash, fee bridge and duplicate count remain separate from original records. Seven page-level tests cover evidence rejection/packet display, bilingual conflict recovery, legacy closure, blocked saves and evidence-completed closure.

## Final local cross-desk rerun

At the current checkpoint, all three original game completion journeys passed again in both languages after shared-case changes. Portfolio settlement remained 11,620 cash / 180 fee / three clients. Analyst and Accountant reject unsupported board claims and lock submitted calculations after reload. The three practice-restart summaries survive reload with a clean new run. Nine committee cases and committee/operations conflict recovery passed again. No Yahoo requests were made by these local journeys.

- Bilingual content-contract tests verify every shared committee/operations case has facts, reasons, evidence, packet-number labels and recovery controls in both dictionaries.

## Keyboard and shared-desk accessibility checkpoint

- 790 passing tests / 85 files. Six new regression tests cover bilingual queue/inspection relationships, row/column table headers, skip-link focus, focus after evidence resolution, and focus recovery after local conflicts.
- Local Chrome keyboard journeys (Tab, Enter and Space): operations queue -> selected inspection -> classification -> supporting evidence -> resolution. Resolution focus moves to the new status instead of being lost when its button disappears. Committee disclosure -> case selection -> decision passes in all three shared desks in Hebrew and English.
- Inspected 1440px desktop and 390px mobile captures for all four desks, both languages. No horizontal page overflow. Shared dark surfaces use a 3px light-teal focus outline independent of theme; summaries and buttons have a 44px minimum height. Forced-colors mode uses the system Highlight color.
- Native button/disclosure keyboard behavior is preserved, without adding tab roles or arrow-key conventions to ordinary button groups. Queue buttons identify their inspection target; evidence/decision controls have named groups. Local recovery preserves data and restores focus to a stable control.
- External requests were blocked during these local browser checks. No Yahoo inspection or source data assertion. This is not a screen-reader certification or full WCAG audit.

## Bounded scenario expansion

- Twelve committee cases, four per shared investment/research/reporting desk. Added a proposed issuer-weight breach (35% current vs 45% proposed against a 40% case limit), a basic/diluted EPS denominator error (120/60 vs 120/80), and a narrowly stated accrual bridge (30 collections + 60 receivable increase = 90 booked revenue).
- All figures are invented teaching inputs. EPS cards distinguish fictional shares from game units per share. Explanations reject claims beyond the supplied data; the accrual bridge is not revenue-recognition or collectability assurance.
- Earlier three-case saved choices remain valid. Six bilingual component checks cover new case selection, independent persisted choices and feedback; two arithmetic/backward-compatibility tests added. Full suite 798 tests / 85 files; typecheck/build/lint pass with existing warnings.
- Real local keyboard journeys and inspected 1440px/390px captures passed in both languages for each new case. No horizontal page overflow or external source requests.

## Combined operations exception and versioned local exercises

- Added S-104 to new operations runs: custody 5 vs 6 units plus gross cash 600 vs bank net 585. Only the combined approval packet supports both the position correction and documented fee of 15. Single-break packets, quotes and unsupported edits cannot resolve it.
- New runs use caseVersion 2 with seven records. Unversioned existing runs retain their original six records, whether in progress or closed; restarting archives the true six-record result and starts the seven-record exercise. No silent reopening or progress loss. Expanded version requires evidence/resolution fields and rejects case IDs outside its exercise.
- Seven more regression tests cover bilingual combined evidence, original six-case rendering, backward-compatible closure/restart, multiple-break arithmetic, version validation and evidence requirements.
- Full suite: 805 tests / 85 files. Typecheck, production build and lint pass with existing warnings. Build initially ran out of memory because local QA servers remained alive; they were stopped, and a bounded-memory production build passed. No production settings changed.
- Inspected Hebrew/English desktop/mobile captures of the combined packet and resolution, with real keyboard queue/classification/evidence/resolution checks and no page-level horizontal overflow. External requests blocked.

## Recovery and completion focus regression

- Loading an older six-record snapshot while inspecting new S-104 now clamps the queue selection to F-203. The selected queue button, visible inspection and focused heading remain aligned. It does not overwrite the newer snapshot during recovery.
- Closure focus moves to the resulting completion status; confirmed restart focuses the first inspection. Blocked operation evidence and committee decisions retain the focused control, prior data and prior completion count.
- Nine added regression tests include both languages, version-crossing recovery, blocked saves, original evidence-completed restart and close/restart focus. Full suite 814 tests / 85 files; typecheck/build/lint pass with existing warnings.
- Inspected bilingual 1440px/390px recovery screenshots after real Tab/Enter events; focused heading and selected queue card match with no horizontal overflow. No external requests.

## Landmark and chart-inspection accessibility

- Four shared career desks now use the existing Layout main landmark rather than nesting a second main. Eight bilingual tests render the real Layout and assert a single main, single h1 and correct RTL/LTR section.
- Candle count controls have translated accessible names; the keyboard range inspector exposes its selected date and OHLC through aria-valuetext. Two bilingual chart tests cover value changes and callback indices.
- Full suite 824 tests / 87 files; typecheck/build/lint pass with existing warnings. Local keyboard committee journeys and bilingual desktop/mobile captures inspected again after the semantic-only changes. One main landmark confirmed in live local DOM. No external requests.

## Progression and experience-record contracts

- Assessed the original Career Lab progression and experience-record contracts; findings recorded in docs/career-progression-contracts.md.
- Analyst first-generation submitted records (no board choice, 40-character memo rule) are readable again; the validator applies the rule in force when a record was written. Second-generation records keep the 20-character memo plus board-choice rule. Six new validator tests including a storage round-trip.
- Completed Career Lab cases are archived on completion and on first load of a previously completed case: device-local, deduplicated by case id, capped at 10, validated as complete records only. Starting a new case no longer destroys the completed experience record. Archive renders on the complete stage in both languages.
- Career Lab stale-tab conflicts now offer explicit load-latest recovery matching the committee/operations contract: recovery reads without writing; the alert clears; the newer snapshot is shown, and a newly loaded completed snapshot is archived too. Conflict copy now names the recovery control instead of a page reload. Covered by six bilingual page tests.
- Full suite: 835 tests / 88 files. Typecheck, production build and lint pass with the existing six warnings and bundle-size warning.

## Chair follow-up challenge

- Analyst and Accountant board desks now end with a chair follow-up: one question, three fixed low-typing responses, only the evidence-bounded answer unlocks submission. Overclaims (a settled question, a proven thesis, a company that cannot fail, replacing an audit) are rejected with a correction note.
- Follow-up appears only after the evidence selection is supported. Changing evidence resets the follow-up to unanswered. Records from earlier generations (no follow-up field) remain readable and submittable under their own rules; new runs start with the field unanswered.
- Five new contract tests cover per-role answers, the submission gate, legacy-generation readability and validation of the stored value. Full suite: 837 tests / 88 files; typecheck, production build and lint pass with the existing six warnings.
- Real local browser journeys in both languages on both desks: wrong follow-up keeps submission blocked, the supported answer enables it. Inspected bilingual 1440px/390px captures; no page-level horizontal overflow. External requests blocked; the source desk stayed read-only.

## Monitoring plan scoring (trading-loop deepening)

- The Portfolio desk's monitor commitment now has a deterministic, explained effect in new games: report back to the client (+4 trust when you explain that day) or break the commitment (-10 on silence/ignoring). Unrealistic guarantees keep their standalone -35. Cash-buffer rules are unchanged.
- Exercises are version-gated like the operations desk: new runs carry planVersion 2; earlier local saves keep monitoring as a label without effect, and their trust replays are unchanged. The plan note copy is version-aware in both languages.
- Four new tests cover the +4/-10/0 scoring, legacy no-effect saves, and plan-version validation. Full suite: 840 tests / 88 files; typecheck, production build and lint pass with the existing six warnings.
- Real local browser journeys in both languages committed the monitor plan and verified the versioned note and saved record; inspected bilingual 1440px/390px captures, no page-level horizontal overflow. External requests blocked.

## Career Lab track registry (engine generalization)

- The Career Lab engine now runs on a track registry (src/lib/career/tracks.ts). Investment Analyst keeps its original storage keys (invested_career_analyst_v1 / _archive_v1), evidence symbol (AAPL) and content untouched; records without a track field remain readable as analyst cases. Banking / Credit Analyst is registered with its own keys, no live evidence symbol, and shows as a locked "in preparation" entry - selecting it is not possible.
- All engine storage and evidence functions take an explicit track and default to the analyst track, so existing saves, archives and conflict recovery behave byte-identically. A track picker on the Career Lab page lists registered tracks; locked tracks render disabled with a dashed treatment in both languages.
- Four new registry tests cover analyst key preservation, the locked credit track, legacy no-track readability with per-track storage separation, and rejection of unregistered tracks with per-track archives. Full suite: 844 tests / 89 files; typecheck, production build and lint pass with the existing six warnings.
- Inspected bilingual 1440px/390px captures of the Career Lab picker with a completed analyst case and archive seeded; no page-level horizontal overflow. External requests blocked during capture.
