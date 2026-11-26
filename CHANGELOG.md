# Changelog

## Proposed — Topic Intelligence Studio foundation

- Shared seven-stage topic studio, five explanation lenses, curated citations, opt-in web discovery and five interactive pilot families (six topic IDs).
- Topic-specific numerical and Boolean models, concept-check evidence, and a new Newton–Raphson lesson.
- Crossref metadata search with timeout, cancellation and bounded cache; independent reference tests and browser-audit routes added. Full CI verification pending.

## Unreleased — branch `v3/automation-studio` (2026-11-25)

### Added
- **PLC studio** (`/studio/plc`): nine lessons from the scan cycle to sequences, troubleshooting and safety: how a PLC runs, contacts and Boolean logic, NO/NC wiring versus XIC/XIO, seal-in circuits and latches, TON/TOF/RTO timers, counters and one-shots, step sequences with watchdogs, troubleshooting online, and what standard logic must not be trusted with. Each lesson has the idea, an analogy, how it works, worked examples drawn as ladder diagrams with a step-by-step scenario table, “check your model” questions, common mistakes shown wrong-vs-fixed with both scenarios, graded practice, interview questions, a playground and sources.
- **A ladder-logic engine** (`src/lib/ladder.ts`): rungs written in Allen-Bradley’s text form (`XIC(Start) [XIC(Motor), …] XIO(Stop) OTE(Motor)`, BST/NXB/BND also accepted), run scan by scan with XIC, XIO, ONS, OTE, OTL, OTU, TON, TOF, RTO, CTU, CTD, RES, MOV, ADD, SUB and six comparisons; NO/NC field wiring and cut wires; restart with prescan rules; review warnings (double coils, OTE mixed with latches, shared timers, writes to inputs, bits nothing sets).
- **Practice graded by behaviour**: a learner’s rungs run through the task’s scenario and every expected value must match, so any correct program counts. “Find where the power stops” puzzles read the online view of a stopped machine.
- **CAD studio** (`/studio/cad`): seven lessons on sketches and degrees of freedom, design intent and equations, the feature tree, assemblies and mates, drawings and projection, simulation sanity checks, and DFM/DFA. The labs compute real answers: sketch degrees of freedom from the rank of the constraint equations (under, fully or over defined, with redundant relations flagged), assembly motion from the mates’ small-motion kinematics (hinges, slides, redundant mates), SOLIDWORKS-style equations with dependency and cycle checks, feature-tree rebuild order and dependents, orthographic views projected from a 3D part in first or third angle, cantilever stress, deflection and factor of safety, and a DFA theoretical minimum part count.
- Five new labs on lesson pages (`/lab/sketch-dof`, `/lab/mate-dof`, `/lab/ortho-views`, `/lab/beam-check`, `/lab/dfa-count`), and the PLC ladder lab rebuilt on the new engine with editable programs.
- Sixteen automation lesson pages enriched (PLC, scan cycle, ladder logic, NO/NC, seal-in, timers, counters, safety circuits, SolidWorks, parametric modelling, mates, drawings, FEA, DFM, DFA) with objectives, mistakes, applications, interview questions, sources and a review status, plus “Deep dive, hands-on” links to the studios.
- Five sources: PLCopen’s IEC 61131-3 page, Rockwell’s Logix instruction pages and ControlLogix user manual, ISO 13849-1:2023, and SOLIDWORKS Help.

### Verified
- Every example, mistake, fix, practice solution and starter in both studios is run by the tests (`src/lib/plc.test.ts`, `src/lib/cad.test.ts`); engine and kernel behaviour is tested against values worked out by hand (`src/lib/ladder.test.ts`, `src/lib/cad.test.ts`).
- Rockwell, PLCopen and ISO pages were opened and matched; SOLIDWORKS help pages render with JavaScript, so their claims were matched against the search engine’s copy and those lessons are marked source-identified.

## Unreleased — branch `v3/sql-studio` (2026-11-25)

### Added
- **SQL studio** (`/studio/sql`): ten lessons from your first SELECT to window functions, data-quality checks and indexes. Each has the idea in plain words, an analogy, how it works, the syntax, worked queries with their real result tables, common mistakes shown wrong-vs-fixed with both results, graded practice, interview questions and notes on other databases.
- **SQL playground** (`/lab/sql`, and on every SQL lesson page): SQLite running in the browser on a synthetic plant database (machines, work orders, production runs, defects, downtime) with a schema panel, error hints, a 4-second stop for runaway queries, and a reset.
- Eight new lesson pages: GROUP BY and HAVING, joins, NULL, subqueries and CTEs, window functions, data-quality checks, indexes and query plans, relational data modeling. The SQL lesson itself is rewritten with objectives, mistakes, an application and three interview questions.
- Practice answers are graded by comparing result sets (column names and, unless asked, row order don’t matter) and saved as evidence.

### Verified
- The test suite runs every query in the course on the practice database and compares it with the result shown on the page; key tables are recomputed in plain JavaScript as an independent check.

## Proposed — V3 learning quality contribution

- Preserve engineering rate units in numeric grading; add scientific notation and dimensional regression checks.
- Keep Do Next estimated activities within the selected budget, with quick learning alternatives and shareable per-lesson mode links.
- Verification pending PR CI; see `docs/CHATGPT-LEARNING-QUALITY.md`.

## Unreleased — branch `v3/foundation` (2026-11-25)

