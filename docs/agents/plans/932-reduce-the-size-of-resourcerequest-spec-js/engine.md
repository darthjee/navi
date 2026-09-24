# Engine Plan: Reduce the size of ResourceRequest_spec.js

Main plan: [plan.md](plan.md)

## Overview
Split `source/spec/lib/models/request/resource_request/ResourceRequest_spec.js` (698 lines) into four sibling spec files following the repo's `<Class>_<topic>_spec.js` convention (as in `JobRegistry_enqueue_spec.js`), and extract the file-local helpers into `source/spec/support/utils/`. No production code changes; every existing `it` is kept verbatim.

## Context
Current `describe` blocks and line ranges:

| Block | Lines | Target file |
|---|---|---|
| `.fromList`, `#parser and #emit`, `#clientName`, `#clientNamespace`, `#namespace`, `#disabled`, `#maxPage` | 25–234 | `ResourceRequest_spec.js` |
| `#resolveUrl`, `#needsParams`, `#hasUnresolvedTokens` | 236–405 | `ResourceRequest_url_spec.js` |
| `#enqueueActions`, `#hasAssets`, `#enqueueAssets`, `#hasParser`, `#hasEmit` | 407–576 | `ResourceRequest_enqueue_spec.js` |
| `#enqueueExtraction`, `#enqueuePaginatedActions` | 578–697 | `ResourceRequest_extraction_spec.js` |

File-local helpers (lines 16–22): `buildResponseWrapper(data)` and `setupJobRegistrySpy()`. They are used by `#enqueueActions` and `#enqueuePaginatedActions`, which end up in different files — hence the extraction. Both blocks also pair `setupJobRegistrySpy()` in `beforeEach` with `RegistryCleanupUtils.resetJobRegistry()` in `afterEach`.

The `#hasUnresolvedTokens`, `#resolveUrl`, `#needsParams`, `#disabled` and `#maxPage` cases are already table-driven (`[...].forEach`), so no further restructuring is needed there — just move them.

## Steps

- [01 — Add the shared ResourceRequest spec util](engine/01-add-spec-util.md)
- [02 — Create ResourceRequest_url_spec.js](engine/02-create-url-spec.md)
- [03 — Create ResourceRequest_enqueue_spec.js and ResourceRequest_extraction_spec.js](engine/03-create-enqueue-specs.md)
- [04 — Trim ResourceRequest_spec.js and verify](engine/04-trim-and-verify.md)

## CI Checks
- `source`: `yarn spec` and `yarn lint` (CI jobs: `jasmine` / `lint-and-report` with `path: source`, via `scripts/ci.sh`)

## Notes
- Each resulting file must be under 300 lines (`wc -l`). Expected sizes: ~250 / ~190 / ~190 / ~140.
- Drop imports that a file no longer uses — `yarn lint` flags unused imports.
- The `it` count across the four files must equal the original's; compare `grep -c "it(" ` before and after.
