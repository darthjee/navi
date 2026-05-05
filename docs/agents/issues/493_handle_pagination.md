# Issue: Handle Pagination

## Description

Navi currently supports resource chaining through actions, but has no mechanism to handle paginated resources. When a resource response indicates multiple pages (e.g. via a `pages` header), Navi must be able to enqueue one request per page rather than a single action.

## Problem

- Navi has no concept of pagination in its action processing pipeline.
- There is no way to configure a resource to fan out into multiple page-specific requests.
- The existing `ActionProcessingJob` handles only a single chained resource per action; there is no job to handle iterating over pages.

## Expected Behavior

- A new `paginated_actions` key can be added alongside (or instead of) `actions` in a resource definition.
- Each `paginated_action` entry includes a `pagination` block with:
  - `pages` — an expression (similar to how `parameters` is parsed) evaluated against `headers` or `parsed_body` to determine the total number of pages.
  - `page_key` — the parameter name to inject as the current page number into downstream resource requests.
  - `zero_indexed` — boolean flag indicating whether page numbering starts at `0` (true) or `1` (false).
- A new `PaginatedActionProcessingJob` is introduced. It reads the `pages` value and enqueues one `ActionProcessingJob` per page, each carrying the appropriate page parameter merged with any existing parameters from the originating resource request.

## Solution

- Add `paginated_actions` parsing support in the resource/action configuration layer (similar to how `parameters` is parsed today).
- Introduce `PaginatedActionProcessingJob` that:
  1. Evaluates `pagination.pages` against `headers` / `parsed_body` of the response.
  2. Iterates from `0` (or `1`) up to `pages`.
  3. Merges the page parameter (keyed by `page_key`) with the resource's existing parameters.
  4. Enqueues one `ActionProcessingJob` per page.
- Keep existing `actions` behaviour unchanged; `paginated_actions` is an additive feature.

## Benefits

- Enables cache-warming of fully paginated APIs without manual configuration of every page.
- Page parameters are composable with existing parameters (e.g. an `id` from a previous chained resource plus a `page_number` from pagination).
- Follows the same expression-evaluation pattern already used for `parameters`, keeping the configuration API consistent.

---
See issue for details: https://github.com/darthjee/navi/issues/493
