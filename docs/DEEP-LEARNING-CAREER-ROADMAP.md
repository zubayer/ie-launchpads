# Deep Learning and Career Intelligence

First independent content batch on main a4d7e79. The separate Topic Intelligence Studio PR #9 is not a dependency. Existing content rendering, concept IDs, simulations, storage and deployment remain unchanged.

## This batch
- stats.std-dev
- stats.confidence-interval
- stats.p-value
- stats.regression
- doe.randomization
- doe.interaction
- reliability.availability
- reliability.weibull
- scm.reorder-point
- scm.bullwhip
- engecon.break-even
- engecon.replacement
- work.standard-time
- ergo.fitts
- service.pue
- service.capacity-utilization

Each topic receives two original, realistic interview practice questions (technical and/or case), a practical illustrative scenario, learning objectives, limitations and clearer reasoning. Existing interview questions retained except misleading wording corrected where needed. New examples are instructional simulations, not verified employer questions or actual company events. New visual specs for replacement and capacity utilization. NIST sections checked for six topics; OpenStax, DOE and Penn State reference pages opened for three additional topics. Citations support the specified claims only; other content is instructional draft until direct-source review. No human expert review claimed.

## Full curriculum workflow
Run npm run docs to generate docs/CAREER-DEPTH-INVENTORY.md, which scans every topic. Use this together with the content coverage report. Select topics by missing fields and career relevance, then enrich each individually. No automatic filler.

Required where applicable: 30-second meaning, concrete everyday analogy and limits, prerequisite and downstream links, industrial use, equation variables/units/assumptions, numerical worked example with independent check, original diagram, decision process, mistakes, two or more interview questions and answers including a realistic case, software workflow, relevant authoritative citation. Nonmathematical topics must not be forced to invent equations.

Next batches: Operations Research, Manufacturing Systems, Data Science, Systems/Safety, Semiconductor and remaining domains. Add scenario variants, interview answer rubrics, teach-back, equation/diagram connections, role lenses and job-description skill mapping in coordination with PR #9. Label questions as practice unless their origin is verified; never attribute them to a company without evidence.

## Integration checkpoints
After each batch, run tests, build, docs generation and browser audit. Inspect actual pages in mobile/tablet/desktop and both themes, including equations, diagram text, interview expand/collapse and accessibility. Protect modes, links, concept IDs, learner data, existing labs and deployment. Do not merge failed checks. Local full tests were not run by the contributor; CI and visual review pending.
