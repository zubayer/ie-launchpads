# Feature backlog

Prioritized from the V2 master prompt (section numbers in brackets) and the 2026-11-24 audit. **Superseded for planning by `docs/V3-EXECUTION-PLAN.md`**, which maps these items to V3 feature IDs; this list is kept for history.

## P1 — next session

1. **Fill lesson gaps where learners feel them most** [§9]: only 13% of topics have "why it matters", 2% a real case, 4% common mistakes, 15% interview questions, 24% a worked example. Extend the Lean/Quality enrichment pattern (`src/content/lessons/*.ts`, cited, honest review status) to Stats, DOE, OR, Supply Chain, Safety.
2. **A visual for every topic** [§9.12, §36]: 212 topics have neither a diagram nor a simulator. Add `VIZ` specs domain by domain; no decorative-only animations.
3. **Structured units and assumptions on formulas** [§35, §47]: started with the Equation Explorer (9 experiments with units and bounds); formula-library symbols still need units.
4. **Performance** [§44]: split concept content by domain so a single lesson doesn't load all 494; measure LCP/INP before and after.
5. **Multidimensional mastery** [§12]: evidence by dimension and unit-aware numeric questions shipped in the Lean throughput pathway; extend to lesson pages and the practice quiz.

## P2

6. Numeric and unit-sensitive question types with step feedback [§39].
7. ~~Method-selection guide~~ shipped as `/guide`. Next: more branches (service, healthcare, sustainability) and more factory mysteries.
8. New domains with the biggest gaps: Engineering Mathematics (1/22), Cognitive Engineering/HCI (3/22), Information & Data Engineering (3/14), Leadership (3/12), Applied AI (3/13) [§5].
9. Personal notebook with concept-linked notes and Markdown/KaTeX [§33].
10. Repository-local agent skills (`math-verification`, `source-verification`, `accessibility-audit`, …) [§51].
11. Short motion-graphics explainers for ~20 most-asked topics (HyperFrames), hosted as small MP4s [§36].

## P3

12. Industry explorer pages [§18], more missions and datasets [§19–20], template library with exports [§21], portfolio studio [§22].
13. Grounded AI tutor behind a server-side function with rate limits [§25–27] — needs a hosting decision and API key held server-side.
14. Optional accounts and sync [§43].

## Blocked / owner actions

- Optional: a Vercel project connected only to `zubayer/ie-launchpads`, for per-branch preview links.
- The GitHub Pages build links the V1 switch to https://zubayer.github.io/ie-launchpad/ (`VITE_V1_URL` in the workflow).
