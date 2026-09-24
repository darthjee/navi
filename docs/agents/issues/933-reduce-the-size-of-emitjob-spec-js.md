# Issue: Reduce the size of EmitJob_spec.js

## Description
The spec size check reports `source/spec/lib/jobs/EmitJob_spec.js` as **ERROR** with 588 lines (the ESLint `max-lines` limit in `source/` is 300).

## Problem
- The file mixes `#constructor`/`#arguments`, `#perform` (about 200 lines), emission tracking (about 170 lines), `#maxRetries` and `#cooldown`.
- Local helpers (`rebuildJob`, `performIgnoringFailure`, `firstRecord`, `itForwardsToClientEmit`) are defined inside the spec, so the file can't be split without duplicating them.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Move `rebuildJob`, `performIgnoringFailure`, `firstRecord` and `itForwardsToClientEmit` (plus the shared constants such as `baseUrl`, `item`, `expectedRequestOptions` if needed) into a support util (e.g. `source/spec/support/utils/EmitJobUtils.js`) or extend `EmitJobFactory`.
- Split into, for example:
  - `EmitJob_spec.js`: `#constructor`, `#arguments`, `#perform`
  - `EmitJobEmissionTracking_spec.js`: the `emission tracking` block
  - `EmitJobRetry_spec.js`: `#maxRetries` and `#cooldown`
- Where the `#cooldown` Retry-After cases are table-like, drive them from a list of examples.
- Follow the same approach used for #932 (`ResourceRequest_spec.js`).

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
