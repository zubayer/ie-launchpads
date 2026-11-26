# Universal Topic Intelligence Studio — phase 1

## Implemented in this branch (verification pending)
- Shared seven-stage studio in the existing keyword section; all existing modes, section IDs, routes and persistence remain.
- Five pilot families: takt time, ladder logic, Newton–Raphson, NPV and capability (Cp and Cpk share one family). New topic or.newton-raphson uses the existing OR domain's Solvers & software subsection. Existing IRR topic is retained.
- Authored five-lens explanations, mental models, inputs and outputs, illustrative examples, comparisons, limitations and one concept check per pilot. Concept checks write existing explanation evidence and wrong answers use the existing mistake notebook.
- Original accessible SVG experiments with adjustable inputs or iteration controls and textual output; no new dependencies.
- Topic-specific reference cards use the existing source registry. The following sections were opened and matched to the pilot explanations on 2026-11-25: LEI Takt Time, Rockwell Micro800 Common instructions, OpenStax Calculus 4.9, OpenStax Principles of Finance 16.2, NIST handbook 6.1.6. These are AI-assisted source checks, not human expert review.
- Domain discovery links are explicitly not claim-level references. Crossref metadata search is opt-in and sends only public topic titles. It validates shape and DOI, aborts on navigation, times out after 8 seconds, caches bounded results for one hour; repeated clicks while pending are blocked. The older web adapters still need shared cache/timeout improvements.
- Existing Wikipedia and live web panels are opt-in; AI requests require a separate click and no automatic retry.
- Added independent numerical/Boolean reference tests; added pilot routes to browser audit. Added inventory generator; CI produces a downloadable artifact.

## Remaining backlog (not shipped)
| ID | Scope | Acceptance |
| --- | --- | --- |
| TS-02 | Rich visual atlas: hotspots, flow, timelines, Sankey, heatmaps, licensed images, selected 3D | Tested accessible interaction, provenance and meaningful description |
| TS-03 | Complete mathematical workbench, reverse solving and intermediate grading | Reference cases, unit checks, linked Excel/Python workflows |
| TS-04 | Multi-provider discovery with Wikimedia, OpenAlex, official courses, standards, videos and datasets | Opt-in, validation, licenses, quotas, caching, cancellation, deduplication and fallback |
| TS-05 | Contextual tutor | Approved secure server, grounded citations, explicit consent; no keys or paid calls in frontend |
| TS-06 | More microlearning (sequencing, comics, prediction, error spotting, equations) | Real exercises, evidence and mistake integration, keyboard alternatives |
| TS-07 | Professional applications and dataset workbench | Clearly labeled synthetic data and documented real cases |
| TS-08 | Curriculum enrichment | Topic inventory-driven batches, complete explanations, original visuals, source verification and independent math checks |
| TS-09 | UX and performance | Focus view, shareable studio stages, measured mobile/desktop performance, domain code splitting and enforced budgets |
| TS-10 | Full production validation | Passing CI, actual browser interactions, live provider smoke tests and review before merge |

## Commands / handoff
Run npm test, npm run build, npm run docs, npm run size, npm run audit (with preview server) and manually exercise all seven stages and five labs in both themes and on mobile. Inspect the topic-intelligence-inventory CI artifact. Verify external provider behavior separately because the existing browser audit blocks outbound requests. Do not merge if checks fail. This branch is based on the passing hotfix #8; merge that hotfix first, reconcile other changes, then revalidate this PR. No production changes or paid services authorized.

## Integration checkpoint — November 26
Reconciled against main d30d077 (PR #13). Preserve OR_V3, existing source records and audit routes, InterviewCard, TeachBackCard, nine modes and saved progress. Studio is expanded by default in full mode and collapsed in other modes. Its Master section links to the existing teach-back and interview activities when present. CI generates both topic and career inventories. Corrected IIS terminology. Generated coverage and gap reports from the old branch are deliberately not carried over; regenerate from current combined content. Full tests and rendered visual review remain release gates.
