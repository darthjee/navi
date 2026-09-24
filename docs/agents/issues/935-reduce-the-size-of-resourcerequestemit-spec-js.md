# Issue: Reduce the size of ResourceRequestEmit_spec.js

## Description
The spec size check reports `source/spec/lib/models/request/resource_request/ResourceRequestEmit_spec.js` as **WARN** with 457 lines.

## Problem
- The `constructor` block is about 235 lines. Most of it is repeated validation cases (`retries`, `cooldown`, `headers`, `body_template`), each with the pattern "when not given / valid / 0 / negative / non-numeric". `retries` and `cooldown` are almost identical.
- `#disabled` (~80 lines) and `#resolveBody` (~125 lines) add about 200 more lines.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `ResourceRequestSpecUtils`, `EmitJobSpecUtils`, `AxiosUtils`, `LoggerUtils`, ...).

## Solution
- Drive the repeated constructor validation cases from example tables (a list of `{ value, expected | error }` iterated with `describe`/`it`), shared between `retries` and `cooldown`.
- If it is still over the limit, split `#resolveBody` into its own file, following the naming used by the sibling splits (#932, #933), e.g. `ResourceRequestEmit_resolveBody_spec.js` next to the original.

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
