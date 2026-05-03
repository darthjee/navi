# Issue: Store Logs Into Split Queues

## Description

Currently, `LogRegistry` holds a single `LogBuffer` (the default). Logs sent with `workerId`/`jobId` attributes (introduced in issue #478) land in that one buffer, making it impossible to retrieve logs scoped to a specific job or worker without a full scan and filter.

The goal is to make `LogRegistry` maintain multiple `LogBuffer` instances:

1. **Default buffer** — receives every log entry, regardless of attributes.
2. **Per-job buffer collection** — one `LogBuffer` per `jobId`, managed by a dedicated class.
3. **Per-worker buffer collection** — one `LogBuffer` per `workerId`, managed by a dedicated class.

When a log with `{ jobId, workerId }` attributes arrives, it is sent to all three relevant buffers (default + per-job + per-worker) using **the same log instance** to avoid duplicating memory.

## Problem

- All logs share a single flat buffer; filtering by job or worker requires scanning the entire log history.
- The `/logs` API cannot scope results to a specific job or worker without a custom filtering layer.
- Memory usage grows proportionally with the number of logs when attributes are repeated.
- There is no lifecycle event system — components that need to react to engine state changes (stop, start, reset) must be wired manually.

## Expected Behavior

- When a log is dispatched without `jobId`/`workerId`, it lands only in the default buffer.
- When a log carries a `jobId`, it is also stored in that job's dedicated `LogBuffer` (creating it on first use).
- When a log carries a `workerId`, it is also stored in that worker's dedicated `LogBuffer` (creating it on first use).
- A request to `/logs` with no parameters returns logs from the default buffer.
- A request with `?jobId=<id>` returns logs from the per-job buffer for that ID.
- A request with `?workerId=<id>` returns logs from the per-worker buffer for that ID.
- A single request will never combine both `jobId` and `workerId` parameters.
- Each per-job and per-worker buffer respects the configured log retention limit (same as the default buffer).
- The same `Log` instance is shared across buffers — no duplication of the log object itself.
- When the engine emits a `stop` event, the per-job and per-worker buffer collections are cleared automatically.

## Solution

### Introduce a `LogBufferCollection` class

Instead of a plain `Map`, introduce a dedicated class (e.g. `LogBufferCollection`) that encapsulates a keyed set of `LogBuffer` instances. It exposes:

- `push(key, log)` — lazily creates a buffer for `key` on first use, then appends the log.
- `getLogs(key)` — returns the logs for a given key (or an empty array if no buffer exists).
- `clear()` — removes all per-key buffers (called on stop).

This class will be the **first consumer of the engine lifecycle event system**.

### Introduce an engine event system

Introduce a lightweight event emitter (e.g. `EngineEvents`) that the `Engine` (or `Application`) fires when state transitions happen: `stop`, `start`, `restart`, `reset`, etc.

`LogBufferCollection` registers a listener on the `stop` event and calls `clear()` when it fires. This decouples buffer cleanup from the engine internals and makes the pattern reusable for future subscribers.

### Extend `LogRegistryInstance`

- Hold a default `LogBuffer` (existing behaviour, unchanged).
- Hold one `LogBufferCollection` for job IDs and one for worker IDs.
- When dispatching a log that carries `jobId`, also push to the job collection.
- When dispatching a log that carries `workerId`, also push to the worker collection.
- Extend `getLogs` / `getLogsJSON` to accept an optional `jobId` or `workerId` parameter and route to the appropriate collection.

## Benefits

- Enables a future `/logs?jobId=<id>` endpoint to return only logs for a specific job run without any in-memory filtering pass.
- Same for per-worker log retrieval.
- Memory-efficient: shared `Log` instances mean no data duplication across buffers.
- The event system decouples lifecycle-aware components: `LogBufferCollection` is the first, but future classes can subscribe the same way.
- Scales naturally — new buffers are created on demand, old ones are cleared on `stop`.

---
See issue for details: https://github.com/darthjee/navi/issues/428
