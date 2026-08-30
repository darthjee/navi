# Verify the extraction/emit code path under paginated_actions

Trace and confirm — by reading the code, not by guessing — that `#enqueueExtraction` is
evaluated per `ResourceRequestJob` regardless of how that job was enqueued (first jobs,
`actions` chaining, or `paginated_actions` fan-out), and that nothing about the pagination
path suppresses, duplicates, or corrupts the extraction/emit path.

Checklist to walk through:

- `ResourceRequestJob.#handleResponse()` calls `#enqueueExtraction(response, originUrl)`
  unconditionally for every performed job; `#enqueueExtraction` gates only on
  `this.#resourceRequest.hasParser()`. Confirm there is no shared/instance state that would
  make this fire only once across paginated siblings (each per-page job is a distinct
  `ResourceRequestJob` instance built by the factory).
- `ResourceRequestPaginatedAction.execute()` enqueues `'ResourceRequestJob'` with
  `{ resourceRequest, parameters: pageParameters }`. Confirm `pageParameters` (original +
  mapped + `pageKey`) is what later reaches `ResourceRequest.enqueueExtraction(..., parameters, ...)`
  as the `parameters` argument, i.e. per-page parameters are threaded into the extraction /
  `EmitJob` body mapping, not dropped.
- Confirm `originUrl` handling: the per-page `ResourceRequestJob` recomputes its own
  `originUrl` from `resolveUrl(this.#parameters)` in `#handleResponse`, so each page's
  extraction is attributed to that page's URL. Note whether that matches the intended
  observability behaviour (cross-check against issue #703/#704 tracking expectations only if
  trivially visible — otherwise just record the observed behaviour).
- Confirm the origin resource's own extraction (step 2 of `#handleResponse`) and the
  pagination fan-out (step 4) are independent: both are invoked from the same method with no
  early return between them, and `enqueuePaginatedActions` does not clear or re-enqueue the
  extraction job.
- Confirm `Application.isStopped()` guards behave consistently: `PaginatedActionEnqueuer`
  and `ResourceRequestPaginatedAction.execute` both short-circuit when stopped; check the
  extraction path's equivalent guard so a stop does not leave a half-fanned-out state that
  emits inconsistently.

Outcome: a short written confirmation (captured in the PR description / commit message) that
the combination works, **or** a precise description of the defect found. If a defect is
found and the fix is small and contained (a missed argument, a lost `originUrl`, a guard
inconsistency), fix it here with matching unit-test coverage in the existing per-class specs
(`ResourceRequestJob_spec.js`, `ResourceRequestPaginatedAction_spec.js`, or
`ResourceRequest_spec.js`). If the fix is larger, stop and spawn a follow-up issue, leaving
#705 scoped to verification + tests + docs.

## Files to Change

- `source/lib/jobs/ResourceRequestJob.js` — only if a small defect is found (e.g. argument
  threading or `originUrl`); otherwise unchanged.
- `source/lib/models/request/ResourceRequestPaginatedAction.js` — only if a small defect is
  found in per-page parameter/`originUrl` propagation; otherwise unchanged.
- `source/lib/models/request/ResourceRequest.js` — only if `enqueueExtraction` /
  `enqueuePaginatedActions` interaction needs a small fix; otherwise unchanged.
- `source/spec/lib/jobs/ResourceRequestJob_spec.js`,
  `source/spec/lib/models/request/ResourceRequestPaginatedAction_spec.js`,
  `source/spec/lib/models/request/ResourceRequest_spec.js` — add focused unit coverage only
  if a production fix is made here.
