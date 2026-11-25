# Implementation status

The single registry of what exists. Statuses: **Planned** → **In development** → **Implemented** (code merged) → **Tested** (automated tests and a browser run passed) → **Verified** (a named human reviewed it). **Blocked** means it can't proceed without something outside the repo. Nothing here is Verified yet: no human expert review has happened.

Last updated 2026-11-24, branch `v2/learning-engine`.

## Baseline (from V1, preserved)

| Feature | Status | Evidence |
|---|---|---|
| 494 concepts, 22 domains, stable ids and routes | Tested | `npm test` (unique ids, references, subs) |
| 28 simulators (+ factory bottleneck lab = 29 lab pages) | Tested | `npm run audit` loads every `/lab/:id` in light and dark |
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
| Browser + accessibility audit (`npm run audit`) | Tested | 52 routes × light/dark, offline, axe WCAG 2.2 AA rule set: 0 violations, 0 script errors |
| Saved-progress hardening (versioned persist, merge with defaults) | Tested | Audit seeds partial saved state; no crashes |
| Daily plan crash on a cleared date field | Fixed, Tested | Audit |
| Learning modes (9) changing sections, order and depth | Tested | `src/lib/learning.test.ts`; browser run of all 9 modes |
| Wikipedia + AI quick preview near the top of every topic | Implemented | Mocked-API browser run. Live services can't be reached from the build sandbox |
| Learn first / This unlocks / previous–next lesson pager | Tested | Browser run |
| Formula library `/formulas` (91 formulas, pin + print sheet) | Tested | KaTeX renders every formula and symbol (test); route audit |
| Error notebook `/notebook` (auto-logged wrong answers, recurring misses) | Tested | Store test; browser run |
| V2 ↔ V1 switch (same page where V1 has it) | Tested | Link-mapping test. V1 address defaults to the URL in the master prompt; set `VITE_V1_URL` if V1 lives elsewhere |
| Independent Vercel deployment of this repository | Blocked | Needs a Vercel project connected to `zubayer/ie-launchpads` (owner action) |

## Known limitations

- Review statuses on Lean/Quality lessons are AI-assisted; treat `source-checked` as "a source was matched", not expert review.
- Units are not yet a structured field on formulas; the library shows only what the lessons state.
- Progress is saved per browser and separately for V1 and V2.
- The main bundle is ~1.2 MB (417 kB gzipped) because all concept content loads up front; see backlog item P1-4.
