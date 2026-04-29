# Issue: Logs Endpoint

## Description
Add a `GET /logs.json` endpoint to the web server that returns a paginated list of serialized log entries. Support filtering to fetch only logs newer than a given ID, enabling incremental polling from the frontend.

## Problem
- There is no way to retrieve application logs through the web API
- The frontend cannot display live log output

## Expected Behavior

### Basic request

```
GET /logs.json
```

Returns a JSON array of serialized log entries (up to `page_size` entries, oldest first):

```json
[{
  "id": 1,
  "level": "info",
  "message": "log message",
  "attributes": {},
  "timestamp": "2026-04-29T12:00:00.000Z"
}]
```

The serialization maps directly to `Log#toJSON()`, which exposes `id` (incremental integer), `level`, `message`, `attributes`, and `timestamp` (ISO 8601 string).

### Filtered request

```
GET /logs.json?last_id=<id>
```

Returns only logs **newer** than the given `last_id`, up to `page_size` entries (oldest of the new ones first). Since `BufferedLogger#getLogs()` returns logs in chronological order (oldest first), the handler finds the index of `last_id` in the list and slices from the next position. If more entries exist than `page_size`, the oldest new ones are returned first.

### Pagination

Page size defaults to `20` and is configurable in the YAML config:

```yaml
web:
  port: 3000
  logs_page_size: 30
```

## Solution

- Add `logs_page_size` to `WebConfig` (default: 20), parsed from the `web:` YAML key
- Add a `LogsRequestHandler` in `source/lib/server/` that reads logs via `BufferedLogger#getLogs()`, applies `last_id` filtering (finding the index of the given ID then slicing), and limits results to `page_size`
- Register `GET /logs.json` in `Router`
- Serialize each entry using `Log#toJSON()` directly (no separate serializer needed)

## Benefits
- Enables the frontend to display and poll application logs in real time
- Incremental polling via `last_id` avoids re-fetching already-seen entries

---
See issue for details: https://github.com/darthjee/navi/issues/425
