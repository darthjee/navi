# Issue: Enqueue one ResourceRequestJob per page when processing paginated action

## Description

When processing a `PaginatedAction`, the system knows the total number of pages but currently only enqueues a single `ResourceRequestJob` for the first page. All subsequent pages are never fetched.

## Problem

- `PaginatedAction` processing enqueues only one `ResourceRequestJob` (page 1) regardless of the total page count.
- Pages 2 through N are silently skipped, resulting in incomplete cache warming for paginated resources.

## Expected Behavior

- For each page in the paginated result, a separate `ResourceRequestJob` should be enqueued.
- If the total page count is 10 and pages are 1-indexed, jobs for pages 1 through 10 must be enqueued.
- If pages are 0-indexed, jobs for pages 0 through 9 must be enqueued.
- Zero pages should result in no jobs being enqueued.

## Solution

- In the `PaginatedAction` processing pipeline, after determining the page count, loop over the page range and enqueue one `ResourceRequestJob` per page.
- Detect or configure whether the pagination is 0-indexed or 1-indexed and generate the range accordingly.

## Benefits

- Ensures all pages of a paginated resource are fully cache-warmed.
- Eliminates silent data loss where only the first page is processed.

---
See issue for details: https://github.com/darthjee/navi/issues/538
