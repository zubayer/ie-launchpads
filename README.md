# IE Launchpad V2

**Learn industrial engineering the way the job uses it** — from coursework to interview to offer.

Independent V2 repository; the original V1 (https://github.com/zubayer/ie-launchpad) is a read-only reference. Live site: https://zubayer.github.io/ie-launchpads/ (GitHub Pages, deployed from `main`).

IE Launchpad is a free, offline-friendly learning platform for industrial engineering students and early-career engineers: learn it → see it → calculate it → simulate it → solve it → prove it.

Status and plans: [`docs/V3-EXECUTION-PLAN.md`](docs/V3-EXECUTION-PLAN.md) (register and next batch) · [`docs/CONTENT-COVERAGE.md`](docs/CONTENT-COVERAGE.md) (generated counts) · [`docs/IMPLEMENTATION-STATUS.md`](docs/IMPLEMENTATION-STATUS.md) · [`CHANGELOG.md`](CHANGELOG.md)

## What's inside

| | |
|---|---|
| **494 concepts** across **22 domains** | Statistics · Quality/SPC/Six Sigma · DOE · Operations Research (Gurobi, PuLP, OR-Tools) · Simulation · Data Science & ML · Manufacturing · Lean · Semiconductor & wafer fab · CAD/CAM/PLC · Systems Engineering · System Safety (FMEA, FTA, bow-tie, HAZOP, LOPA) · Reliability · Project Management · Supply Chain · Engineering Economics · Work Measurement · Ergonomics · Facilities · Service/Healthcare/Data Centers · Sustainability · Career |
| **30 interactive labs** | Control charts, capability, 2³ DOE, hypothesis power, regression, CLT, LP/MILP solver with Gurobi & PuLP code, graphical LP, M/M/c queueing, EOQ/ROP/newsvendor, Scheduling Grand Prix, line balancing, Visual factory (steady-state line model), OEE, FMEA, fault tree, bow-tie, risk matrix, reliability/Weibull, CPM/PERT/EVM, PLC ladder logic, k-NN/k-means, forecasting, wafer process flow, die yield, NPV/IRR, NIOSH lifting, time study, bullwhip game, Monte Carlo |
| **Guided pathway and Equation Explorer** | A lesson → lab → case pathway (Lean throughput) with unit-aware calculation questions, a delayed check and evidence by skill; 9 equation experiments with units, valid ranges, sensitivity charts, spreadsheet and Python equivalents |
| **Discovery tools** | Periodic Table of IE (107 methods), reaction chains, method field guide, confused pairs, factory mysteries, spot the waste, IE subway map, tool cards |
| **15 role paths** | Industrial, Manufacturing, Semiconductor Process, Quality, CI/Lean, Operations, Production Planning, Reliability, Systems/Safety, Supply Chain, OR Analyst, Data Analyst, Project, Logistics, Human Factors — each with concepts in learning order, tools, KPIs, interview questions and a portfolio project |
| **Interview center** | Question bank, timed mock interview, STAR story builder with theme coverage, 8 case interviews, job-posting decoder with readiness score, resume bullet builder |
| **Live from the web** | Every topic page fetches, the moment it opens: the Wikipedia summary with lead image and a permalink to the exact revision, a free AI explanation (labeled AI-generated), related Wikipedia articles, practitioner Q&A from Stack Exchange, and key + recent research from OpenAlex — plus one-click Google, Google AI Mode, Perplexity, ChatGPT and Claude |
| **Hover cards** | Dotted words open a concept card, dashed words (pioneers, companies, standards, tools) link to Wikipedia; the popup stays open while you move into it and shows the live Wikipedia summary + permalink |
| **Jobs that need it** | Every topic lists the role paths where it is a core step and the job-board titles that ask for it, with Indeed, LinkedIn and Google Jobs searches for the titles and for postings that mention the skill |
| **Learning engine** | Nine learning modes, SM-2 spaced repetition, interleaved retrieval quizzes, prediction prompts, worked examples, error notebook, evidence by skill, an explained “Do next” plan, daily plan, knowledge map, focus timer |

Every worked example with a number in its answer is **machine-checked** by `npm test`, and the checked value must match the number the learner sees. Facts that vary by company or change over time are flagged “verify”.

## Run it locally

```bash
npm ci
npm run dev      # http://localhost:5173
npm test         # content integrity, numeric QA, equations, pathways, recommendations
npm run build    # type-check and production build to dist/
npm run size     # initial JavaScript a first visit downloads
npm run docs     # regenerate docs/CONTENT-COVERAGE.md and docs/CURRICULUM-GAP-ANALYSIS.md
npx vite preview --port 4174 & npm run audit   # offline browser + axe WCAG 2.2 AA run (needs Chrome)
```

Progress is stored in your browser (localStorage). Export/import it from **Progress** to move between devices.

## Add or edit content

Content lives in `src/content/concepts/<domain>.ts` as typed data — no component changes needed. Each concept follows the `Concept` type in `src/types.ts`:

```ts
{
  id: 'cpk', term: 'Cpk', full: 'Process capability index', sub: 'Capability', level: 2,
  one: 'One-line plain meaning',
  def: 'Precise definition',
  analogy: 'Everyday analogy',
  formula: { tex: 'C_{pk}=\\min(...)' },
  example: { q: '...', steps: ['...'], a: '...', check: { value: 0.889, compute: () => 0.04 / 0.045, tol: 1e-4 } },
  iq: [{ q: 'Interview question', a: 'Model answer', type: 'technical' }],
  rel: ['cp', 'stats.normal'],   // bare ids = same domain
}
```

`npm test` fails if any id is duplicated, any reference is broken, a sub-domain is unknown, or a worked example's stated answer doesn't match its computation.

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · KaTeX · Fuse.js · Zustand · d3-force · javascript-lp-solver · Vitest. Deployed to GitHub Pages by GitHub Actions (`.github/workflows/deploy.yml`).

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml` (tests, build, GitHub Pages). Pull requests run `.github/workflows/ci.yml` (tests, build, size, browser audit). Never deploy from or change the V1 repository.
