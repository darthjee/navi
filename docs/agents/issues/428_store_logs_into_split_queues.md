# Issue: Store Logs Into Split Queues

## Description

Currently, `LogRegistry` holds a single `LogBuffer` (the default). Logs sent with `workerId`/`jobId` attributes (introduced in issue #478) land in that one buffer, making it impossible to retrieve logs scoped to a specific job or worker without a full scan and filter.

The goal is to make `LogRegistry` maintain multiple `LogBuffer` instances:

1. **Default buffer** — receives every log entry, regardless of attributes.
2. **Per-job buffers** — one `LogBuffer` per `jobId`; keyed by job ID.
3. **Per-worker buffers** — one `LogBuffer` per `workerId`; keyed by worker ID.

When a log with `{ jobId, workerId }` attributes arrives, it is sent to all three relevant buffers (default + per-job + per-worker) using **the same log instance** to avoid duplicating memory.

## Problem

- All logs share a single flat buffer; filtering by job or worker requires scanning the entire log history.
- The `/logs` API cannot scope results to a specific job or worker without a custom filtering layer.
- Memory usage grows proportionally with the number of logs when attributes are repeated.

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

## Solution

- Extend `LogRegistryInstance` (or `LogRegistry`) to hold:
  - A default `LogBuffer`
  - A `Map` of `LogBuffer` instances keyed by job ID
  - A `Map` of `LogBuffer` instances keyed by worker ID
- When dispatching a log entry that carries `jobId` / `workerId` attributes, also push it to the corresponding per-job / per-worker buffer, creating it if absent.
- Extend the `getLogs` / `getLogsJSON` API to accept optional `jobId` or `workerId` parameters and route to the appropriate buffer.
- When the engine stops and queues are cleared, remove the per-job and per-worker buffer maps (or clear them) so stale entries do not accumulate.

## Benefits

- Enables a future `/logs?jobId=<id>` endpoint to return only logs for a specific job run without any in-memory filtering pass.
- Same for per-worker log retrieval.
- Memory-efficient: shared `Log` instances mean no data duplication across buffers.
- Scales naturally — new buffers are created on demand, old ones are cleared on reset.

---
See issue for details: https://github.com/darthjee/navi/issues/428
