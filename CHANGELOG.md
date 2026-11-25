# Changelog

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
