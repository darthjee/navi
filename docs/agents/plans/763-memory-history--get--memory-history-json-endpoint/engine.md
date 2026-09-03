# Engine Plan: Memory history: GET /memory/history.json endpoint

Main plan: [plan.md](plan.md)

## Overview

Add a new `MemoryHistoryHandler` + `MemoryDataSerializer` pair, registered as
`GET /memory/history.json` in `Router.js`, serving `MemoryRegistry`'s buffer
(already built and merged in #762) as a bare, oldest-first, paginated JSON
array — mirroring the existing `/logs.json` handler/serializer/route shape.

## Context

- `MemoryRegistry` (`source/lib/registry/MemoryRegistry.js`, static facade
  over `MemoryRegistryInstance.js`) already exists and is fed process-RSS
  readings continuously while the web server runs. `getEntries({ lastId })`
  already returns entries oldest-first, filtered via `LogFilter`
  (`source/lib/utils/logging/LogFilter.js`) — no changes needed there.
- `memoryConfig.dataStorePageSize` (default `20`) already exists in
  `source/lib/models/configs/MemoryConfig.js` (landed as part of #762) — no
  config work is needed in this plan.
- `MemoryData` (`source/lib/utils/memory/MemoryData.js`) exposes `.id`,
  `.value`, `.percentage`, and a `.timestamp` getter returning a `Date`.

## Steps

- [01 — Add MemoryDataSerializer](engine/01-add-memory-data-serializer.md)
- [02 — Add MemoryHistoryHandler](engine/02-add-memory-history-handler.md)
- [03 — Register the route in Router](engine/03-register-route.md)
- [04 — Extend Router_spec for the new route](engine/04-extend-router-spec.md)

## Files to Change

- `source/lib/serializers/MemoryDataSerializer.js` — new serializer.
- `source/spec/lib/serializers/MemoryDataSerializer_spec.js` — new spec.
- `source/lib/server/handlers/memory/MemoryHistoryHandler.js` — new handler.
- `source/spec/lib/server/handlers/memory/MemoryHistoryHandler_spec.js` — new spec.
- `source/lib/server/Router.js` — import + register the new route.
- `source/spec/lib/server/Router_spec.js` — assert the route registers.

## CI Checks

- `source`: `npm test` (CI job: `test` / `jasmine`) — runs `npx c8 jasmine spec/**/*.js`.
- `source`: `npm run lint` (CI job: `checks`) — runs `eslint lib spec`.

## Notes

- **Response shape**: the bare-array response mirrors `LogsHandler.js`
  (`source/lib/server/handlers/LogsHandler.js`), not `EmissionsHandler.js`
  (which wraps its array in `{ counts, emissions }`). Only the
  constructor/plumbing pattern — `extends RequestHandler`, constructor
  `(request, response, pageSize)` with private fields — is copied from
  `EmissionsHandler.js`.
- **Router bug to avoid**: `Router` defaults `webConfig` to `{}`, and
  `Router_spec.js` constructs `new Router()` with no args. Registering the
  route with `this.#webConfig.memory.dataStorePageSize` (no optional
  chaining) throws a `TypeError` immediately at `build()` time, since that
  property access is evaluated eagerly inside the `GET_ROUTES` object
  literal. Use `this.#webConfig.memory?.dataStorePageSize` instead — see
  step 03.
- `maximum` is intentionally NOT included in the response — the frontend
  already has it from its `/memory/status.json` poll.
- Frontend consumption of this endpoint is out of scope for this plan (a
  separate sub-issue of #761).
