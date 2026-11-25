# V3 contribution: dimensional grading and time-bounded learning

Branch: chatgpt/v3-learning-quality. Based on main at 0e9eb0a. No deployment or V1 changes.

## Scope
- EDU-03: Engineering answer grading preserves rate dimensions, including time per unit, units per hour, currency per unit. Scientific notation with signed exponents and explicit signs works; malformed grouping and nonfinite numbers are rejected. Pure numbers reject unexpected units. Takt and effective cycle-time questions explicitly retain seconds shorthand. This is a limited unit vocabulary, not a full dimensional-analysis or offset-temperature engine.
- UX-03 / AI-01: Do Next schedules within the selected estimated minute budget, adds a short review or quick lesson fallback, and displays the allocated estimate. A quick-mode deep link does not overwrite the learner's stored global mode. Actual completion time varies.

## Acceptance and verification
- Regression assertions cover rate conversion, wrong dimensions, malformed inputs, unitless answers, unsupported units and 5/15/30/60 minute budgets.
- The quick-mode deep link is included in the existing browser audit.
- Run npm test, npm run build, npm run audit and manually try the five-minute session, quick-mode link and learning-mode switch before marking this batch tested.
- No full application test run was performed by the contributor before opening the PR. CI results must be reviewed before merging.

## Handoff
Continue the PLC pathway and the remaining V3 execution plan on separate branches. Reconcile any overlapping changes before merging. Do not change existing concept IDs, routes, storage schema or hosting.
