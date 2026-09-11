# engine Plan: Parameterized runtime enqueue: run a named resource with per-request parameter values (no full POST /api/config)

Main plan: [plan.md](plan.md)

## Shared contracts

You implement the full request/response contract described in the main plan's
"Shared contracts" section — `architect`, `navi-client`, and `docs` each write
documentation that must match it exactly. In particular: `resources[]` entries
as string-or-`{name, parameters}`, target-level `parameters` merged under
per-resource values, parameter values restricted to `string`/`number`/`boolean`/
`null` (object/array → 400), `enqueued` staying a plain `string[]`, and the
additive `parameters` key on `skippedResources` echoing the merged map.

## Steps

- [01 — Parameter-aware token resolution on ResourceRequest](engine/01-parameter-aware-token-resolution.md)
- [02 — Merge and thread parameters through ResourceEnqueuer](engine/02-resource-enqueuer-merge-and-thread.md)
- [03 — Extend ApiEngineStartHandler validation and response shape](engine/03-api-engine-start-handler.md)
- [04 — Integration specs for POST /api/engine/start with parameters](engine/04-integration-specs.md)

## CI Checks

- `source`: `cd source && npm run coverage` (CI job: `jasmine`)
- `source`: lint via `scripts/ci.sh lint-and-report source` (CI job: `checks`)

## Notes

- `hasUnresolvedTokens({})` must be equivalent to the existing `needsParams()`,
  so every enqueue path that doesn't pass parameters (boot `enqueueFirstJobs()`,
  `PATCH /engine/start`, `POST /api/config`'s enqueue-on-running,
  `POST /api/engine/start` without `parameters`) behaves identically — verify
  this explicitly in the `ResourceEnqueuer` spec rather than just by code
  inspection.
- `disabled` and `not_found` checks keep their current precedence, evaluated
  before the token gate.
- Bulk enqueue (`enqueueAll()` / a target with no `resources` list) stays
  param-free-only even when the target carries a `parameters` default — do not
  let it sweep token-bearing resources.
