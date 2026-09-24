# Issue: Reduce the size of ExtractionEmitFlow_spec.js

## Description
The spec size check reports `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` as **WARN** with 422 lines.

## Problem
- The file holds two unrelated top-level `describe`s: `ExtractionJob → EmitEnqueuer → EmitJob (end-to-end)` and `paginated_actions + parser/emit interaction (end-to-end)`.
- Both repeat the same setup: logger stubs, `JobRegistry.build({ cooldown: -1 })`, the `ParserRegistry` with json_path/regex, `JobFactory` registrations, and the `lootstudios`/`majora_api` client map.
- Module-level helpers (`enqueued`, `hasEnqueued`, `performAll`, `expectEmitted`) are local to the file.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Split into `ExtractionEmitFlow_spec.js` and `PaginatedExtractionEmitFlow_spec.js` (one per top-level `describe`).
- Extract the shared helpers and setup into a support util (e.g. `source/spec/support/utils/EndToEndFlowUtils.js`): the enqueued-job lookups, `performAll`, `expectEmitted`, parser registry/job factory registration, and the example client map.
- Reuse existing support utils where they already cover part of the setup (e.g. `JobRegistryUtils.rebuild({ cooldown })`, `LoggerUtils`) instead of duplicating them.

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
