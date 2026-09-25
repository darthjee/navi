# Issue: Reduce the size of ResourceRequestJob_spec.js

## Description
The spec size check reports `source/spec/lib/jobs/ResourceRequestJob_spec.js` as **WARN** with 313 lines.

## Problem
- `#perform` is about 225 lines. It covers success, failure, assets, parser/no-parser and namespace-aware client resolution, and each context repeats the same axios/response stubbing.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Extract the repeated stub-and-perform setup into a support util or extend `ResourceRequestJobFactory`.
- If it is still over the limit, split into `ResourceRequestJob_spec.js` (constructor, arguments, success/failure) and `ResourceRequestJobEnqueue_spec.js` (assets, parser, namespace resolution).

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file

