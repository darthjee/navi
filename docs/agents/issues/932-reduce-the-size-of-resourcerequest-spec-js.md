# Issue: Reduce the size of ResourceRequest_spec.js

## Description
The spec size check reports `source/spec/lib/models/request/resource_request/ResourceRequest_spec.js` as **ERROR** with 698 lines.

## Problem
- The file covers every concern of `ResourceRequest` in one place: `.fromList`, the accessors (`#clientName`, `#clientNamespace`, `#namespace`, `#disabled`, `#maxPage`), URL handling (`#resolveUrl`, `#needsParams`, `#hasUnresolvedTokens`), and every enqueue method (`#enqueueActions`, `#enqueueAssets`, `#enqueueExtraction`, `#enqueuePaginatedActions`) plus their `#has*` predicates.
- `#hasUnresolvedTokens` alone is about 100 lines and `#enqueueExtraction` about 85.
- The enqueue section (lines 407–698) is about 290 lines by itself, so a single "enqueue" file would still go over the limit once imports and setup are added.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `source/`.
- New spec files follow the repo's `<Class>_<topic>_spec.js` convention for split specs (as in `JobRegistry_enqueue_spec.js` and `RouteRegister_post_spec.js`). They must not use names like `ResourceRequestUrl_spec.js`, which look like specs of other classes (the same folder already has `ResourceRequestAction_spec.js`, `ResourceRequestEmit_spec.js` and others, each testing its own class).
- New shared helpers live in `source/spec/support/` (`factories/`, `utils/` or `dummies/`), following the style of the existing ones (`ResourceRequestFactory`, `AxiosUtils`, `LoggerUtils`, `JobLifecycleExamples`, ...).

## Solution
- Split into four sibling spec files in the same folder:
  - `ResourceRequest_spec.js`: `.fromList`, `#parser and #emit`, and the accessors (`#clientName`, `#clientNamespace`, `#namespace`, `#disabled`, `#maxPage`)
  - `ResourceRequest_url_spec.js`: `#resolveUrl`, `#needsParams`, `#hasUnresolvedTokens`
  - `ResourceRequest_enqueue_spec.js`: `#enqueueActions`, `#hasAssets`, `#enqueueAssets`, `#hasParser`, `#hasEmit`
  - `ResourceRequest_extraction_spec.js`: `#enqueueExtraction`, `#enqueuePaginatedActions`
- Move the shared setup (`setupJobRegistrySpy`, `buildResponseWrapper`, registry cleanup, logger stubs, `Application` setup) into a support util so that each new file doesn't repeat it.
- Where the `#hasUnresolvedTokens` cases are table-like, drive them from a list of examples.
- If a file still ends up over 300 lines, the implementer may split it further using the same `<Class>_<topic>_spec.js` naming.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers
- The spec size check stops flagging this file
