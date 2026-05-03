# Plan: Add Logs Per Job Endpoint

## Overview

Add a dedicated `GET /jobs/:job_id/logs.json` route that returns log entries scoped to a specific job, with the same `last_id` pagination as the existing `GET /logs.json` endpoint.

## Context

Issue #428 introduced `LogBufferCollection` and per-job log storage in `LogRegistryInstance`. Logs dispatched with a `jobId` attribute are now stored in a dedicated `LogBuffer` keyed by that ID. `LogRegistry.getLogsByJobId(jobId)` already exposes those logs.

This issue adds the REST endpoint that makes per-job logs accessible to callers over HTTP, mirroring the behaviour of the default `/logs.json` endpoint.

## Implementation Steps

### Step 1 — Extend `getLogsByJobId` to support `lastId` filtering

Update `LogRegistryInstance.getLogsByJobId(jobId, { lastId } = {})` to pipe the result through `LogFilter`, matching the pattern already used by `getLogs({ lastId })`. Propagate the change to the `LogRegistry` static facade.

This keeps filtering logic inside the registry layer and out of the handler.

### Step 2 — Create `JobLogsRequestHandler`

Create `source/lib/server/JobLogsRequestHandler.js`.

Extends `RequestHandler`. Reads `req.params.job_id` and the optional `req.query.last_id` query parameter. Delegates to `LogRegistry.getLogsByJobId(jobId, { lastId })`, paginates with `pageSize`, and serializes with `LogSerializer`.

Constructor accepts `{ pageSize = 20 }` to match `LogsRequestHandler`.

### Step 3 — Register the new route in `Router`

Add `'/jobs/:job_id/logs.json'` to the `GET_ROUTES` map in `Router.js`, wired to a new `JobLogsRequestHandler` instance using the same `webConfig.logsPageSize` as `LogsRequestHandler`.

### Step 4 — Add specs

- `source/spec/lib/server/JobLogsRequestHandler_spec.js` — unit tests covering: empty result for unknown job, logs returned for known job, `last_id` filtering, page size limit, and serialization format.
- Update `source/spec/lib/registry/LogRegistryInstance_spec.js` and `LogRegistry_spec.js` to cover the `lastId` parameter on `getLogsByJobId`.

## Files to Change

- `source/lib/registry/LogRegistryInstance.js` — accept `{ lastId }` in `getLogsByJobId`, apply `LogFilter`
- `source/lib/registry/LogRegistry.js` — propagate `{ lastId }` in the static facade
- `source/lib/server/JobLogsRequestHandler.js` — **new** — handler for `GET /jobs/:job_id/logs.json`
- `source/lib/server/Router.js` — register the new route
- `source/spec/lib/server/JobLogsRequestHandler_spec.js` — **new** — unit tests
- `source/spec/lib/registry/LogRegistryInstance_spec.js` — add `lastId` spec for `getLogsByJobId`
- `source/spec/lib/registry/LogRegistry_spec.js` — add `lastId` spec for `getLogsByJobId`

## Notes

- The route `/jobs/:job_id/logs.json` will not conflict with the existing `/jobs/:status.json` because Express distinguishes them by path structure (`:status.json` is a single segment; `:job_id/logs.json` has two segments).
- An unknown `job_id` should return an empty array, not a 404 — consistent with `LogsRequestHandler` returning `[]` for an empty buffer.
- `LogSerializer` is already used by `LogsRequestHandler` and can be reused without changes.
