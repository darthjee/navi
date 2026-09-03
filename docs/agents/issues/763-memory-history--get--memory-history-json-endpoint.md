# Issue: Memory history: GET /memory/history.json endpoint

## Description
Part of #761 (temporal memory-usage graph on `/#/memory/status`).

The backend sampling-buffer sub-issue (#762, already merged) added a
process-wide `MemoryRegistry` (static-facade + instance, wrapping
`MemoryDataStore`) that is continuously fed process-RSS readings while the
web server runs, with `getEntries({ lastId })` already filtering via
`LogFilter`.

This sub-issue exposes that buffer over HTTP as a paginated endpoint,
mirroring `/emissions.json` / `/logs.json`, for the frontend graph to poll.

## Expected Behavior
- [ ] `web.memory.data_store.page_size` parses (default 20) as
      `memoryConfig.dataStorePageSize`.
- [ ] `GET /memory/history.json` returns a bare JSON array of
      `{ id, value, percentage, timestamp }`, oldest-first, capped at
      `page_size`.
- [ ] `GET /memory/history.json?last_id=<id>` returns only entries newer than
      `<id>` (empty array for an unknown id).
- [ ] `MemoryDataSerializer` mirrors `LogSerializer`.
- [ ] The route is registered in `Router` and `/memory/status.json` still
      works.
- [ ] Specs cover: handler (payload, cap, pagination), serializer, Router
      registration.

## Solution

**Config — already done**
- `source/lib/models/configs/MemoryConfig.js` already has a `page_size` field
  in the `data_store` block (default `20`), exposed as
  `memoryConfig.dataStorePageSize`, landed as part of #762. It merges the
  whole `data_store` block once (`{ ...DEFAULT_DATA_STORE, ...dataStore }`)
  rather than per-field — no code change needed here. No new work in this
  sub-issue.

**Handler**
- New `source/lib/server/handlers/memory/MemoryHistoryHandler.js`. Copy the
  constructor/plumbing pattern from
  `source/lib/server/handlers/emissions/EmissionsHandler.js`:
  `extends RequestHandler`; constructor `(request, response, pageSize)` with
  private fields.
  - `handle()`: read `const { last_id: lastId } = this.#request.query;`,
    call `MemoryRegistry.getEntries({ lastId })` (already oldest-first),
    `.slice(0, this.#pageSize)`, pass through
    `MemoryDataSerializer.serialize(...)`, and `this.#response.json(...)`.
  - Response is a **bare serialized array**, matching `LogsHandler.js`'s
    response shape (not `EmissionsHandler.js`, which wraps its array in
    `{ counts, emissions }`) — `{ id, value, percentage, timestamp }` with
    `timestamp` as an ISO string. `maximum` is intentionally NOT included —
    the frontend already has it from its `/memory/status.json` poll.

**Serializer**
- New `source/lib/serializers/MemoryDataSerializer.js` — `extends
  Serializer`, implement `static _serializeObject(entry)` returning
  `{ id: entry.id, value: entry.value, percentage: entry.percentage,
  timestamp: entry.timestamp.toISOString() }`, reading straight off the raw
  `MemoryData` object (`entry.timestamp` is a `Date`, hence
  `.toISOString()`) rather than via `MemoryData.toJSON()`. Mirrors
  `source/lib/serializers/LogSerializer.js` (~7 lines).

**Route**
- Register in `source/lib/server/Router.js` `GET_ROUTES`:
  `'/memory/history.json': new HandlerConfig(MemoryHistoryHandler,
  this.#webConfig.memory?.dataStorePageSize),` — **note the `?.`**: `memory`
  itself is already read unguarded on the `/memory/status.json` route
  (`this.#webConfig.memory`), but chaining a further property
  (`.dataStorePageSize`) off it is evaluated eagerly in the `GET_ROUTES`
  object literal at `build()` time, and `Router` defaults `webConfig` to
  `{}`. Without the `?.`, this throws a `TypeError` immediately (confirmed
  by `Router_spec.js` constructing `new Router()` with no args). Add the
  `MemoryHistoryHandler` import next to the existing `MemoryStatusHandler`
  import (~line 26). Leave the existing `/memory/status.json` route
  untouched.

**Specs**
- `source/spec/lib/server/handlers/memory/MemoryHistoryHandler_spec.js`,
  copying `LogsHandler_spec.js` / `EmissionsHandler_spec.js`: build a real
  `MemoryRegistry` in `beforeEach`, push entries, `reset()` in `afterEach`;
  assert the serialized payload, the `page_size` cap, and `?last_id=`
  returning only newer entries.
- `source/spec/lib/serializers/MemoryDataSerializer_spec.js` (copy
  `LogSerializer_spec.js`).
- Extend `source/spec/lib/server/Router_spec.js` to assert the `GET
  /memory/history.json` route registers (walk the express stack like the
  existing `/memory/status.json` assertion). With the `?.` guard above, this
  works against the existing `new Router()` (no args) construction without
  any extra `webConfig` setup — add a case with a populated
  `webConfig: { memory: { dataStorePageSize } }` too, to prove the value is
  actually threaded through.

**Out of scope**
- The sampler / `MemoryRegistry` itself (implemented in #762 — this issue
  depends on it).
- Frontend consumption.
- Including `maximum` or status thresholds in the response.

**Dependencies**
- Depends on #762 (`MemoryRegistry` + `getEntries({ lastId })`), already
  merged. Owns the `/memory/history.json` response-shape contract the
  frontend client sub-issue builds against.
