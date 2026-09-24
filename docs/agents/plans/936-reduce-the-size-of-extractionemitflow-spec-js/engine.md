# Engine Plan: Reduce the size of ExtractionEmitFlow_spec.js

Main plan: [plan.md](plan.md)

## Overview
`source/spec/lib/jobs/ExtractionEmitFlow_spec.js` (422 lines) holds two independent end-to-end suites that repeat the same setup and rely on file-local helpers. Extract the shared pieces into a support util, then split the file in two.

## Context
- Suite 1 — `ExtractionJob → EmitEnqueuer → EmitJob (end-to-end)` (lines 49–233): Loot Studios json_path, regex standalone, disabled emit, only-actions.
- Suite 2 — `paginated_actions + parser/emit interaction (end-to-end)` (lines 235–422): Scenario A (paginated target carries parser + emit) and Scenario B (origin carries parser + emit alongside paginated_actions).
- Duplicated across both: `LoggerUtils.stubLoggerMethods()` + `logContext` spy object, `JobRegistry.build({ cooldown: -1 })`, `new ParserRegistry({ json_path, regex })`, the `lootstudios`/`majora_api` `ClientFactory` pair, and `JobRegistry.reset()` / `JobFactory.reset()` teardown.
- File-local helpers used by both: `enqueued`, `hasEnqueued`, `performAll`, `expectEmitted`.

## Steps

- [01 — Add EndToEndFlowUtils support util](engine/01-add-end-to-end-flow-utils.md)
- [02 — Move the paginated suite to PaginatedExtractionEmitFlow_spec.js](engine/02-split-paginated-suite.md)
- [03 — Slim down ExtractionEmitFlow_spec.js](engine/03-slim-extraction-emit-flow-spec.md)

## Files to Change
- `source/spec/support/utils/EndToEndFlowUtils.js` — new shared util
- `source/spec/lib/jobs/PaginatedExtractionEmitFlow_spec.js` — new spec (suite 2)
- `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` — keeps suite 1 only, uses the util

## CI Checks
- `source`: `yarn spec` and `yarn lint` (CI job: the `source` test and `lint-and-report` jobs in `.circleci/config.yml`)
- Spec size check: every touched spec file must be under 300 lines.

## Notes
- Pure refactor: every `it` must survive with the same assertions; count `it` blocks before and after (6 total: 4 in suite 1, 2 in suite 2).
- Keep the JSDoc block comments above each top-level `describe` — they document which flow/issue each suite covers.
- File names and the util's exact API are suggestions; keep whatever reads cleanly, as long as the size and coverage goals are met.
