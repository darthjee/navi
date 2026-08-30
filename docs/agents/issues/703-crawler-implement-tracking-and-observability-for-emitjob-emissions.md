# Issue: Crawler: implement tracking and observability for EmitJob emissions

## Description

Part of #699 (Next Steps for Crawler Implementation), Step 4. This was objective 6 in the original crawler overview (`docs/agents/future/crawler/overview.md`), cut during initial implementation.

Add tracking and observability for the crawler's extraction/emission activity so operators can see how many items were extracted, how many were successfully emitted, and which emits failed — including per-emission detail for diagnosing failures — and expose it over HTTP for the monitoring dashboard.

Related work already merged:
- #741 — EmitJob retry policy (`DEFAULT_MAX_RETRIES = 5`, non-retryable 4xx force immediate dead, 429 `Retry-After` honoured).
- #743 — per-emit custom headers / auth (`emit.headers`).
- #698 — memory data store: landed `MemoryData` / `MemoryDataFactory` / `MemoryDataStore` in `source/lib/utils/memory/`, a ring buffer mirroring `LogBuffer`. This issue reuses that same ring-buffer pattern (and the `LogRegistry` static-facade pattern for wiring).

Downstream: #699 Step 5 (frontend "Emissions" dashboard view, owner `frontend`) becomes a pure UI task consuming the `GET /emissions.json` endpoint this issue adds.

## Problem

There is no dedicated tracking for `EmitJob` success/failure, nor for extraction volume.

- `EmitJob.perform` returns the HTTP response on success and calls `this._fail(error)` on failure. The only side effects are transient `logContext.debug` / `logContext.error` lines. Nothing is counted or persisted.
- `ExtractionJob` logs `extracted N item(s)` as a debug line only; the count is never aggregated.
- `EmitEnqueuer.enqueue()` has no return value and no count.
- The only job accounting is `deku-swarm`'s aggregate `JobRegistry.stats()` (`enqueued / processing / failed / retryQueue / finished / dead / total`, current collection sizes), surfaced at `GET /stats.json`. There is no per-job-class breakdown, so emit activity is invisible once jobs drain from their collections.
- `/job/:id.json` and `/jobs/:status.json` expose live job instances only — no historical record of a past emission or its failure reason.

## Expected Behavior

- The engine keeps, in memory, both:
  - **Aggregate counters** (monotonic for the life of a run, not bounded by retention): `extracted`, `emitted`, `failed`, `dead`.
  - **A bounded ring buffer of per-emission records** (default retention 100), each holding `{ id, status, url, method, httpStatus, error, itemRef, timestamp }` where `status` is one of `success` / `failed` (a failed attempt that will still be retried) / `dead` (retries exhausted).
- `ExtractionJob` increments `extracted` by the number of items it produced (whether or not they have an `emit` config).
- `EmitJob` adds a record and updates counters on every terminal-or-attempt outcome: `success` on a good response (`emitted`++), `failed` on a retryable error, `dead` when `_attempts` has reached `maxRetries` (`failed`/`dead` counters as appropriate).
- The data is cleared on engine stop, alongside `LogRegistry.clearBuffers()` in `EngineController.on('stop')` (`source/lib/services/engine/EngineController.js:97`).
- `GET /emissions.json` returns `{ counts: { extracted, emitted, failed, dead }, emissions: [ ...records ] }`, newest-`pageSize` records after an optional `?last_id=` cursor (same id-cursor model as `/logs.json`).
- Behaviour is unchanged when the resource has no `parser` / `emit` config — the store simply stays empty.

## Solution

Reuse the `LogBuffer` / `MemoryDataStore` ring-buffer pattern and the `LogRegistry` static-facade wiring pattern. No new top-level folder.

### New classes (`source/lib/utils/emissions/`, mirroring `source/lib/utils/memory/`)

