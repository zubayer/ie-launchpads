# V3 execution plan

The living register for the V3 master specification (`IE_Launchpad_V3_Claude_Master_Prompt.md`, kept by the owner). One row per feature ID. Statuses: **Planned** → **In progress** → **Implemented** (merged code) → **Tested** (automated tests and a browser run passed) → **Expert reviewed** (a named human reviewed it). **Blocked** needs something outside the repository. No feature is Expert reviewed yet.

Resume from "Next batch" at the bottom. Counts come from `npm run docs:coverage` (`docs/CONTENT-COVERAGE.md`), never from this file's history.

## Baseline (2026-11-25, `main` at `294d695`)

| Measure | Value | How measured |
|---|---|---|
| Lessons / domains / labs / role paths / periodic methods / modes | 494 / 22 / 30 / 15 / 107 / 9 | `docs/CONTENT-COVERAGE.md` |
| Blueprint topics with a lesson | 391 of 580 (67%) | `npm run docs:gaps` |
| Lessons meeting the V3 core minimum | 27 of 494 (5%): all in Lean and Quality | `meetsMinimum()` in `src/lib/contentStats.ts` |
| Worked examples / machine-checked | 123 / 119 | coverage generator |
| Checked examples whose check did not match the shown answer | 8 (fixed in batch 1) | `src/lib/numeric-qa.test.ts` |
| Formulas with symbol definitions | 8 of 91 | coverage generator |
| Tests | 62 passed | `npm test` |
| Initial JavaScript (entry + preloads) | 1,257.2 KB raw, 420.4 KB gzip | `npm run size` on a clean build of `294d695` |
| Browser + axe audit | 67 routes × light/dark, 0 violations, 0 script errors | `npm run audit` |
| V1 repository | untouched: no commits, settings or deployments changed | — |

Not measured: field performance (LCP/INP/CLS), real touch devices, screen readers other than accessible-name checks, learning outcomes (no pilot has run).

## Register

| ID | Feature | Status | Evidence / path | Next action |
|---|---|---|---|---|
| P0 | Baseline audit and register | Tested | This file; `docs/CONTENT-COVERAGE.md`; `npm run size` | Re-run each batch |
| EDU-01 | Canonical lesson schema | In progress | `Concept` in `src/types.ts` (optional fields render only when present); `example.check.shown` added for rounded or converted answers | Units on formula symbols; nonnumeric-topic flag; mode explanations and time estimates |
| EDU-02 | Coverage and depth | In progress (SQL deepened: 1 → 9 lessons) | Coverage dashboard by domain; ratchet test keeps the core-minimum count from falling | Batch of 10–20 lessons: PLC/automation first, then stats, OR, economics |
| EDU-03 | Assessment, retention, mastery | In progress (slice Tested) | `Attempt` evidence in the store (persist v2 with migration); dimensions recall → communicate; unit-aware grading with tolerances and misconception feedback (`src/lib/answers.ts`); seeded variants; confidence; one try per day for fixed questions; delayed check; evidence table | Show evidence on lesson pages and in Progress; numeric items in the practice quiz; multi-select, matching, ordering; mastery levels |
| EDU-04 | Equation Explorer | Tested | `/formulas/:id`, 9 experiments (`src/content/equations.ts`): takt, Little’s Law, OEE, Cpk, EOQ, NPV, Newton–Raphson IRR, M/M/1, sensor scaling. Symbols, units, units check, bounds, invalid/caution states, sensitivity chart with table, predict-first, spreadsheet and Python. 13 tests with independent reference cases and properties | Linear regression (data points), formula builder, units on formula-library symbols |
| KNOW-01 | Source registry and verification | Implemented (V2) | `src/content/sources.ts`, 12 sources, 54 lessons cited | Claim-level review queue, source filter, report-an-issue |
| KNOW-02 | Live discovery reliability | Implemented (V2) | Live panels fail gracefully offline (audit runs offline) | Make the AI preview opt-in; cache and abort audit |
| KNOW-03 | Mathematical and factual QA | Tested | Shown answer must contain the checked value; checks must compute; unchecked-numeric and coverage ratchets; generated dashboard | Units on every checked example |
| UX-01 | Information architecture | In progress | Sidebar groups (V2); Guided pathways added under Learn | Map to the spec’s top-level groups with route aliases; onboarding |
| UX-02 | Visual design system | Planned | Tokens exist in `src/styles.css` | Document tokens; chart and focus tokens |
| UX-03 | Personal command center | In progress (slice Tested) | “Do next” on Today (`src/lib/recommend.ts`): due reviews → repeated mistakes → started pathway → role path with prerequisites first → lab → notebook; reasons shown; 5/15/30/60-minute sessions; “Not now”. 6 scenario tests | Exam date, weekly recap, resume session; show Do next above the hero for returning learners |
| EXP-01 | Method DNA | In progress | Periodic table (107; inputs/outputs for 6), 4 chains, field guide (47 nodes) | Inputs/outputs for all methods; DOE, reliability, capacity chains; field-guide branches for service, healthcare, data centers |
| EXP-02 | Skill tree and maps | In progress | Subway map, knowledge map | Prerequisite paths, accessible list view, history timeline |
| EXP-03 | Industry World | Planned | Spot-the-waste scene is a first hotspot scene | Reusable scene/hotspot component; manufacturing plant |
| EXP-04 | Challenge engine | In progress | Mysteries, pairs, spot the waste, Grand Prix (separate pages). Mysteries now record case evidence | Shared branching-case schema; more cases |
| EXP-05 | Meaningful gamification | Planned | — | Evidence-based achievements only |
| LAB-01 | Shared lab framework | Planned | `src/sims/kit.tsx` primitives | Standard lab shell: assumptions, presets, export |
| LAB-02 | Factory Sandbox (discrete-event) | Planned | Visual factory is steady-state and labelled so | Event-queue kernel for a serial line in a Web Worker, validated against Little’s Law |
| LAB-03 | Additional labs | Planned | — | Split into tracked features before coding |
| TOOL-01/02 | Software studios, browser SQL/Python | In progress (SQL Tested) | **SQL studio** `/studio/sql` (10 lessons) and SQL playground `/lab/sql`: SQLite (sql.js, WebAssembly) in a Web Worker, loaded on first run, 4 s time limit with automatic restart, synthetic Riverbend Plant database, practice graded by result-set comparison, attempts saved as `implement` evidence. Every course query re-run by `src/lib/sql.test.ts`, key tables cross-checked in plain JavaScript | Cite the official SQLite/PostgreSQL docs once the pages can be opened and checked; Excel and Python studios |
| CAR-01–04 | Industry, portfolio, job pipeline, capstones | Planned | Role paths, interview center, job decoder (V1/V2) | Portfolio studio with Markdown export |
| AI-01 | Deterministic adaptive planner | In progress | Do next rules and scenario tests | Diagnostics; weekly plan |
| AI-02 | Source-grounded tutor | Blocked | Needs an approved server and key held server-side | Owner decision |
| ARCH-01 | Modular architecture | In progress | Pure kernels with tests: `equations`, `answers`, `recommend`, `contentStats` | ADRs for storage and chunking |
| ARCH-02 | Performance and offline | In progress | Initial JS 1,259.5 KB raw / 422.0 KB gzip after batch 1 (+2.3 KB raw vs baseline); new pages lazy-loaded | Split concepts by domain; PWA with safe updates |
| ARCH-03 | Reliability, security | In progress | Persist v2 migration; imports validate `attempts` | Error boundaries per route; import size limits |
| ARCH-04 | Deployment and CI | Implemented | Pages deploy on `main`; new PR check (`.github/workflows/ci.yml`): tests, build, size, browser audit | Confirm it passes on the first PR |

