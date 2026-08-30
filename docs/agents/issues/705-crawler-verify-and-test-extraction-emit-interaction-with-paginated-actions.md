# Issue: Crawler: verify and test extraction/emit interaction with paginated_actions

## Description

Part of #699 (Next Steps for Crawler Implementation).

`ExtractionJob` is enqueued from `ResourceRequestJob.#handleResponse()` — via `ResourceRequest.enqueueExtraction()` whenever `hasParser()` is true — in parallel with `enqueueActions()` (resource chaining) and `enqueuePaginatedActions()` (pagination fan-out). The `paginated_actions` mechanism (`ResourceRequestPaginatedAction.execute()`) resolves a page count from the response and enqueues one `ResourceRequestJob` per page for each `ResourceRequest` of a target resource. It has not been verified that extraction/emit behaves correctly when `paginated_actions` is combined with `parser` + `emit`, and there is no test coverage for the combination.

## Problem

- The extraction/emit path and the `paginated_actions` path were added independently and their interaction is untested.
- Two combinations are unverified:
  - the origin resource (whose response drives pagination) also declares `parser` + `emit`, so its own `ExtractionJob` must fire exactly once alongside the fan-out;
  - the paginated target resource declares `parser` + `emit`, so each per-page `ResourceRequestJob` must independently run its own extraction/emit.
- `docs/agents/future/crawler/flows.md` documents how extraction composes with `actions` chaining but says nothing about `paginated_actions`.

## Expected Behavior

- A resource declaring both `paginated_actions` and `parser` + `emit` behaves correctly and independently: the origin response's extraction/emit fires exactly once and the pagination fan-out is unaffected.
- Each paginated `ResourceRequestJob` runs its own `ExtractionJob` -> `EmitJob` chain, once per page, with that page's parameters applied.
- No duplicated, missing, or cross-contaminated emits between the pagination and extraction paths.

## Solution

- Trace the code path and confirm `hasParser()` / `enqueueExtraction()` is evaluated per `ResourceRequestJob` regardless of how the job was enqueued (first jobs, `actions` chaining, or `paginated_actions`).
- Add an end-to-end integration test, extending `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` (same real `JobFactory`/`JobRegistry` wiring, mocking only the HTTP boundary), that:
  - configures a resource with `paginated_actions` targeting a resource whose `ResourceRequest` declares `parser` + `emit`;
  - drives the real `ResourceRequestJob` -> `PaginatedActionProcessingJob` -> per-page `ResourceRequestJob` -> `ExtractionJob` -> `EmitJob` chain;
  - asserts one extraction/emit per page with correctly mapped bodies and page parameters;
  - also covers the origin resource itself carrying `parser` + `emit`.
- Document the `paginated_actions` + extraction interaction in `docs/agents/future/crawler/flows.md`.
- If verification uncovers a defect, fix it within this issue when the change is small and contained; otherwise spawn a follow-up issue and keep this one scoped to verification, tests, and docs.

## Benefits

- Confidence that crawler extraction/emit composes correctly with pagination.
- Regression protection for a currently-untested combination of response-handling paths.
- Clearer contributor documentation on how chaining, pagination, and extraction compose.
