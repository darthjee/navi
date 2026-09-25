# Issue: Reduce the size of ApiEngineStartHandler_spec.js

## Description
The spec size check reports `source/spec/lib/server/handlers/api/ApiEngineStartHandler_spec.js` as **WARN** with 314 lines.

## Problem
- `#process` repeats the same `targets` scenarios (omitted, given, carrying parameters) for the stopped and running states, differing mainly in which `Application` entry point is expected (`start()` vs `enqueueResources()`).
- The `and targets carries parameters` block under "running" is about 100 lines.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Extract the targets scenarios into shared examples (a support util, like `JobLifecycleExamples`), parametrized by engine state and the expected `Application` call, and run them in both engine states.
- Alternatively, move the parameters scenarios into `ApiEngineStartHandlerParameters_spec.js`.

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
