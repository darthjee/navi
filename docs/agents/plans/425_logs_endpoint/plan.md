# Plan: Logs Endpoint

## Overview

Add a `GET /logs.json` endpoint that returns paginated log entries from `BufferedLogger`, with optional `?last_id=<id>` filtering to support incremental polling. Page size is configurable via the YAML `web:` key.

## Context

`BufferedLogger` already stores log entries via `LogBuffer` and exposes `getLogs()` (chronological, oldest first) and `getLogById(id)`. `Log#toJSON()` provides the serialization format. The web server follows a consistent `RequestHandler` → `Router` → `RouteRegister` pattern for adding routes.

## Implementation Steps

### Step 1 — Add `logs_page_size` to `WebConfig`

Add a `logsPageSize` field to `source/lib/models/WebConfig.js`, defaulting to `20`. Parse it from the `logs_page_size` key under `web:` in `source/lib/services/ConfigParser.js`.

### Step 2 — Create `LogsRequestHandler`

Create `source/lib/server/LogsRequestHandler.js` (extends `RequestHandler`). Its `handle(req, res)` method:

1. Reads all logs via `BufferedLogger#getLogs()` (chronological order, oldest first)
2. If `req.query.last_id` is present:
   - Find the index of the log with `id === last_id` (parsed as integer)
   - Slice from `index + 1` to get only newer logs
   - If the log is not found, return an empty array
3. Apply page size: take the first `page_size` entries from the resulting list
4. Respond with the serialized array using `log.toJSON()` for each entry

The handler needs access to both `BufferedLogger` (for logs) and `WebConfig` (for `logsPageSize`). These should be injected at construction time, consistent with how other handlers receive dependencies.

### Step 3 — Register `GET /logs.json` in `Router`

Add `'/logs.json': LogsRequestHandler` to the GET routes map in `source/lib/server/Router.js`. Pass the required dependencies (`bufferedLogger`, `webConfig`) when constructing the handler instance.

### Step 4 — Update specs

- `source/spec/lib/models/WebConfig_spec.js` — cover `logsPageSize` default and custom value
- `source/spec/lib/services/ConfigParser_spec.js` — cover parsing `logs_page_size` from YAML
- `source/spec/lib/server/LogsRequestHandler_spec.js` — new spec covering:
  - Returns all logs (up to page size) when no `last_id`
  - Returns only newer logs when `last_id` is given
  - Returns empty array when `last_id` is not found
  - Respects page size limit
- `source/spec/lib/server/Router_spec.js` — cover the new route registration

## Files to Change

- `source/lib/models/WebConfig.js` — add `logsPageSize` field (default 20)
- `source/lib/services/ConfigParser.js` — parse `logs_page_size` from YAML
- `source/lib/server/LogsRequestHandler.js` — new handler
- `source/lib/server/Router.js` — register `GET /logs.json`
- `source/spec/lib/models/WebConfig_spec.js` — updated
- `source/spec/lib/services/ConfigParser_spec.js` — updated
- `source/spec/lib/server/LogsRequestHandler_spec.js` — new
- `source/spec/lib/server/Router_spec.js` — updated

## Notes

- Open question: how does `LogsRequestHandler` access `BufferedLogger`? The existing handlers access global singletons (`JobRegistry`, `WorkersRegistry`, `Application`). Check whether `Logger` (the singleton) exposes `BufferedLogger`, or if a new injection mechanism is needed.
- `last_id` should be parsed as an integer since `Log#id` is an incremental integer, not a UUID.
