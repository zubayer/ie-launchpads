# Engineering Abbreviation Dictionary

## Scope
A dedicated /dictionary route indexes every topic in the current and future curriculum, with a topic overview entry, known full names from explicit metadata, authored term rows and symbols from declared lesson formula variables and Equation Explorer inputs, outputs and extras. The route is lazy-loaded. No storage schema, deployment, external request or paid service is changed.

Curated terminology and symbols are not automatically interpreted as acronyms. Ambiguous terms retain domain and lesson context (PV, RCA, OR, PM). Symbols use their formula context; units are shown when explicitly provided by Equation Explorer. Unknown symbols are not guessed. The existing terminology header and comparison library are preserved.

## Sources and review
NIST process capability section 6.1.6, NASA PP&C glossary, CDC revised NIOSH lifting equation and NTU advanced process control pages were consulted and linked for selected rows. Other authored entries are instructional drafts or existing lesson metadata, not independently source-checked. No named human expert review. The existing source registry is reused, with three additional source records. No implication that every abbreviation embedded in lesson prose is audited.

## Release gates
npm test, npm run build, npm run docs, npm run size, npm run audit. CI uploads docs/DICTIONARY-INVENTORY.md alongside the existing inventories. Review both themes, mobile and desktop rendering, search exact/partial terms, filters, empty results and links; confirm no lesson progress changes. Do not merge if checks fail. The contributor has not executed the full local browser/build suite.

## Ongoing maintenance
For every newly added lesson, index automatically via the shared content registry. Add an explicit curated row when the title uses a compound abbreviation, notation or ambiguous term. Expand the inventory by reviewing prose and formulas individually, adding missing symbol definitions with accurate context, units and source citations. Maintain stable lesson IDs. No fake acronym expansions or auto-generated source claims. The audit reports topics lacking formula variables and possible title-review candidates, not a claim that all remaining text is fully reviewed.
