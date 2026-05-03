# Plan: Store Logs Into Split Queues

## Overview

Extend the logging subsystem so that every log entry carrying `workerId` or `jobId` attributes is also stored in dedicated per-worker and per-job `LogBuffer` instances, alongside the existing default buffer. Introduce a lightweight engine event system so that those per-key buffers are automatically cleared when the engine stops. Extend the `LogRegistry` API and the `LogsRequestHandler` to allow callers to query logs scoped to a specific job or worker.

## Context

Issue #478 added `LogContext`, which tags every log emitted during job execution with `{ workerId, jobId }`. Those attributes are stored on each `Log` entry but all logs still flow into a single default `LogBuffer`. Querying by job or worker currently requires a full scan and client-side filter.

This issue replaces the flat structure with three parallel buffers:
1. **Default** — receives every log, unchanged behaviour.
2. **Per-job collection** — one `LogBuffer` per `jobId`, created on first use.
3. **Per-worker collection** — one `LogBuffer` per `workerId`, created on first use.

The same `Log` instance is shared across all applicable buffers to avoid memory duplication. Per-key buffers must be cleared when the engine stops so stale entries do not accumulate across runs.

## Implementation Steps

### Step 1 — Introduce `EngineEvents`

Create `source/lib/services/EngineEvents.js`.

A thin singleton wrapper around Node's built-in `EventEmitter`. Exposes:
- `EngineEvents.emit(eventName)` — fires a named event.
- `EngineEvents.on(eventName, handler)` — registers a listener.
- `EngineEvents.reset()` — removes all listeners (test teardown).

Named events to support from the start: `'stop'`, `'start'`, `'restart'`, `'reset'`.

`ApplicationInstance` calls `EngineEvents.emit('stop')` (and the other events) at the appropriate lifecycle transitions.

Add a spec at `source/spec/lib/services/EngineEvents_spec.js`.

### Step 2 — Introduce `LogBufferCollection`

Create `source/lib/utils/logging/LogBufferCollection.js`.

Manages a keyed map of `LogBuffer` instances. Constructor accepts `retention` (the same size limit used by the default buffer). Exposes:

```js
push(key, log)     // lazily creates a LogBuffer for key, then appends log
getLogs(key)       // returns logs array for key, or [] when key is unknown
clear()            // removes all per-key buffers
```

In its constructor, registers a listener on `EngineEvents.on('stop', () => this.clear())` so buffers are wiped automatically when the engine stops.

Add a spec at `source/spec/lib/utils/logging/LogBufferCollection_spec.js`.

### Step 3 — Extend `LogRegistryInstance` to hold two `LogBufferCollection` instances

`LogRegistryInstance` currently holds a `BufferedLogger` (which wraps a single `LogBuffer`) and a `ConsoleLogger`, both inside a `LoggerGroup`.

Extend it to also hold:
- `#jobLogs` — a `LogBufferCollection` keyed by job ID.
- `#workerLogs` — a `LogBufferCollection` keyed by worker ID.

When any log method (`debug`, `info`, `warn`, `error`) is called with attributes containing `jobId` and/or `workerId`, after fanning out to the existing `LoggerGroup`, also push the resulting `Log` instance to the corresponding collection(s).

> The `Log` instance is already created by `LogFactory` inside `BufferedLogger`; it must be made accessible so the same object can be pushed to the side collections without re-creating it. This may require a small refactor of `BufferedLogger` or `LogRegistryInstance` to capture the created `Log` before or during dispatch.

Add new query methods:
- `getLogsByJobId(jobId)` — delegates to `#jobLogs.getLogs(jobId)`.
- `getLogsByWorkerId(workerId)` — delegates to `#workerLogs.getLogs(workerId)`.

### Step 4 — Extend `LogRegistry` facade

Expose the new queries on the static facade:
- `LogRegistry.getLogsByJobId(jobId)`
- `LogRegistry.getLogsByWorkerId(workerId)`

### Step 5 — Extend `LogsRequestHandler`

Update `source/lib/server/LogsRequestHandler.js` to read optional `jobId` / `workerId` query parameters and route to the appropriate collection:

- No params → `LogRegistry.getLogs()`
- `?jobId=<id>` → `LogRegistry.getLogsByJobId(id)`
- `?workerId=<id>` → `LogRegistry.getLogsByWorkerId(id)`

A single request will never combine both parameters.

### Step 6 — Update specs

- `LogRegistryInstance_spec.js` / `LogRegistry_spec.js` — verify per-job and per-worker routing, and that the default buffer is always populated.
- `LogsRequestHandler_spec.js` — verify the three routing branches.
- `ApplicationInstance_spec.js` (or integration) — verify that `EngineEvents.emit('stop')` is called on engine stop and that `LogBufferCollection.clear()` fires in response.

## Files to Change

- `source/lib/services/EngineEvents.js` — **new** — singleton event emitter for engine lifecycle events
- `source/spec/lib/services/EngineEvents_spec.js` — **new** — unit tests for `EngineEvents`
- `source/lib/utils/logging/LogBufferCollection.js` — **new** — keyed collection of `LogBuffer` instances with auto-clear on stop
- `source/spec/lib/utils/logging/LogBufferCollection_spec.js` — **new** — unit tests for `LogBufferCollection`
- `source/lib/services/ApplicationInstance.js` — emit `EngineEvents` events at lifecycle transitions
- `source/lib/registry/LogRegistryInstance.js` — hold two `LogBufferCollection` instances; push to them on log dispatch; expose `getLogsByJobId` / `getLogsByWorkerId`
- `source/lib/registry/LogRegistry.js` — expose `getLogsByJobId` / `getLogsByWorkerId` on the static facade
- `source/lib/server/LogsRequestHandler.js` — route by `jobId` / `workerId` query params
- Specs for all changed files

## Notes

- The same `Log` instance must be shared across buffers. The current architecture creates `Log` objects inside `BufferedLogger._output()`. Sharing may require `BufferedLogger` to return the created `Log`, or `LogRegistryInstance` to intercept the creation. This is the main design risk and should be resolved early (Step 3).
- `EngineEvents.reset()` must be called in test `afterEach` blocks to prevent listener leaks between specs.
- Per-job and per-worker buffers respect the same `retention` limit configured for the default buffer.
- A request will never query for both `jobId` and `workerId` simultaneously — the handler should return an error (400) if both are present.
- Future work: dedicated API endpoints `/logs/job/:id.json` and `/logs/worker/:id.json` can be added on top of this foundation without further structural changes.
