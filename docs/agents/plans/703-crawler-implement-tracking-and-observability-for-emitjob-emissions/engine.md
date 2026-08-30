# Engine Plan: Crawler: implement tracking and observability for EmitJob emissions

Main plan: [plan.md](plan.md)

## Overview

Build the emission-tracking mechanism as a set of small DI-friendly classes mirroring
`source/lib/utils/memory/` (from #698) and `source/lib/registry/LogRegistry*` — then wire
the crawler jobs to it, expose it over HTTP, and clear it on engine stop.

New module: `source/lib/utils/emissions/` (`EmissionRecord`, `EmissionRecordFactory`,
`EmissionStore`). New registry: `source/lib/registry/EmissionRegistry.js` +
`EmissionRegistryInstance.js`. New config: `source/lib/models/configs/EmitConfig.js`
(top-level `emit.size`, default 100). New endpoint: `GET /emissions.json` via
`source/lib/server/handlers/emissions/EmissionsHandler.js` +
`source/lib/serializers/EmissionSerializer.js`.

## Context

- `EmitJob.perform` (`source/lib/jobs/EmitJob.js`) returns the HTTP response on success and
  calls `this._fail(error)` in its `catch`; nothing is counted or persisted. Its retry
  policy (#741) exposes `get maxRetries()` (returns `this._attempts` to force death on a
  non-retryable 4xx) and `this._attempts` / `this.lastError`.
- `ExtractionJob.perform` (`source/lib/jobs/ExtractionJob.js`) logs `extracted N item(s)`
  via `logContext.debug` and hands items to `EmitEnqueuer`. The count is never aggregated.
- `#698` landed `MemoryData` / `MemoryDataFactory` / `MemoryDataStore` in
  `source/lib/utils/memory/` — a ring buffer (`unshift` + `pop` past `retention`,
  `getEntries()` oldest-first, `getEntryById`, `clear`, `get size`, `get retention`,
  `toJSON`) with an injected `IncrementalIdGenerator`
  (`source/lib/utils/generators/IncrementalIdGenerator.js`). Not yet consumed anywhere.
- `LogRegistry` / `LogRegistryInstance` is the static-facade precedent: `build({ retention })`
  called once from `ApplicationConfigurator.load()`, `reset()` for tests, `#getInstance()`
  throws if unbuilt. `LogConfig` (`log.size`, default 100) feeds its retention through
  `ConfigParser.#logConfig()` → `Config.logConfig` → `ApplicationConfigurator`.
- `EngineController.bind()` (`source/lib/services/engine/EngineController.js:97`) wires
  `this.engine.on('stop', () => LogRegistry.clearBuffers())`.
- `GET /logs.json` (`LogsHandler` + `LogSerializer`, registered in
  `source/lib/server/Router.js`) is the endpoint precedent: `?last_id=` cursor via
  `source/lib/common/utils/logging/LogFilter.js`, `.slice(0, pageSize)`, page size threaded
  from `webConfig.logsPageSize`. `GET /stats.json` (`StatsHandler`) returns
  `{ jobs, workers }`.

## Steps

- [01 — EmissionRecord and EmissionRecordFactory](engine/01-emission-record-and-factory.md)
- [02 — EmissionStore ring buffer + counters](engine/02-emission-store.md)
- [03 — EmissionRegistry static facade + bootstrap](engine/03-emission-registry.md)
- [04 — EmitConfig (top-level `emit.size`)](engine/04-emit-config.md)
- [05 — Wire ExtractionJob and EmitJob to record](engine/05-job-wiring.md)
- [06 — Clear the store on engine stop](engine/06-engine-stop-clear.md)
- [07 — `GET /emissions.json` endpoint + serializer + stats](engine/07-emissions-endpoint.md)
- [08 — Documentation](engine/08-docs.md)

## CI Checks

Run from `source/` (inside `make tests` container):

- `source/`: `yarn test` (CI job: `jasmine`) — full suite with coverage; the repo expects
  100% diff coverage, so every new class/branch needs a spec.
- `source/`: `yarn lint` (CI job: `checks`) — ESLint (2-space indent, single quotes,
  `===`, JSDoc on all public methods).

## Notes

- **Reuse, don't duplicate.** `EmissionRecord` / `EmissionRecordFactory` / `EmissionStore`
  should mirror the `MemoryData*` trio structurally (positional ctor on the record,
  `{ idGenerator = new IncrementalIdGenerator() } = {}` on the factory, `unshift`+`pop`
  ring buffer). `EmissionStore` additionally carries the four counters — do **not** try to
  derive `emitted`/`failed` by counting ring-buffer entries (the buffer is lossy past
  `retention`; counters must be exact for the life of the run).
- **Recording must never break the core flow.** `EmissionRegistry.incExtracted()` /
  `recordEmission()` (the write helpers only) should no-op when the registry has not been
  built, so existing `EmitJob` / `ExtractionJob` / `EmitEnqueuer` specs that don't build it
  keep passing. `build()` and the read helpers stay strict like `LogRegistry`. Alternative
  considered: add `EmissionRegistry.build({})` / `reset()` to every affected job spec —
  rejected as more invasive and easy to forget.
- **`emit.size` is a new top-level YAML key** (sibling of `resources`, `web`, `log`),
  distinct from the per-resource `resources.*.emit` block — the same way top-level `log:`
  coexists with per-item logging. Call this out in the docs to avoid confusion.
- **`status` values on a record**: `success` (good response), `failed` (a retryable error —
  the job will be retried), `dead` (retries exhausted: `this._attempts >= this.maxRetries`
  in the `catch`). Counter mapping: `success` → `emitted++`; `failed` → `failed++`;
  `dead` → `dead++` (and `failed++` is **not** re-incremented for the terminal attempt —
  decide once and cover it in the spec; the plan's spec expectations assume `failed`
  counts non-terminal retryable failures and `dead` counts terminal ones).
- `itemRef` on a record must be a compact identifier (e.g. a hash or the item's own id
  field if present), never the full extracted payload — the buffer holds up to `retention`
  of these in memory.
- Do not add frontend work here — #699 Step 5 (`frontend`) consumes `GET /emissions.json`
  separately.
- Watch async pitfalls per `docs/agents/dangers.md`: the record write in `EmitJob.perform`
  happens before `this._fail(error)` rethrows; keep it synchronous.
