# Implementation status

The single registry of what exists. Statuses: **Planned** → **In development** → **Implemented** (code merged) → **Tested** (automated tests and a browser run passed) → **Verified** (a named human reviewed it). **Blocked** means it can't proceed without something outside the repo. Nothing here is Verified yet: no human expert review has happened.

Last updated 2026-11-27 (adds PRs #18–#27 and the jobs card). The V3 register is `docs/V3-EXECUTION-PLAN.md`.

## Baseline (from V1, preserved)

| Feature | Status | Evidence |
|---|---|---|
| 494 concepts, 22 domains, stable ids and routes | Tested | `npm test` (unique ids, references, subs) |
| 30 simulators (incl. Scheduling Grand Prix and Visual factory) | Tested | `npm run audit` loads every `/lab/:id` in light and dark |
| Machine-checked worked examples | Tested | `example.check.compute()` in `src/content/content.test.ts` |
| Flashcards (SM-2), practice quiz, interview center, STAR, decoder, plan, map, progress export/import | Tested | Route audit; no script errors |
| Hover cards, Wikipedia keywords, selection lookup | Implemented | Browser-checked with mocked Wikipedia |
| Live web panel (Wikipedia, AI, Wikipedia search, Stack Exchange, OpenAlex) | Implemented | Mocked-API browser run; fails gracefully offline (audit runs offline) |
| Jobs that need it (role paths, titles, job-board links) | Tested | Data tests |

## V2 additions

| Feature | Status | Evidence / notes |
|---|---|---|
| Engineering Academy: source directory, software pathways, missions with synthetic CSVs, checklists, bottleneck lab | Tested | Route audit; numeric checks |
| Curriculum blueprint (30 areas, 580 topics) + `/curriculum` coverage matrix + generated gap analysis | Tested | `npm run docs:gaps`; route audit |
| Source registry (`src/content/sources.ts`), citations, review statuses | Implemented | Lean (30) and Quality (26) lessons carry citations. Statuses were set by an AI-assisted pass; none are expert-reviewed |
| Browser + accessibility audit (`npm run audit`) | Tested | 74 routes × light/dark, offline, axe WCAG 2.2 AA rule set: 0 violations, 0 script errors |
| Saved-progress hardening (versioned persist, merge with defaults) | Tested | Audit seeds partial saved state; no crashes |
| Daily plan crash on a cleared date field | Fixed, Tested | Audit |
| Learning modes (9) changing sections, order and depth | Tested | `src/lib/learning.test.ts`; browser run of all 9 modes |
| Wikipedia + AI quick preview near the top of every topic | Replaced (PR #20) | Superseded by “Live from the web” as section 2 of every lesson; see the UI section below |
| Learn first / This unlocks / previous–next lesson pager | Tested | Browser run |
| Formula library `/formulas` (91 formulas, pin + print sheet) | Tested | KaTeX renders every formula and symbol (test); route audit |
| Error notebook `/notebook` (auto-logged wrong answers, recurring misses) | Tested | Store test; browser run |
| Periodic Table of IE `/table` (107 elements, 10 families, detail panel, print poster) | Tested | Data tests (ids, unique symbols, level order); route audit; browser run. Inputs/outputs written for 6 elements so far |
| Reaction chains `/chains` (4 chains) | Tested | Every step id checked by test; route audit |
| Scheduling Grand Prix lab | Tested | Hand-computed example + SPT/EDD theorems on 500 random job sets |
| Engineering Economics cheat sheet `/sheets/engecon` | Tested | Worked example and trap numbers recomputed in tests; prints on one A4 page |
| Method field guide `/guide` (problem → questions → method, data, software; 6 starting branches, 34 answers, 54 method cards) | Tested | Graph test: every answer leads to a real node, every node reachable, every method a real lesson; route audit |
| Confused pairs `/pairs` (17 pairs, study side by side, 34-scenario drill) | Tested | Each pair has scenarios for both sides (test); wrong answers go to the error notebook (browser run) |
| Factory mysteries `/mysteries` (3 cases, clues unlock as you decide) | Tested | Answer indices, clue references and the scrap-case totals checked by test; browser run to "Case closed". Cases and data are illustrative |
| Visual factory lab `/lab/factory` (stations with cycle time, availability, yield; takt, bottleneck, RTY, Little's law) | Tested | `runLine` matches the hand-worked mystery (68.75 s, 366 units, 91.7%); Little's law identity; scenarios checked |
| IE subway map `/subway` (roles as lines, interchanges, next stop, live status) | Tested | Route audit; line choice kept in the URL |
| Tool cards `/tools` (20 tools, filters, compare up to 3) | Tested | Lesson links and https sites checked by test. Learning-curve ratings are our estimate; costs and licences should be re-checked with vendors |
| Spot the waste `/spot-waste` (8 hotspots, one per TIMWOODS waste, timer, hints) | Tested | One hotspot per waste (test); full playthrough in a browser; keyboard-operable buttons with neutral labels |
| Sidebar grouped into Learn, Practice, Labs and tools, Career, You | Tested | Route audit |
| V3: numeric QA (shown answer must contain the checked value; ratchets) | Tested | `src/lib/numeric-qa.test.ts`; 8 examples corrected to check the number shown |
| V3: coverage dashboard `docs/CONTENT-COVERAGE.md` | Tested | Generated from live content by `npm run docs:coverage` |
| V3: Equation Explorer `/formulas/:id` (9 experiments) | Tested | `src/lib/equations.test.ts`: independent reference cases and properties; route audit; 360–1800 px overflow check |
| V3: Guided pathway `/paths/lean-throughput` with evidence by skill | Tested | `src/lib/pathways.test.ts` (300 seeds per generated question); scripted browser run incl. reload and save migration |
| V3: Do next on Today | Tested | `src/lib/recommend.test.ts` scenario tests; browser run |
| V3: SQL studio `/studio/sql` + playground `/lab/sql` + 8 new SQL lesson pages | Tested | `src/lib/sql.test.ts` re-runs every course query; browser run incl. timeout/restart and graded tasks; 82-route audit. No citations yet (sources not opened) |
| V3: PLC studio `/studio/plc` (9 lessons) on a ladder engine; PLC ladder lab rebuilt | Tested | `src/lib/ladder.test.ts` (engine vs hand-worked values), `src/lib/plc.test.ts` (every example, mistake, fix, solution and starter run); browser runs of grading and the live runner; 106-route audit. Sources: Rockwell instruction pages, ControlLogix manual, PLCopen, ISO 13849-1 abstract (opened and matched) |
| V3: CAD studio `/studio/cad` (7 lessons) and five CAD labs on lesson pages | Tested | `src/lib/cad.test.ts` (kernels vs hand-worked values; presets, model answers and wrong answers). SOLIDWORKS help matched only via the search engine’s copy (source-identified); drawings, FEA, DFM and DFA lessons unsourced and labelled |
| V3: PR check workflow | Implemented | `.github/workflows/ci.yml`; first run happens on the batch-1 pull request |
| Wide-screen layout (content beside the sidebar) | Tested | Route audit at 1366 and 1800 px |
| V2 ↔ V1 switch (same page where V1 has it) | Tested | Link-mapping test. V1 address defaults to the URL in the master prompt; set `VITE_V1_URL` if V1 lives elsewhere |
| Independent deployment of this repository | Implemented | GitHub Pages workflow (`.github/workflows/deploy.yml`) runs tests + build on every push to `main` → https://zubayer.github.io/ie-launchpads/. Goes live once this branch is merged. A Vercel project remains optional |

## V3 batch 4 (branch `v3/topic-depth`)

| Feature | Status | Evidence |
|---|---|---|
| Interview questions with type, origin, hint, follow-ups and rubric | Tested | `src/components/Interview.tsx`; schema tests in `src/content/content.test.ts`; browser run of hint, answer and rubric scoring |
| Teach it back on every lesson (typed or dictated) | Tested | `TeachBackCard`; text saved in progress (`teach`), self-check saved as `communicate` evidence |
| Read-aloud and dictation | Implemented | `src/lib/speech.ts`; shown only when the browser supports them |
| Operations Research depth (21 lessons) | Tested | `src/content/lessons/or.ts`; numbers recomputed in `src/lib/or.test.ts` |
| Equation Explorer: M/M/c and newsvendor | Tested | `src/content/equations.ts` reference cases |
| Dollar amounts no longer rendered as math | Tested | `src/lib/inlineMath.ts`; test in `src/content/content.test.ts` |

## Proposed V3 learning-quality contribution

| Feature | Status | Evidence / notes |
|---|---|---|
| Compound-unit grading and bounded Do Next plans | In development | Regression tests added; PR CI and browser checks pending. See `docs/CHATGPT-LEARNING-QUALITY.md`. |

## V3 UI, live sources and landing page (PRs #18–#24, merged 2026-11-26)

Owner requests, built one PR at a time. Live services (Wikipedia, Pollinations, Chrome's on-device model) can't be reached from the build sandbox, so those parts were checked with mocked responses and the audit runs offline.

| Feature | Status | Evidence |
|---|---|---|
| Live sources load without a click (Wikipedia summary and AI card open by default) — PR #18 | Implemented | Mocked-API browser run; audit checks the section loads with no script errors offline |
| Parallel AI cards: Pollinations (paced, one request per ~15 s per visitor, abandoned requests skipped) and Chrome built-in Gemini Nano (hidden when unavailable) — PR #19 | Tested | `src/lib/ai.test.ts` (pacer, skip, cache keys); mocked browser run |
| “Live from the web” is section 2 of every lesson in every learning mode; “Quick preview” removed — PR #20 | Tested | `src/lib/learning.test.ts`; audit checks the section order |
| Auto-hide site menu: edge hover, Menu button or M; Pin to dock; search always in the top bar; page behind an open menu is inert — PR #21 | Tested | Audit: menu hidden by default, M opens, axe on the open menu, Tab never reaches covered controls, Escape returns focus. Saved-progress version 3 with `migrateSave()` (`src/lib/store.test.ts`) |
| Full-width pages (cap 2,560 px) and a wider lesson section list — PR #22 | Tested | Measured at 1366, 1840 and 2560 px; audit |
| Landing page: three doors (look up, train for a job, practise), one search box, welcome-back bar for returning learners only — PR #23 | Tested | Audit: first visit in a fresh browser context (`data-visitor="first"`), returning learner sees the bar, “Search terms” opens search; Do next and focus timer moved to Daily plan |
| Landing page v2: four topic cards with each lesson's tested worked result, progress panel from saved data, 12 domain cards, 8 tool/skill tiles, footer link columns from the menu — PR #24 | Tested | `src/content/landing.test.ts` (card results match recomputed examples; 12 real domains); audit checks the cards; screenshots light/dark/phone |
| Last-7-days activity row uses calendar days (no repeated or skipped date at a daylight-saving change) | Tested | `lastDays()` in `src/lib/store.ts`; DST test in `src/lib/store.test.ts` |
## PLC machine lab: bottle filler (branch `v3/plc-bottle-filler`, 2026-11-27)

Owner request: integrate Zubayer's standalone PLC Ladder Lab (github.com/zubayer/PLCLadderLogic) into the PLC studio. Owner chose option 3: embed the lab and verify its logic on the studio engine. The original repo stays separate; merging the two later is the owner's call.

| Feature | Status | Evidence |
|---|---|---|
| Embedded lab at `/studio/plc/lab/bottle-filler` (iframe of `public/labs/plc-bottle-filler/`), credits and source link, S7 ↔ Logix address table, link from the studio index | Tested | Audit loads the route and waits for the ladder inside the frame |
| Accessibility fixes in the embedded copy (step-button contrast, `role="group"` on clickable drawings, readable scale and scrolling under 900 px, relative favicon, keyboard focus kept across ladder redraws), listed at the top of the file | Tested | Audit runs axe on the embedded page itself at 1366 and 390 px: 0 violations (the original had contrast 1, nested-interactive 2, target-size 14 on phones); the audit also checks a focused ladder symbol keeps focus while the timer runs (the original lost it within 1.2 s) |
| Auto cycle as a worked example in the Sequences lesson (`BOTTLE_FILLER` in `src/content/plc/course.ts`) | Tested | `src/lib/plc.test.ts`: the six-step scenario (arrive, fill 3 s, latch Full, restart, leave, reset, next bottle) passes on the ladder engine |
| Common mistake “Full as a plain coil” | Tested | Same suite: the OTE version fails (the valve reopens and refills the same bottle) and the OTL fix passes |

Limits: the lab keeps its own simulation code and dark look (no light theme), and loads Google Fonts when online (it falls back to system fonts offline). Updates to the original repo are copied over by hand.

## Certifications (branch `v3/certifications`, 2026-11-27)

Owner request: authentic, valued IE certifications with their facts, official syllabus headings and the lessons that teach them, plus help choosing the next one from job postings. Fees are linked, not copied.

| Feature | Status | Evidence |
|---|---|---|
| `/certifications` hub: six certifications (IISE Lean Green Belt, IISE Six Sigma Green Belt, ASQ CSSGB, ASQ CQE, NCEES FE Industrial and Systems, ASCM CPIM) with student eligibility, coverage meter and your opened/mastered lessons; seven more in "Other certifications to know" | Tested | Audit: hub and three detail pages, light and dark, 0 axe violations; no horizontal scroll at 390 px |
| Facts (experience, exam format, eligibility) each with a source link and as-of date; no fees | Source-checked | Each fact's page or PDF was opened on 2026-11-27; `certs.test.ts` fails on a fact without a link or with a `$` |
| Syllabus headings per certification, with official weights where published (CSSGB 2022 BoK, CQE 2015 BoK, FE July 2020 spec, CPIM ECM 9.0, IISE Six Sigma GB units); IISE Lean GB topics are partner-listed and labelled so | Source-checked | Tests: CSSGB weights sum to 100, CQE to 160; every mapped lesson id exists |
| Heading → lesson map (coverage 83–97%; gaps shown as "Not taught here yet") and a reverse index | Tested | `coverage()` and `certsForLesson()` tests |
| "Which certification next?" guide: role family, years of experience, certifications held (not saved); ranks by can-sit-now, then postings that name it, then coverage | Tested | `rankNext` test: held certifications excluded, eligible first |
| Job snapshot: 16 US postings read in full on 2026-11-27, with links, what each named and how (preferred/required) | Source-checked, small sample | Labelled on the page: 3 of 4 searches used certification keywords, so it leans towards postings that name one |
| Lesson pages: "On these certification syllabi" badges replace the old free-text "Shows up in" line | Tested | Audit covers `c/quality.cpk` |
| Menu (Career → Certifications) and landing tile (replaces the IE career map tile; the subway map stays in the menu) | Tested | Audit |

Limits: rules, syllabi and fees change, so each page says when it was read and links the official page. Eligibility in the guide is a first filter, not a ruling (FE eligibility is set by each state board). The job snapshot is one day's sample, not market data.

## IE jobs this week (branch `v3/jobs-pulse`, 2026-11-27)

Owner request: a card showing current IE job postings from authentic sources, several together. Setup and source details: `docs/JOBS-FEED.md`.

| Feature | Status | Evidence |
|---|---|---|
| Collector `scripts/fetch-jobs.mjs`: employer careers pages (Greenhouse, Lever; no key), USAJOBS (series 0896) and Adzuna (keys from GitHub secrets only); writes `data/jobs.json`; never fails the build and keeps the previous file if every source fails | Implemented | Runs in the deploy workflow (weekly schedule and every deploy); the PR check runs it against the live employer boards for information. USAJOBS and Adzuna parsing is untested against live data until the owner adds keys |
| Title-based role matching, de-duplication (employer page preferred over aggregator), weekly history (one row per week, 12 kept) and like-for-like trends | Tested | `src/lib/jobsFeed.test.ts` (8 tests) |
| Card on the landing page and Certifications: counts with trend, latest postings with source, sources and "Jobs by Adzuna" attribution, empty, loading and offline states | Tested | Audit covers both pages with the committed empty file; also checked with a local illustrative file in light, dark and at 390 px: 0 axe violations, no sideways scroll |

Limits: the counts are a weekly snapshot, not live. Without Adzuna they are the roles open on a handful of employer boards (plus USAJOBS), and the card says so. First PR run: 5 boards answered with 344 IE-type open roles; 3 tokens returned 404 and one Lever board was empty, so those were removed. Greenhouse dates use the first-published date when the board gives one; otherwise the card labels the date "updated". Undated roles count as open but are not listed. Second PR run: 10 of 12 boards answered (Rivian and Saronic tokens returned 404 and were removed). Codex review (4 P2s: update dates, undated Lever roles, Adzuna fallback basis, zero-count trend) fixed in the same push.

## Known limitations

- Review statuses on Lean, Quality, automation and OR lessons are AI-assisted; treat `source-checked` as "a source was matched", not expert review.
- The ladder engine is a teaching model of Rockwell Logix instruction behaviour (synchronous scan, listed prescan rules), not a controller emulator; the CAD labs model the ideas under SOLIDWORKS, not the software.
- Units are not yet a structured field on formulas; the library shows only what the lessons state.
- Progress is saved per browser and separately for V1 and V2.
- The first visit downloads ~818 KB of JavaScript (262 KB gzipped); full lesson text loads per domain on demand. Without a service worker, a domain never opened before needs a connection.

## Proposed comparison studio (November 26)

| Feature | Status | Evidence |
|---|---|---|
| Confused Pairs expansion and accessible comparison cards | In development | 51 authored pairs, 102 practice scenarios; search, domain and concept filters, formula/analogy disclosures and two visual comparisons. |
| Topic terminology explanations | In development | 35 specialized records plus existing full-name fields; Cp/Cpk explicitly mathematical notation. |
| Release validation | In development | Data tests, numeric reference checks and mobile/browser interactions added; CI and rendered review pending. |

## Proposed Engineering Abbreviation Dictionary (November 26)

| Feature | Status | Evidence |
|---|---|---|
| Curriculum-wide dictionary index | In development | All topic IDs indexed; explicit existing full names, 216 authored terminology/notation rows, lesson and Equation Explorer symbols. |
| Offline search, filters and topic links | In development | Dedicated lazy route, shareable filters, links from lessons and comparisons. |
| Terminology QA | In development | Selected references, contextual ambiguity, inventory and data/browser tests; CI and visual review pending. |

## Proposed inline terminology and comparison studio (November 26)

| Feature | Status | Evidence |
|---|---|---|
| Contextual terminology | In development | Existing Linked prose renderer uses curated exact terms and explicit acronym metadata; all distinct meanings retained. |
| Equation X-Ray | In development | On-demand selection from declared notation and selected specification/control acronyms. |
| Advanced comparison | In development | Lazy route /compare; custom 2–4 selections, seven families, four views, three shared experiments. |
| Release verification | In development | Tests and mobile checks added, CI and actual visual review pending. |
