# Implementation status

The single registry of what exists. Statuses: **Planned** → **In development** → **Implemented** (code merged) → **Tested** (automated tests and a browser run passed) → **Verified** (a named human reviewed it). **Blocked** means it can't proceed without something outside the repo. Nothing here is Verified yet: no human expert review has happened.

Last updated 2026-11-25, branch `v3/foundation`. The V3 register is `docs/V3-EXECUTION-PLAN.md`.

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
| Wikipedia + AI quick preview near the top of every topic | Implemented | Mocked-API browser run. Live services can't be reached from the build sandbox |
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
| V3: PR check workflow | Implemented | `.github/workflows/ci.yml`; first run happens on the batch-1 pull request |
| Wide-screen layout (content beside the sidebar) | Tested | Route audit at 1366 and 1800 px |
| V2 ↔ V1 switch (same page where V1 has it) | Tested | Link-mapping test. V1 address defaults to the URL in the master prompt; set `VITE_V1_URL` if V1 lives elsewhere |
| Independent deployment of this repository | Implemented | GitHub Pages workflow (`.github/workflows/deploy.yml`) runs tests + build on every push to `main` → https://zubayer.github.io/ie-launchpads/. Goes live once this branch is merged. A Vercel project remains optional |

## Proposed V3 learning-quality contribution

| Feature | Status | Evidence / notes |
|---|---|---|
| Compound-unit grading and bounded Do Next plans | In development | Regression tests added; PR CI and browser checks pending. See `docs/CHATGPT-LEARNING-QUALITY.md`. |

## Known limitations

- Review statuses on Lean/Quality lessons are AI-assisted; treat `source-checked` as "a source was matched", not expert review.
- Units are not yet a structured field on formulas; the library shows only what the lessons state.
- Progress is saved per browser and separately for V1 and V2.
- The main bundle is ~1.2 MB (417 kB gzipped) because all concept content loads up front; see backlog item P1-4.