## Batch 1 (2026-11-25, branch `v3/foundation`)

Shipped: P0, KNOW-03, EDU-04 first tranche, EDU-03 slice, the Lean throughput gold-standard pathway (`/paths/lean-throughput`: takt → bottleneck → OEE → Little’s Law → Visual factory → case → delayed check), UX-03 Do next, PR CI. See `CHANGELOG.md`.

Acceptance evidence: `npm test` 96 passed; `npm run build` passed; `npm run audit` 74 routes × 2 themes clean; scripted browser runs of the pathway (unit-aware answers, misconception feedback, reload persistence, v1 → v2 save migration keeping progress and mistakes) and of Do next; no horizontal overflow at 360, 768, 1024 and 1800 px on the new pages.

## Batch 2 (2026-11-25, branch `v3/sql-studio`)

Owner feedback: SQL topics lacked depth. Shipped the SQL studio (10 lessons: SELECT, WHERE, calculated columns, GROUP BY/HAVING, joins, NULL, subqueries/CTEs, window functions, data-quality checks, indexes and design) with 25 worked examples, 15 common mistakes shown wrong-vs-fixed, 21 graded practice tasks and interview questions; 8 new lesson pages; the existing SQL lesson rewritten; a live playground; “Deep dive” links on the SQL lesson pages.

Evidence: `npm test` 108 passed (every course query re-run; three draft claims were found wrong by the tests and corrected); build passed; `npm run audit` 82 routes × 2 themes clean; browser run of queries, error hints, the 4 s runaway-query stop and restart, graded tasks and reload persistence; no overflow at 360 and 768 px. Initial JS +16.7 KB raw (+5.8 KB gzip) from the new lesson text; the engine (341 KB gzip) loads only when a query runs.

Not done: citations. The official SQLite and PostgreSQL documentation pages could not be opened in this session (approval timed out), so the new lessons carry no citations and stay at review status “none”; their behaviour claims are instead demonstrated by queries the tests run.

## Next batch

0. **Cite the SQL lessons** from the official SQLite and PostgreSQL docs after opening and matching each section (KNOW-01); that lifts 9 lessons to the core minimum.
1. **PLC gold-standard pathway** (EDU-01/02): enrich scan cycle, ladder logic, NO/NC (instructions test a bit, not the wiring), seal-in, timers, sensors with verified sources; logic items (truth tables, rung outcomes) in the pathway engine; reuse the ladder simulator.
2. **EDU-03 everywhere**: evidence on lesson pages and Progress; numeric items in the practice quiz; matching and ordering items.
3. **LAB-02 kernel**: discrete-event serial line in a Web Worker with seeded runs, validated against Little’s Law and hand cases.
4. **ARCH-02**: split concept content by domain behind a small search index; measure before and after with `npm run size`.
5. **UX-01**: top-level groups from the spec with route aliases; first-visit onboarding (goal, level, time).
