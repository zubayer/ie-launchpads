# Working on IE Launchpad V2

Instructions for coding agents and contributors. The product spec is the V3 master specification; the living register is `docs/V3-EXECUTION-PLAN.md` (start there), status detail in `docs/IMPLEMENTATION-STATUS.md`, generated counts in `docs/CONTENT-COVERAGE.md`.

## Repository protection

- Work only in `zubayer/ie-launchpads`. The original `zubayer/ie-launchpad` repository and its deployments are read-only references: never push, open PRs, or change hosting, DNS or settings there.
- Deploy only from this repository: GitHub Pages via `.github/workflows/deploy.yml` on pushes to `main` (https://zubayer.github.io/ie-launchpads/), or a Vercel project connected only to this repository.

## Commands

| Task | Command |
|---|---|
| Install | `npm ci` |
| Dev server | `npm run dev` |
| Type-check + build | `npm run build` |
| Tests (content integrity, math checks, sources) | `npm test` |
| Regenerate the coverage dashboard and gap analysis | `npm run docs` (or `docs:coverage`, `docs:gaps`) |
| Initial JavaScript size | `npm run size` (after a build) |
| Browser + accessibility audit (offline, light/dark, axe WCAG 2.2 AA) | `npx vite preview --port 4174 &` then `npm run audit` |

A change is done only when `npm test`, `npm run build` and `npm run audit` pass and the affected pages were opened in a browser. Record what shipped in `docs/IMPLEMENTATION-STATUS.md` and `CHANGELOG.md`.

## Content rules

- Concepts are typed data in `src/content/concepts/<domain>.ts`. Keep existing ids and routes stable; tests fail on broken references.
- Every numeric worked example needs `example.check.compute()` so the test suite recomputes the answer, and the checked value must appear in the displayed answer; when the answer shows a rounded or converted number, declare it with `check.shown`.
- Equation Explorer experiments (`src/content/equations.ts`) and pathway questions (`src/content/pathways.ts`) need independent reference cases or recomputation tests, not a re-run of their own function.
- SQL course queries (`src/content/sql/course.ts`) must run on the practice database; after changing a query or the data, run `npm run docs` to regenerate `src/content/sql/results.ts`, and check that every number in the prose still matches (the tests enforce takeaways).
- PLC course programs (`src/content/plc/course.ts`) run on the ladder engine in tests: examples must pass their scenario exactly, each mistake’s wrong program must fail and its fix pass, practice solutions must pass and starters fail. CAD presets (`src/content/cad/course.ts`) must satisfy their relations on the drawn geometry, and every task’s model answer must pass its grader (`src/lib/plc.test.ts`, `src/lib/cad.test.ts`).
- Learner evidence goes through `recordAttempt` with a dimension; opening a page is not evidence. Bump the persist version and add a migration when the saved shape changes.
- Sources live once in `src/content/sources.ts` and are referenced by id from lessons, with the section that supports the claim.
- Review status (`review.status`) must reflect what actually happened. Use `source-checked` only after the cited section was opened and matched the claim, `math-validated` only when a test recomputes the numbers, and `expert-reviewed` only with a named human reviewer. Never upgrade a status without that evidence.
- Scenarios that are not documented real events are labeled illustrative. Datasets are labeled synthetic.
- Do not invent citations, standards, authors, dates or statistics. If a fact can't be sourced, leave it out or mark the lesson `verify`.

## Product rules

- No placeholder buttons, fake progress, fake AI output or simulations without a real model.
- Core lessons must work offline; live web panels (Wikipedia, OpenAlex, Stack Exchange, AI) are supplemental and must fail gracefully.
- No API keys in frontend code. Any AI or server feature goes behind a server-side function.
- Target WCAG 2.2 AA: labelled controls, visible focus, keyboard access, reduced-motion support.
