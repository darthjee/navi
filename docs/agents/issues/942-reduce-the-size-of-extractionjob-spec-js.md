# Issue: Reduce the size of ExtractionJob_spec.js

## Description
The spec size check reports `source/spec/lib/jobs/ExtractionJob_spec.js` as **WARN** with 312 lines.

## Problem
- The `emission tracking` and `extraction tracking` blocks (lines ~206–312, about 105 lines) are registry-oriented and follow the same "when the registry has been built / has not been built" structure as the `EmitJob` spec.
- Those blocks depend on the file-local setup (`buildJob`, `performWith`, `performIgnoringFailure`, `expectEmitEnqueued` and the top-level `beforeEach` building `logContext`, `parser`, `parserImpl`, `parserRegistry`, `jobRegistry`), so the split cannot happen without sharing that setup.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Move `emission tracking` and `extraction tracking` into `source/spec/lib/jobs/ExtractionJobTracking_spec.js`.
- Extract the shared setup into `source/spec/support/utils/ExtractionJobSpecUtils.js`, following the precedent of `EmitJobSpecUtils.js` and `ApiEngineStartHandlerSpecUtils.js` (a `setup()` called inside the top-level `describe`, returning a context object refreshed on every `beforeEach`). Move job-building defaults into `ExtractionJobFactory` if that's cleaner.

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
