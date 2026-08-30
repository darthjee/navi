# Engine Plan: Crawler: verify and test extraction/emit interaction with paginated_actions

Main plan: [plan.md](plan.md)

## Overview

`ResourceRequestJob.#handleResponse()` runs four things off a single successful response, in
this order:

1. `#enqueueAssets(response, originUrl)`
2. `#enqueueExtraction(response, originUrl)` — enqueues an `Extraction` job when
   `resourceRequest.hasParser()` (the `parser` + `emit` path)
3. `resourceRequest.enqueueActions(wrapper, originUrl)` — normal resource chaining
4. `resourceRequest.enqueuePaginatedActions(wrapper, parameters, originUrl)` — pagination fan-out

`enqueuePaginatedActions` enqueues one `PaginatedAction` job per configured
`paginated_actions` entry. `PaginatedActionProcessingJob.perform()` calls
`ResourceRequestPaginatedAction.execute(responseWrapper, parameters)`, which resolves a page
count, looks the **target resource** up in the `NamespaceMap` singleton, and for every
non-disabled `ResourceRequest` of that resource enqueues one `ResourceRequestJob` per page
(`{ resourceRequest, parameters: pageParameters }`), with `pageParameters` = original
parameters + mapped parameters + `{ [pageKey]: page }`.

Because each per-page `ResourceRequestJob` runs its own `#handleResponse()` when performed,
`#enqueueExtraction` is re-evaluated per page against that target `ResourceRequest`'s own
`parser`/`emit` config. So on paper both combinations already work:

- **Origin resource** (the one whose response drives pagination) with `parser` + `emit`:
  its own single `Extraction` job is enqueued from step 2, independently of the fan-out in
  step 4.
- **Paginated target resource** with `parser` + `emit`: each per-page `ResourceRequestJob`
  independently enqueues its own `Extraction` → `Emit` chain.

This plan confirms that behaviour, locks it down with an end-to-end test, and documents it.

## Context

- Issue #705 is part of #699 (Next Steps for Crawler Implementation).
- The extraction/emit path and the `paginated_actions` path were added independently; their
  interaction has never been exercised together.
- Existing end-to-end coverage for extraction/emit lives in
  `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` — it drives a real `ResourceRequestJob`
  → real `ExtractionJob` → real `EmitEnqueuer` → real `EmitJob` chain through the real
  `JobFactory`/`JobRegistry`, mocking only the HTTP boundary via `AxiosUtils.stubGet` /
  `AxiosUtils.stubPost`. The new coverage extends this spec.
- `RegistriesBuilder` wires the job types in production:
  `JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: { clients: config.namespaceMap, ... } })`,
  `JobFactory.build('PaginatedAction', { klass: PaginatedActionProcessingJob, ... })`,
  `JobFactory.build('Extraction', ...)`, `JobFactory.build('Emit', { klass: EmitJob, attributes: { clients: config.namespaceMap } })`.
  The existing flow spec only builds `Action`, `Extraction`, and `Emit`; the paginated flow
  additionally needs `ResourceRequestJob` and `PaginatedAction` registered so the queue can
  materialise the per-page jobs.
- Nuance for the test: `ExtractionEmitFlow_spec.js` currently passes an *instance*
  `NamespaceMap` (via `NamespaceMapFactory.build`) directly into `new ResourceRequestJob(...)`.
  `ResourceRequestPaginatedAction.execute()` instead resolves the target resource from the
  **`NamespaceMap` singleton** (`NamespaceMap.build(...)` / default import). The paginated
  test therefore has to populate the singleton with both the resources *and* the clients, and
  build the `ResourceRequestJob`/`Emit` job factories against that same singleton, so that
  `namespaceMap.getResource(...)` and client resolution both succeed. `ResourceActionUtils`
  and `NamespaceMapFactory` show the two registration styles;
  `ResourceRequestPaginatedAction_spec.js` shows a singleton-based pagination setup.
- `docs/agents/future/crawler/flows.md` has an "Interaction with existing chaining" section
  covering `actions` but nothing about `paginated_actions`. Sibling docs
  (`overview.md`, `scope.md`, `reference-loot-studios.md`, `gaps.md`, `decisions.md`) are
  context only — `flows.md` is the file to update.

## Steps

- [01 — Verify the extraction/emit code path under paginated_actions](engine/01-verify-code-path.md)
- [02 — Add the paginated_actions + parser/emit end-to-end test](engine/02-add-integration-test.md)
- [03 — Document the paginated_actions interaction in flows.md](engine/03-document-flows.md)

## CI Checks

- `source`: `cd source && npm test` (CI job: `jasmine` — runs `npm run coverage`)
- `source`: `cd source && npm run lint` (CI job: `checks` — `eslint lib spec`)
- `source`: `cd source && npm run check_docs` (CI job: `checks` — JSDoc pedantic check; only
  relevant if step 01 touches `lib/` source)

## Notes

- Expectation is that no production code change is needed. Step 01 may still uncover a defect
  (e.g. parameters not threaded to the per-page extraction, `originUrl` lost, or a
  double-enqueue). Per the issue: fix inline only if the change is small and contained;
  otherwise spawn a follow-up issue and keep #705 scoped to verification + tests + docs.
- Keep the new test aligned with the existing spec's style: perform jobs explicitly in
  dependency order (`ResourceRequestJob` → find enqueued `PaginatedAction` → perform it →
  find enqueued per-page `ResourceRequestJob`s → perform each → find per-page `ExtractionJob`s
  → perform → assert the resulting `EmitJob`s and `axios.post` calls).
- Do not add a real CI job; `source/` is already covered by the `jasmine` and `checks` jobs.
