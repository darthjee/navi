# Plan: Logs Endpoint

## Overview

Add a `GET /logs.json` endpoint that returns paginated log entries from `BufferedLogger`, with optional `?last_id=<id>` filtering to support incremental polling. Page size is configurable via the YAML `web:` key.

## Context

`BufferedLogger` already stores log entries via `LogBuffer` and exposes `getLogs()` (chronological, oldest first) and `getLogById(id)`. `Log#toJSON()` provides the serialization format. The web server follows a consistent `RequestHandler` → `Router` → `RouteRegister` pattern for adding routes.

## Implementation Steps

### Step 1 — Create `LogRegistry`

Create `source/lib/registry/LogRegistry.js` — a static singleton facade following the same pattern as `JobRegistry` and `WorkersRegistry`:

- `LogRegistry.build(options)` — creates and stores a `BufferedLogger` instance (using `options.retention` and `options.level`)
- `LogRegistry.reset()` — clears the singleton (for tests)
- Static delegates: `getLogs()`, `getLogById(id)`, `getLogsByLevel(level)`, `getLogsJSON()`

Create `source/lib/registry/LogRegistryInstance.js` to hold the actual `BufferedLogger` instance (not exported directly; accessed only via `LogRegistry`).

### Step 2 — Wire `Logger` to use `LogRegistry`

Update `source/lib/utils/logging/Logger.js` so that when it initializes its `BufferedLogger`, it uses the instance provided by `LogRegistry` instead of creating one independently.

### Step 3 — Add `logs_page_size` to `WebConfig`

Add a `logsPageSize` field to `source/lib/models/WebConfig.js`, defaulting to `20`. Parse it from the `logs_page_size` key under `web:` in `source/lib/services/ConfigParser.js`.

### Step 4 — Create `LogsRequestHandler`

Create `source/lib/server/LogsRequestHandler.js` (extends `RequestHandler`). Its `handle(req, res)` method:

1. Reads all logs via `LogRegistry.getLogs()` (chronological order, oldest first)
2. If `req.query.last_id` is present:
   - Find the index of the log with `id === parseInt(last_id)`
   - Slice from `index + 1` to get only newer logs
   - If the log is not found, return an empty array
3. Apply page size: take the first `page_size` entries (from `WebConfig.logsPageSize`)
4. Respond with the serialized array using `log.toJSON()` for each entry

### Step 5 — Register `GET /logs.json` in `Router`

Add `'/logs.json': LogsRequestHandler` to the GET routes map in `source/lib/server/Router.js`.

### Step 6 — Update specs

- `source/spec/lib/registry/LogRegistry_spec.js` — new spec for the static facade
- `source/spec/lib/registry/LogRegistryInstance_spec.js` — new spec for the instance
- `source/spec/lib/models/WebConfig_spec.js` — cover `logsPageSize` default and custom value
- `source/spec/lib/services/ConfigParser_spec.js` — cover parsing `logs_page_size` from YAML
- `source/spec/lib/server/LogsRequestHandler_spec.js` — new spec covering: all logs, `last_id` filtering, not-found case, page size limit
- `source/spec/lib/server/Router_spec.js` — cover the new route registration

## Files to Change

- `source/lib/registry/LogRegistry.js` — new static facade
- `source/lib/registry/LogRegistryInstance.js` — new instance holder
- `source/lib/utils/logging/Logger.js` — use `LogRegistry`'s `BufferedLogger`
- `source/lib/models/WebConfig.js` — add `logsPageSize` field (default 20)
- `source/lib/services/ConfigParser.js` — parse `logs_page_size` from YAML
- `source/lib/server/LogsRequestHandler.js` — new handler
- `source/lib/server/Router.js` — register `GET /logs.json`
- `source/spec/lib/registry/LogRegistry_spec.js` — new
- `source/spec/lib/registry/LogRegistryInstance_spec.js` — new
- `source/spec/lib/models/WebConfig_spec.js` — updated
- `source/spec/lib/services/ConfigParser_spec.js` — updated
- `source/spec/lib/server/LogsRequestHandler_spec.js` — new
- `source/spec/lib/server/Router_spec.js` — updated

## Notes

- `last_id` must be parsed as an integer since `Log#id` is an incremental integer, not a UUID.
- `LogRegistry` follows the exact same singleton pattern as `JobRegistry` and `WorkersRegistry` — `build()` once at bootstrap, `reset()` in tests.
