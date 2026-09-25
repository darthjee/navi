# Issue: Reduce the size of Client_spec.js

## Description
The spec size check reports `source/spec/lib/client/Client_spec.js` as **WARN** with 398 lines.

## Problem
- The file covers request behavior (status matching, 5xx, timeout, headers, url parameters, redirects), `#emit` (about 120 lines) and the `.fromObject`/`.fromListObject` builders (about 80 lines).
- Several status/redirect scenarios repeat the same stub-and-assert shape.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ClientFactory`, `ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Split into, for example:
  - `Client_spec.js`: request behavior
  - `Client_emit_spec.js`: `#emit`
  - `Client_builders_spec.js`: `.fromObject` and `.fromListObject`
- Drive the repeated status/redirect scenarios from example tables where possible.
- Reuse the existing `ClientFactory` / `AxiosUtils` where they fit, instead of adding new local setup.

The split and file names above are suggestions, following the `<Subject>_<topic>_spec.js` naming used by the recent splits (e.g. `EngineController_lifecycle_spec.js`). The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
