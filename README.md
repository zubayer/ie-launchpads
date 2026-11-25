# IE Launchpad V2

**Learn industrial engineering the way the job uses it** — from coursework to interview to offer.

Independent V2 repository. Original (read-only baseline): https://github.com/zubayer/ie-launchpad at commit `fe77484d02da34bd40694cddd67f1bb72588dff6`. A separate production deployment is not yet configured.

IE Launchpad is a free, offline-friendly learning platform for industrial engineering students and early-career engineers. Every concept is taught in layers you can stop at any point:

> Keyword → plain meaning → analogy → why it matters → the math → step-by-step worked example → on-the-job use → quick check → interview answer → teach it back


## New in this branch (`v2/learning-engine`)

- **Learning modes** on every topic: Quick learn, Absolute beginner, Visual, Math deep dive, On the job, Interview prep, Revision, Research, Zero to mastery.
- **Quick preview**: Wikipedia summary (with revision permalink) and a labelled free-AI explanation near the top of each topic.
- **Formula library** (`#/formulas`) and **error notebook** (`#/notebook`).
- **V2 ↔ V1 switch**: set `VITE_V1_URL` at build time if V1 is hosted somewhere other than the default.
- `npm run audit`: offline browser + axe WCAG 2.2 AA run over every route and simulator (needs a running `vite preview` on port 4174 and Chrome; set `CHROME_PATH`).

Status: [`docs/IMPLEMENTATION-STATUS.md`](docs/IMPLEMENTATION-STATUS.md) · Backlog: [`docs/FEATURE-BACKLOG.md`](docs/FEATURE-BACKLOG.md) · [`CHANGELOG.md`](CHANGELOG.md)

## What's inside

| | |
|---|---|
| **494 concepts** across **22 domains** | Statistics · Quality/SPC/Six Sigma · DOE · Operations Research (Gurobi, PuLP, OR-Tools) · Simulation · Data Science & ML · Manufacturing · Lean · Semiconductor & wafer fab · CAD/CAM/PLC · Systems Engineering · System Safety (FMEA, FTA, bow-tie, HAZOP, LOPA) · Reliability · Project Management · Supply Chain · Engineering Economics · Work Measurement · Ergonomics · Facilities · Service/Healthcare/Data Centers · Sustainability · Career |
| **28 interactive simulators** | Control charts, capability, 2³ DOE, hypothesis power, regression, CLT, LP/MILP solver with Gurobi & PuLP code, graphical LP, M/M/c queueing, EOQ/ROP/newsvendor, line balancing, OEE, FMEA, fault tree, bow-tie, risk matrix, reliability/Weibull, CPM/PERT/EVM, PLC ladder logic, k-NN/k-means, forecasting, wafer process flow, die yield, NPV/IRR, NIOSH lifting, time study, bullwhip game, Monte Carlo |
| **15 role paths** | Industrial, Manufacturing, Semiconductor Process, Quality, CI/Lean, Operations, Production Planning, Reliability, Systems/Safety, Supply Chain, OR Analyst, Data Analyst, Project, Logistics, Human Factors — each with concepts in learning order, tools, KPIs, interview questions and a portfolio project |
| **Interview center** | Question bank, timed mock interview, STAR story builder with theme coverage, 8 case interviews, job-posting decoder with readiness score, resume bullet builder |
| **Live from the web** | Every topic page fetches, the moment it opens: the Wikipedia summary with lead image and a permalink to the exact revision, a free AI explanation (labeled AI-generated), related Wikipedia articles, practitioner Q&A from Stack Exchange, and key + recent research from OpenAlex — plus one-click Google, Google AI Mode, Perplexity, ChatGPT and Claude |
| **Hover cards** | Dotted words open a concept card, dashed words (pioneers, companies, standards, tools) link to Wikipedia; the popup stays open while you move into it and shows the live Wikipedia summary + permalink |
| **Jobs that need it** | Every topic lists the role paths where it is a core step and the job-board titles that ask for it, with Indeed, LinkedIn and Google Jobs searches for the titles and for postings that mention the skill |
| **Learning engine** | SM-2 spaced repetition, interleaved retrieval quizzes, prediction prompts, faded worked examples, teach-back with key-word check, mastery tracking, daily plan, knowledge map, focus timer |

Every numeric worked example is **machine-checked** by `npm test`, so the arithmetic on the cards is verified, not hand-typed. Facts that vary by company or change over time are flagged “verify”.

## Run it locally

```bash
npm ci
npm run dev      # http://localhost:5173
npm test         # content integrity + example arithmetic + simulator math
npm run build    # production build to dist/
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

## V2 foundation

- Engineering Academy: curated source discovery, software learning paths, engineering missions with downloadable sample data, and a factory bottleneck lab.
- Independent browser progress key and configurable default 90-day plan.
- Source metadata schema (optional until lessons are individually reviewed).
- Stronger finite-number validation in example tests.
- Existing course content and simulators retained.

See [V2 roadmap](docs/V2-ROADMAP.md) for future work and acceptance criteria.

## Deploy settings

Use a NEW Vercel project connected only to this repository (Vite, build: npm run build, output: dist). The original site must remain untouched. Run npm ci, npm test and npm run build before publishing. The original Pages deployment workflow was deliberately excluded.