1. `EmissionRecord.js` — value object, positional ctor, `#timestamp = new Date()`; getters + `toJSON()` → `{ id, status, url, method, httpStatus, error, itemRef, timestamp: ISOString }`.
2. `EmissionRecordFactory.js` — `constructor({ idGenerator = new IncrementalIdGenerator() } = {})`; `build({ status, url, method, httpStatus, error, itemRef })`.
3. `EmissionStore.js` — ring buffer mirroring `MemoryDataStore` (`add`, `getEntries`, `getEntryById`, `clear`, `get size`, `get retention`, `toJSON`) **plus** monotonic counters `extracted` / `emitted` / `failed` / `dead` with `incExtracted(n)` / `recordEmission({...})` helpers and a `counts` getter; `clear()` also zeroes the counters.

### Registry (`source/lib/registry/`, mirroring `LogRegistry` / `LogRegistryInstance`)

4. `EmissionRegistry.js` + `EmissionRegistryInstance.js` — static facade over one `EmissionStore`. `EmissionRegistry.build({ retention })` called from `source/lib/services/application/ApplicationConfigurator.js` next to `LogRegistry.build(...)`. Test-resettable.

### Wiring

5. `ExtractionJob.perform` — after `parserImpl.extract(...)`, `EmissionRegistry.incExtracted(items.length)`.
6. `EmitJob.perform` — on success `EmissionRegistry.recordEmission({ status: 'success', ... })`; in `catch`, derive `status` from `this._attempts` vs `this.maxRetries` (`dead` when exhausted, else `failed`) and record before `this._fail(error)`. `url`/`method` from the already-resolved values (cf. `get arguments()`); `itemRef` a compact identifier for the emitted item (not the full payload).
7. `EngineController` — add `EmissionRegistry.clear()` to the existing `engine.on('stop')` handler.

### Config

8. New top-level `emit:` block → `source/lib/models/configs/EmitConfig.js` with `size` (default 100, positive-integer validation following `LogConfig`). Parsed in `source/lib/services/config/ConfigParser.js`, held on `source/lib/models/configs/Config.js` as `emitConfig`; `ApplicationConfigurator` passes `config.emitConfig.size` as `retention`.

### Endpoint

9. `source/lib/server/handlers/emissions/EmissionsHandler.js` (extends `source/lib/common/server/RequestHandler.js`) — reads `EmissionRegistry` statically, `?last_id=` filtering via `source/lib/common/utils/logging/LogFilter.js`, page size from `WebConfig.logsPageSize` (or a dedicated `web.emissions_page_size` if the plan prefers). Route `GET /emissions.json` added to `GET_ROUTES` in `source/lib/server/Router.js`.
10. `source/lib/serializers/EmissionSerializer.js` alongside `LogSerializer.js`; response envelope `{ counts, emissions }`.
11. Optionally fold `counts` into `GET /stats.json` under a new `emissions` key (`StatsHandler`).

### Tests & docs

12. Jasmine specs with full diff coverage — one per new class, plus updated `EmitJob` / `ExtractionJob` / `ConfigParser` / `Router` specs and a handler spec.
13. Update `docs/agents/web-server.md` (new route + `emit.size` config) and `docs/agents/future/crawler/decisions.md` / `overview.md` (objective 6 now implemented). User-facing README stays with #699 Step 7.

Owner: `engine` specialist. Coordinate with `frontend` for #699 Step 5.

## Benefits

- Operators see extraction/emission throughput and failures directly instead of grepping debug logs.
- Per-emission records (URL, method, HTTP status, error, item ref) make external-endpoint failures diagnosable after the fact.
- `GET /emissions.json` gives the frontend Step 5 "Emissions" view a ready data source, reducing it to pure UI work.
- Reuses the `LogBuffer` / `MemoryDataStore` ring buffer and the `LogRegistry` static facade — consistent retention/clear semantics, no parallel mechanism.
- Delivers crawler objective 6, closing a gap left from the initial implementation.
