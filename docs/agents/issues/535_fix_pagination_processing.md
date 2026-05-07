# Issue: Fix Pagination Processing

## Description

The pagination pipeline has two related problems: incorrect parameter passing through the enqueuer chain, and the risk that original request parameters are silently lost when paginated jobs execute.

## Context

The per-page loop already exists in `ResourceRequestPaginatedAction.execute()`, which iterates over page numbers and enqueues one `ResourceRequestJob` per page. The problem is that the original request `parameters` may not reach that point correctly.

## Problem

### 1 — Naming confusion: `responseWrapper` passed as `parameters`

In `ResourceRequest.enqueuePaginatedActions`, only the `responseWrapper` is passed to `PaginatedActionsEnqueuer`, which stores it in a field called `parameters`. This is propagated as-is through `PaginatedActionsEnqueuer` → `PaginatedActionEnqueuer` → `PaginatedActionProcessingJob`.

The argument name `parameters` is misleading because it actually holds a `ResponseWrapper`, not a key-value parameters map.

### 2 — Original request parameters are not passed

`ResourceRequest.enqueuePaginatedActions` receives no `parameters` argument — it only has access to the `responseWrapper`. Therefore, the original request parameters (the key-value map used to resolve URL templates) are never forwarded into the paginated action chain.

In `ResourceRequestPaginatedAction.execute()`, the code attempts to recover them via:

```js
const existingParams = responseWrapper.parameters ?? {};
```

This only works if `ResponseWrapper` exposes a `.parameters` property containing the original request parameters. If it does not, `existingParams` is always `{}`, and the per-page `ResourceRequestJob`s are enqueued without the original parameters — breaking URL template resolution for paginated resources.

## Expected Behavior

- `ResourceRequest.enqueuePaginatedActions` receives and forwards the original request `parameters` alongside the `responseWrapper`.
- The entire enqueuer chain (`PaginatedActionsEnqueuer` → `PaginatedActionEnqueuer` → `PaginatedActionProcessingJob`) propagates both values separately and unambiguously.
- `ResourceRequestPaginatedAction.execute()` merges the original `parameters` with the page key/value and enqueues one `ResourceRequestJob` per page with the correct parameters.

## Solution

- Add a `parameters` argument to `ResourceRequest.enqueuePaginatedActions` and pass it from the call site in `ResourceRequestJob`.
- Update `PaginatedActionsEnqueuer` and `PaginatedActionEnqueuer` to carry both `responseWrapper` and `parameters` as distinct fields.
- Update `PaginatedActionProcessingJob` to pass both to `ResourceRequestPaginatedAction.execute()`.
- Verify (or fix) whether `ResponseWrapper.parameters` already exposes the original request parameters; if it does, the `execute()` method may already be correct once the upstream chain is fixed.
- Rename misleading `parameters` fields/arguments to `responseWrapper` throughout the chain.

## Benefits

- Ensures paginated resources are warmed with the correct URL parameters across all pages.
- Removes the naming confusion that makes the code hard to reason about.
- Makes the enqueuer interface consistent with the non-paginated action path.

---
See issue for details: https://github.com/darthjee/navi/issues/535
