# Issue: Reduce the size of ResourceRequestPaginatedAction_spec.js

## Description
The spec size check reports `source/spec/lib/models/request/resource_request/ResourceRequestPaginatedAction_spec.js` as **WARN** with 383 lines.

## Problem
- `#execute` is about 325 lines and includes the `parameters` block (about 100 lines) and the `namespace resolution` block (about 60 lines).
- The setup for resources, registries and `Application` is repeated across those blocks.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Split `#execute` following the `<Class>_<topic>_spec.js` naming already used by sibling splits (`ResourceRequest_url_spec.js`, `ResourceRequestEmit_resolveBody_spec.js`, `Client_emit_spec.js`), for example:
  - `ResourceRequestPaginatedAction_spec.js` — constructor, `.fromList`, basic `#execute`
  - `ResourceRequestPaginatedAction_parameters_spec.js` — the `parameters` block
  - `ResourceRequestPaginatedAction_namespace_spec.js` — the `namespace resolution` block
- Move the shared setup into the existing `ResourceActionUtils` (already used by this spec and `ResourceRequestAction_spec.js`), or a new factory if a better fit.

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
