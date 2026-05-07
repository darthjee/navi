# Plan: Fix Pagination Processing

## Overview

Fix the paginated action pipeline so that the original request `parameters` are correctly propagated alongside the `responseWrapper` from `ResourceRequest` all the way to `ResourceRequestPaginatedAction.execute()`, and clean up the misleading naming throughout the chain.

## Context

The per-page enqueueing loop already exists in `ResourceRequestPaginatedAction.execute()`. The bug is that the original request parameters (key-value map for URL template resolution) are never passed into the paginated chain — only the `responseWrapper` is. Throughout the chain, `responseWrapper` is stored under a field named `parameters`, causing naming confusion. `ResourceRequestPaginatedAction.execute()` attempts to recover the original parameters via `responseWrapper.parameters ?? {}`, which only works if `ResponseWrapper` exposes that property.

## Implementation Steps

### Step 1 — Verify `ResponseWrapper.parameters`

Read `source/lib/models/response/ResponseWrapper.js` and check whether it exposes a `.parameters` getter/property carrying the original request parameters.

- **If it does:** the fix only needs to ensure it is populated at the right time upstream.
- **If it does not:** a `.parameters` property must be added, or the parameters must be threaded as a separate argument all the way through.

This finding determines the exact shape of the remaining steps.

### Step 2 — Update `ResourceRequest.enqueuePaginatedActions`

Add a `parameters` argument (defaulting to `{}`) and forward it to `PaginatedActionsEnqueuer` as a distinct argument.

```js
// Before
enqueuePaginatedActions(responseWrapper, originUrl = null)

// After
enqueuePaginatedActions(responseWrapper, parameters = {}, originUrl = null)
```

File: `source/lib/models/request/ResourceRequest.js`

### Step 3 — Update the call site in `ResourceRequestJob`

Find where `resourceRequest.enqueuePaginatedActions(responseWrapper)` is called and pass the job's own `parameters` as the second argument.

File: `source/lib/jobs/ResourceRequestJob.js`

### Step 4 — Update `PaginatedActionsEnqueuer`

- Rename the `#parameters` field to `#responseWrapper`.
- Add a new `#parameters` field for the original request parameters.
- Update the constructor signature accordingly.
- Forward both to `PaginatedActionEnqueuer`.

File: `source/lib/enqueuers/PaginatedActionsEnqueuer.js`

### Step 5 — Update `PaginatedActionEnqueuer`

- Same rename: `#parameters` → `#responseWrapper`, add `#parameters`.
- Update `#buildParams()` to pass both `responseWrapper` and `parameters` to the job.

File: `source/lib/enqueuers/PaginatedActionEnqueuer.js`

### Step 6 — Update `PaginatedActionProcessingJob`

Update the job to receive both `responseWrapper` and `parameters` from the registry params, and pass them correctly when calling `paginatedAction.execute()`.

File: `source/lib/jobs/PaginatedActionProcessingJob.js`

### Step 7 — Update `ResourceRequestPaginatedAction.execute()`

Change the signature to accept both `responseWrapper` and `parameters` as distinct arguments, replacing the fragile `responseWrapper.parameters ?? {}` fallback.

```js
// Before
execute(responseWrapper)

// After
execute(responseWrapper, parameters = {})
```

Use `parameters` directly as `existingParams` in the per-page loop.

File: `source/lib/models/request/ResourceRequestPaginatedAction.js`

### Step 8 — Tests

Add or update specs for each changed class:

- `source/spec/lib/models/request/ResourceRequest_spec.js` — `enqueuePaginatedActions` passes parameters
- `source/spec/lib/jobs/ResourceRequestJob_spec.js` — call site passes parameters
- `source/spec/lib/enqueuers/PaginatedActionsEnqueuer_spec.js` — both fields propagated
- `source/spec/lib/enqueuers/PaginatedActionEnqueuer_spec.js` — both fields in job params
- `source/spec/lib/jobs/PaginatedActionProcessingJob_spec.js` — passes both to execute
- `source/spec/lib/models/request/ResourceRequestPaginatedAction_spec.js` — per-page jobs use correct parameters

## Files to Change

- `source/lib/models/response/ResponseWrapper.js` — verify/add `.parameters` property (Step 1)
- `source/lib/models/request/ResourceRequest.js` — add `parameters` arg to `enqueuePaginatedActions`
- `source/lib/jobs/ResourceRequestJob.js` — pass `parameters` at call site
- `source/lib/enqueuers/PaginatedActionsEnqueuer.js` — rename field, add `parameters`
- `source/lib/enqueuers/PaginatedActionEnqueuer.js` — rename field, add `parameters`
- `source/lib/jobs/PaginatedActionProcessingJob.js` — forward both to `execute()`
- `source/lib/models/request/ResourceRequestPaginatedAction.js` — fix `execute()` signature

## Notes

- Step 1 is a prerequisite — its outcome determines whether `ResponseWrapper` needs changes.
- The rename of `parameters` → `responseWrapper` throughout the enqueuers is a pure refactor; make sure all existing tests still pass after the rename before adding new behavior.
- `originUrl` threading is already correct in the current code and should not be disrupted.
