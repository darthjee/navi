# Issue: Fix Pagination Processing

## Description

The pagination pipeline has two related bugs: incorrect parameter passing through the enqueuer chain, and missing per-page job enqueueing in `PaginatedActionEnqueuer`.

## Problem

- In `ResourceRequest`, when enqueuing via `PaginatedActionsEnqueuer`, only the `responseWrapper` is passed — the original request `parameters` are dropped. The enqueuer receives `responseWrapper` under the `parameters` argument, which is semantically wrong; both the original `parameters` and the `responseWrapper` should be available.
- `PaginatedActionsEnqueuer` forwards this incorrect value to `PaginatedActionEnqueuer` (one per `paginated_action` in the config), still without the original request parameters.
- `PaginatedActionEnqueuer` currently enqueues only a single `ResourceRequestPaginatedAction` instead of one per page. For example, if the response header returns `pages: 10`, it should enqueue `ResourceRequestPaginatedAction` ten times — once per page value (e.g. 1–10, or 0–9 for zero-based indexes).
- Each per-page enqueue must receive the original `ResourceRequest` parameters plus the current page number inserted under `pageKey`.

## Expected Behavior

- `ResourceRequest` passes both the original `parameters` and the `responseWrapper` to `PaginatedActionsEnqueuer`.
- `PaginatedActionsEnqueuer` and `PaginatedActionEnqueuer` correctly propagate both values down the chain.
- `PaginatedActionEnqueuer` reads the page count from the response (via `responseWrapper`) and enqueues one `ResourceRequestPaginatedAction` per page, each carrying the original parameters merged with `{ [pageKey]: <page number> }`.

## Solution

- Update the call site in `ResourceRequest` to pass both `parameters` and `responseWrapper` separately to `PaginatedActionsEnqueuer`.
- Update `PaginatedActionsEnqueuer` and `PaginatedActionEnqueuer` signatures to accept and forward both values.
- Add a loop in `PaginatedActionEnqueuer` that iterates over the page range and enqueues one `ResourceRequestPaginatedAction` per page, merging the page key into the parameters for each iteration.

## Benefits

- Fixes broken paginated resource warming — currently only one page is ever requested.
- Ensures the original request parameters are not silently discarded in the pagination path.
- Makes the enqueuer interface consistent with the non-paginated action path.

---
See issue for details: https://github.com/darthjee/navi/issues/535
