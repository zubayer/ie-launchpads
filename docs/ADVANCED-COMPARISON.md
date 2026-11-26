# Inline Terminology and Advanced Comparison Studio

Implements the approved design direction while retaining current layout, Confused Pairs and all existing lesson IDs and modes. Based on b9334a7 (merged dictionary PR #16). No production changes or storage schema changes.

## Scope
Known acronyms and selected index names in the existing Linked renderer have local offline previews. Local lesson meaning comes first, then domain, then other distinct meanings. Exact-case matching avoids guessing arbitrary words. Existing ordinary concept and Wikipedia hover links remain. Click/tap pins the dictionary preview; Escape and Close dismiss. The original renderer's per-paragraph highlight limit is retained. Equation X-Ray is a separate symbol selector below formulas, not a modification of KaTeX DOM. Missing symbol definitions are honestly reported.

Advanced /compare: searchable selection from the complete curriculum, shareable URL, up to four unique lesson IDs, overview/equations/applications/interview focus, existing pair distinctions and seven curated families. Pp/Ppk share one lesson. Three supported families have adjustable educational models, not fabricated common simulations for unrelated topics. Numerical assumptions and examples are labeled. No new mastery evidence is recorded.

NIST and Minitab capability documentation and LEI takt reference support the respective models; other family contrasts are instructional drafts. Existing OpenStax reference supports NPV. No human expert review. Remaining visual prototypes (pronunciation, vocabulary saving, individual symbol clicks inside typeset formula, mini visual inside each preview, universal lab and full snapshot layout) are not implemented in this batch.

## Release gates
Run npm test, npm run build, npm run docs, npm run size and npm run audit. Review actual desktop and mobile pages, keyboard focus, contrast, overflow and all three numerical models. The contributor has not run the complete suite locally; keep draft until CI and visual review are successful. Coordinate with open content-split PR #15; avoid merging stale code or rolling back another contributor's work.
