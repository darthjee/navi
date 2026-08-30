# Tests, docs and build check

## Tests

Mirror the existing spec styles (`renderToStaticMarkup` / `renderToString` string assertions; no Testing Library):

- `spec/clients/EmissionsClient_spec.js`, `spec/clients/ExtractionsClient_spec.js` — copy `spec/clients/LogsClient_spec.js`: URL with/without `last_id`, non-ok throws `HTTP <status>`, parsed body returned.
- `spec/clients/StatsClient_spec.js` — extend: `emissions` defaults applied, values from the response passed through.
- `spec/components/StatsHeader_spec.js` / a new `StatsDisplay_spec.js` — the Emissions group renders with the four counts and the `/extractions` + `/emissions` links.
- `spec/components/Emissions_spec.js` + `spec/components/EmissionsHelper_spec.js` — counts strip, status filter narrows rows, feed columns, status→badge mapping, empty state. Follow `MemoryStatus_spec.js` / `LogsPage_spec.js` / `LogsHelper_spec.js`.
- `spec/components/Extractions_spec.js` + `spec/components/ExtractionsHelper_spec.js` — join by `extractionId`, `emitsSent` and `{success,failed,dead}` breakdown, `partial` hint, `originUrl == null` renders `—`, empty state.
- Controller specs if the repo has them for the templates (`spec/components/controllers/LogsController_spec.js` exists) — add `EmissionsController` / `ExtractionsController` polling + join specs in the same place.

Run `yarn test` and `yarn lint` in `frontend/`.

## Docs

- `docs/agents/frontend.md` — add `/emissions` and `/extractions` to the routing table; add `Emissions` / `Extractions` (and their controllers/helpers) to the source-layout tree and the component hierarchy; add `EmissionsClient.js` / `ExtractionsClient.js` to the clients list; note `StatsHeader` now shows an Emissions group.

## Build check

- Run `yarn build` in `frontend/` as a smoke check only. Do **not** copy `dist/` into `source/static/` and do not commit build output — CI builds the frontend at release time.

## Files to Change

- `frontend/spec/clients/EmissionsClient_spec.js`, `frontend/spec/clients/ExtractionsClient_spec.js` — new.
- `frontend/spec/clients/StatsClient_spec.js` — extended.
- `frontend/spec/components/StatsHeader_spec.js` (+ optional `StatsDisplay_spec.js`) — Emissions group.
- `frontend/spec/components/Emissions_spec.js`, `EmissionsHelper_spec.js` — new.
- `frontend/spec/components/Extractions_spec.js`, `ExtractionsHelper_spec.js` — new.
- `frontend/spec/components/controllers/EmissionsController_spec.js`, `ExtractionsController_spec.js` — new (if controller specs are used for the templates).
- `docs/agents/frontend.md` — routing table, layout tree, hierarchy, clients list.
