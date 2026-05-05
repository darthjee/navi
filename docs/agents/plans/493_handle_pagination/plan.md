# Plan: Handle Pagination

## Overview

Add support for `paginated_actions` in Navi's YAML configuration, allowing a resource to fan out into multiple page-specific requests based on a dynamic expression evaluated from the response (e.g. a `pages` header or body field).

## Context

Currently, `ResourceRequest` supports `actions` — each action enqueues one `ResourceRequestJob` per chained resource. There is no mechanism to iterate over pages. This plan introduces:

- A `PaginationConfig` model to represent the `pagination` block in YAML.
- A `ResourceRequestPaginatedAction` model (parallel to `ResourceRequestAction`) that resolves the page count and enqueues one job per page.
- A `PaginatedActionProcessingJob` to process a `(paginatedAction, item)` pair.
- `PaginatedActionEnqueuer` and `PaginatedActionsEnqueuer` (parallel to the existing `ActionEnqueuer` / `ActionsEnqueuer`).
- Extension of `ResourceRequest` to parse and trigger `paginated_actions`.

## Implementation Steps

### Step 1 — Add `PaginationConfig` model

Create `source/lib/models/PaginationConfig.js`.

- Static factory `PaginationConfig.fromObject(obj)` parses:
  - `pages` — path expression string (e.g. `parsedBody.pagination.pages` or `headers['pages']`)
  - `page_key` — string, parameter name for the page number
  - `zero_indexed` — boolean (default `false`)
- Exposes `resolvePages(responseWrapper)` that delegates to `PathResolver` to evaluate the `pages` expression, returning the total page count as a number.
- Exposes `pageNumbers()` (given the resolved count) returning an array of page numbers (`0..n-1` or `1..n` based on `zero_indexed`).

### Step 2 — Add `ResourceRequestPaginatedAction` model

Create `source/lib/models/ResourceRequestPaginatedAction.js`.

Mirrors `ResourceRequestAction` but holds a `PaginationConfig` instead of a flat `parameters` map.

- Static factory `ResourceRequestPaginatedAction.fromObject(obj, resourceRegistry)`.
- Method `execute(item, jobRegistry)`:
  1. Calls `pagination.resolvePages(item)` to get the total page count.
  2. Iterates over `pagination.pageNumbers(count)`.
  3. For each page, merges `{ [page_key]: pageNumber }` with the item's existing parameters.
  4. Looks up the target resource in `ResourceRegistry` and enqueues one `ResourceRequestJob` per `ResourceRequest` in that resource, passing the merged parameters.

### Step 3 — Extend `ResourceRequest` to support `paginated_actions`

In `source/lib/models/ResourceRequest.js`:

- Parse `paginated_actions` from config (parallel to the existing `actions` parsing).
- Add `enqueuePaginatedActions(responseWrapper)` method that delegates to `PaginatedActionsEnqueuer`.
- Call `enqueuePaginatedActions` from the existing `enqueueActions` flow (or alongside it) in `ResourceRequestJob`.

### Step 4 — Add `PaginatedActionProcessingJob`

Create `source/lib/jobs/PaginatedActionProcessingJob.js`.

Mirrors `ActionProcessingJob`:
- Receives `{ paginatedAction, item }` at build time.
- `perform()` calls `paginatedAction.execute(item, jobRegistry)`.
- Exhausted after first failure (no retry rights), same as `ActionProcessingJob`.
- Registered via `JobFactory` under the key `'PaginatedAction'`.

### Step 5 — Add `PaginatedActionEnqueuer` and `PaginatedActionsEnqueuer`

Create `source/lib/enqueuers/PaginatedActionEnqueuer.js`:
- Enqueues one `PaginatedActionProcessingJob` per item for a single `ResourceRequestPaginatedAction`.
- Calls `JobRegistry.enqueue('PaginatedAction', { paginatedAction, item })` for each item.

Create `source/lib/enqueuers/PaginatedActionsEnqueuer.js`:
- Mirrors `ActionsEnqueuer`.
- Receives a list of per-item `ResponseWrapper` instances and enqueues one `PaginatedActionProcessingJob` per `(item × paginatedAction)` pair.
- Throws `NullResponse` for null items list.
- Delegates per-action enqueueing to `PaginatedActionEnqueuer`.

### Step 6 — Wire `PaginatedActionProcessingJob` into `JobFactory`

In the bootstrap / factory registration code, register `'PaginatedAction'` → `PaginatedActionProcessingJob`.

### Step 7 — Write specs

Add spec files mirroring each new source file:

- `source/spec/lib/models/PaginationConfig_spec.js`
- `source/spec/lib/models/ResourceRequestPaginatedAction_spec.js`
- `source/spec/lib/jobs/PaginatedActionProcessingJob_spec.js`
- `source/spec/lib/enqueuers/PaginatedActionEnqueuer_spec.js`
- `source/spec/lib/enqueuers/PaginatedActionsEnqueuer_spec.js`
- Update `source/spec/lib/models/ResourceRequest_spec.js` to cover `paginated_actions` parsing and `enqueuePaginatedActions`.

## Files to Change

- `source/lib/models/PaginationConfig.js` — new file
- `source/lib/models/ResourceRequestPaginatedAction.js` — new file
- `source/lib/models/ResourceRequest.js` — add `paginated_actions` parsing and `enqueuePaginatedActions`
- `source/lib/jobs/PaginatedActionProcessingJob.js` — new file
- `source/lib/enqueuers/PaginatedActionEnqueuer.js` — new file
- `source/lib/enqueuers/PaginatedActionsEnqueuer.js` — new file
- Bootstrap/factory registration — register `'PaginatedAction'` factory key
- Spec files (7 files as listed above)

## Notes

- `PaginatedActionProcessingJob` should be exhausted after first failure (same policy as `ActionProcessingJob`).
- The `pages` expression uses the same `PathResolver` / `ParametersMapper` engine already used for `parameters` — no new expression evaluator needed.
- Page parameters are merged with pre-existing parameters already present in the originating resource request, so the downstream resource (e.g. `paginated_category_items`) has access to both `id` and `page_number`.
- `zero_indexed: false` (1-based) is the default when the flag is absent.
- Existing `actions` behavior is unchanged; `paginated_actions` is purely additive.