### Added
- **Guided pathways** (`/paths`), starting with **Lean throughput** (`/paths/lean-throughput`): takt → bottleneck once downtime is counted → OEE → Little’s Law → Visual factory → factory mystery → delayed check. Calculation questions get new numbers on each try, accept answers with units (“1.5 min” = “90 s”), name known mistakes (“that uses the whole shift”), and save evidence by skill (recall, explain, calculate, apply). Mastery needs correct answers on two different days.
- **Equation Explorer** (`/formulas/:id`): takt, Little’s Law, OEE from shift data, Cpk, EOQ, NPV, Newton–Raphson for IRR, M/M/1 queue, two-point sensor scaling. Inputs with units and ranges, a units check, clear messages for invalid inputs, a sensitivity chart (also as a table), a predict-first question, and the same formula in a spreadsheet and in Python. Linked from the formula library and the lessons.
- **Do next** on Today: a short plan for 5, 15, 30 or 60 minutes, ranked by fixed rules (due reviews, repeated mistakes, a started pathway, your role path with prerequisites first, a lab), each with the reason. “Not now” skips an item without penalty.
- Factory mysteries save the case result as evidence.
- `docs/V3-EXECUTION-PLAN.md` (register), `docs/CONTENT-COVERAGE.md` (generated), `npm run docs`, `npm run size`, and a pull-request check workflow (tests, build, size, browser audit).

### Changed
- Saved progress moves to version 2 (adds answer history). Older saves migrate automatically and keep progress, cards and mistakes.
- Eight worked examples now machine-check the number they show (for example the newsvendor answer 542 units, not only its critical ratio).
- The formula library and its result grids no longer overflow on 360 px screens.
- Equation Explorer refuses physically impossible inputs (negative demand, zero holding cost, fractional parts) with a clear message, while keeping signed values such as temperatures and spec limits; a cleared field stays empty while you type.
- README counts and deployment notes brought up to date.

## Unreleased — branch `v2/discovery` (2026-11-25)

### Added
- **Method field guide** (`/guide`): answer a few questions about the problem and get the method, the data it needs and the software people use, with links to the lesson and lab.
- **Confused pairs** (`/pairs`): 17 pairs interviewers mix up (Cp/Cpk, takt/cycle, NPV/IRR, FMEA/FTA, EOQ/ROP, …). Study side by side or drill 34 scenarios.
- **Factory mysteries** (`/mysteries`): three short plant cases (scrap spike, bottleneck hidden by downtime, more stock with more stockouts). Clues unlock as you make decisions; each call is explained.
- **Visual factory** lab (`/lab/factory`): build a serial line and see takt, the true bottleneck, rolled throughput yield, good output, needed availability and Little's-law lead time.
- **IE subway map** (`/subway`): role paths as subway lines; shared topics are interchanges; stations fill in as you learn.
- **Tool cards** (`/tools`): 20 tools with cost, learning curve (our estimate), best use, roles and lessons; compare up to three.
- **Spot the waste** (`/spot-waste`): find one example of each of the eight wastes in an illustrated cell.
- Wrong answers in Confused pairs, Factory mysteries and Spot the waste go to the error notebook.

### Changed
- The sidebar is grouped into Learn, Practice, Labs and tools, Career and You.
- Theory of Constraints and capacity planning now point to the Visual factory lab.

## Unreleased — branch `v2/periodic-table` (2026-11-25)

### Added
- **Periodic Table of Industrial Engineering** (`/table`): 107 core methods in 10 families, Foundation → Advanced. Family filter, search, deep links (`?el=`), printable poster. Picking an element shows its formula, worked numbers, traps, connections, lesson and lab; six elements (takt, Cpk, FMEA, EOQ, NPV, OEE) also show what goes in and what comes out.
- **Reaction chains** (`/chains`): DMAIC project, Lean flow, Safety case and Inventory policy as step-through chains with what each step hands on and a one-paragraph interview answer.
- **Scheduling Grand Prix** lab (`/lab/scheduling`): editable jobs, FCFS vs SPT vs EDD, predict first, scoreboard. Tests check the SPT and EDD theorems on 500 random job sets.
- **Engineering Economics cheat sheet** (`/sheets/engecon`): each formula by hand, in Excel and in Python, with a worked example, key rules and traps; prints on one page. Its numbers are recomputed in tests.

### Changed
- Pages use the full width on wide screens, left-aligned beside the sidebar.

## Unreleased — branch `v2/learning-engine` (2026-11-24)

### Added
- Learning modes on every topic (Zero to mastery, Quick learn, Absolute beginner, Visual, Math deep dive, On the job, Interview prep, Revision, Research). Each changes the sections shown, their order and how much text appears.
- Quick preview near the top of every topic: Wikipedia summary with a revision permalink, and a labelled free-AI explanation.
- Lesson sequence navigation: "Learn first", "This unlocks", previous/next within the domain.
- Formula library (`/formulas`) with search, domain filter and a printable pinned sheet.
- Error notebook (`/notebook`): wrong answers are saved automatically; recurring misses are listed first.
- V2 ↔ V1 switch in the sidebar and mobile header.
- `npm run audit`: offline browser run of every route and simulator in light and dark mode with axe-core WCAG 2.2 AA rules.
- Docs: `IMPLEMENTATION-STATUS.md`, `FEATURE-BACKLOG.md`, this changelog.

### Fixed
- Daily plan crashed when a date field was cleared.
- Partial or damaged saved progress could crash pages; saved state is now versioned and merged with defaults.
- Accessibility: contrast on the fault-tree gate toggle and the orange token; keyboard access to scrollable code and wide formulas; dark-mode contrast on the version switch.

### Changed
- Teach-it-back is no longer a section on every topic (removed on request).

## 2026-11-24 — earlier V2 commits on `main`
- `3f783db` Engineering Academy, missions, source library, validation foundations.
- `bbf8def` Curriculum blueprint, `/curriculum` coverage matrix, generated gap analysis.
- `2f59a05` Source registry, review statuses, enriched Lean and Quality lessons.
