# Add the paginated_actions + parser/emit end-to-end test

Extend `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` with a new top-level `describe`
block (e.g. `describe('paginated_actions + parser/emit interaction', ...)`) that drives the
real job chain through `JobFactory`/`JobRegistry`, mocking only the HTTP boundary. Follow the
existing file's structure and helpers (`LoggerUtils`, `AxiosUtils.stubGet` /
`AxiosUtils.stubPost`, `ClientFactory`, `jobsByStatus('enqueued')`, explicit `perform` calls
in dependency order).

## Setup differences from the existing blocks

- Register the job types the paginated flow needs, in addition to `Action` / `Extraction` /
  `Emit`:
  - `JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: { clients: <namespaceMap> } })`
  - `JobFactory.build('PaginatedAction', { klass: PaginatedActionProcessingJob })`
- Populate the **`NamespaceMap` singleton** (`NamespaceMap.build({ ... })`) with:
  - a `default` namespace holding both resources (origin + paginated target) and both
    clients (`lootstudios` fetch client, `majora_api` emit client), so
    `ResourceRequestPaginatedAction.execute()`'s `namespaceMap.getResource('default', <target>, null)`
    resolves and the per-page `ResourceRequestJob` / `EmitJob` can resolve their clients.
  - build the `ResourceRequestJob` and `Emit` job factories against that same singleton
    instance so client resolution is consistent across the origin job and the per-page jobs.
  - reset it in `afterEach` (`NamespaceMap.reset()`), matching `ResourceActionUtils`.
- Use `JobRegistry.build({ cooldown: -1 })` and `JobRegistry.reset()` / `JobFactory.reset()`
  in `afterEach`, as the existing blocks do.

## Scenario A — paginated target resource carries parser + emit

- Origin resource (`/index.json`, client `lootstudios`): `paginated_actions: [{ resource: 'product', pagination: [{ pages: 'parsedBody.total_pages', page_key: 'page' }] }]`,
  no `parser`. Stub its GET to return `{ "total_pages": 3 }`.
- Target resource `product` with a single `ResourceRequest` (`/products/{:page}.json`,
  client `lootstudios`) that declares `parser` (`json_path`, `match` on a list, `fields`
  mapping) + `emit` (`POST` to `majora_api` `/api/products`). Stub its GET (per page) to
  return a small list body; the stub can be page-agnostic or vary by URL.
- Drive: perform origin `ResourceRequestJob` → find the enqueued `PaginatedAction` job,
  perform it → find the 3 enqueued per-page `ResourceRequestJob`s, perform each → find the 3
  enqueued `ExtractionJob`s, perform each → collect the resulting `EmitJob`s, perform each.
- Assert:
  - exactly 3 per-page `ResourceRequestJob`s, with `parameters` `{ page: 1 }`, `{ page: 2 }`,
    `{ page: 3 }` respectively.
  - one `ExtractionJob` per page (3 total), each independent.
  - `axios.post` called once per extracted item per page, to
    `https://majora.example.com/api/products`, with the mapped body — and that the body /
    any page-derived field reflects the correct page's parameters (no cross-talk, no
    duplication, none missing).

## Scenario B — origin resource carries parser + emit (alongside paginated_actions)

- Origin resource (`/catalog.json`, client `lootstudios`) declares **both**
  `paginated_actions` (as in Scenario A, targeting a simple `product` resource — the target
  can be `actions`/`parser`-free here) **and** its own `parser` + `emit` (`POST` to
  `majora_api`). Stub its GET to return a body that satisfies both the pagination
  `pages` expression and the parser `match`.
- Drive: perform origin `ResourceRequestJob` → assert one `ExtractionJob` is enqueued for the
  origin response; perform it → assert the origin `EmitJob`(s) fire exactly once with the
  mapped body. Separately, find and perform the `PaginatedAction` job and assert the per-page
  `ResourceRequestJob`s are still enqueued (fan-out unaffected by the origin's own
  extraction).
- Assert the origin extraction fires exactly once (not once per page) and the two paths do
  not interfere.

## Regression assertions

- In Scenario B, assert no extra `ExtractionJob` is enqueued for the paginated target when it
  has no `parser`.
- Assert total `axios.post` call count equals the exact expected number across both paths.

Run `cd source && npm test` and `cd source && npm run lint` and confirm green.

## Files to Change

- `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` — add the new `describe` block(s) for
  Scenario A and Scenario B plus regression assertions.
- `source/spec/support/factories/` or `source/spec/support/utils/` — only if a small shared
  helper is genuinely needed (prefer reusing `ResourceActionUtils` / `NamespaceMapFactory` /
  `ClientFactory` / `ResourceRequestFactory` as-is).
