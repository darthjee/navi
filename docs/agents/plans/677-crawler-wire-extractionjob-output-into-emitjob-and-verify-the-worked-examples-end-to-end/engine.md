# Engine Plan: Crawler: wire ExtractionJob output into EmitJob and verify the worked examples end-to-end

Main plan: [plan.md](plan.md)

## Steps

- [01 — Define the extracted-item contract and add EmitEnqueuer](engine/01-define-extracted-item-contract-and-emit-enqueuer.md)
- [02 — Wire ExtractionJob to delegate to EmitEnqueuer](engine/02-wire-extractionjob-to-emit-enqueuer.md)
- [03 — Thread emit config and parameters through ResourceRequest/ResourceRequestJob](engine/03-thread-emit-and-parameters-through-resourcerequest.md)
- [04 — Add end-to-end specs for both worked examples](engine/04-add-end-to-end-integration-specs.md)
- [05 — Update the Runtime Flow docs](engine/05-update-flow-docs.md)

## CI Checks

- `source`: `docker compose run --rm navi_tests bash -c "yarn coverage && yarn lint && yarn report"` (CI jobs: `jasmine`, `checks`)

## Notes

- All work here stays inside `source/` plus the internal `docs/agents/flow/` runtime-flow doc — no `frontend/` or user-facing `docs/guides/` changes. Registering `EmitJob` in the frontend's `jobClasses.js` is explicitly out of scope; it stays owned by sibling issue #678.
- `JobFactory.build('Emit', ...)` (`ApplicationInstance.js`) already injects `clients: this.config.namespaceMap` as a default attribute, the same way `AssetDownload` jobs get `clientRegistry` injected — so neither `EmitEnqueuer` nor the per-item `jobRegistry.enqueue('Emit', ...)` call needs to pass `clients` explicitly; only `item`, `emit`, and `parameters` are needed per enqueue call.
- The `parameters` forwarded to each `EmitJob` are the original resource-request parameters that triggered the parent `ResourceRequestJob` (the same ones already threaded into `enqueuePaginatedActions`) — not the extracted item's own fields.
