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

Returns a JSON array of serialized log entries (up to `page_size` entries):

```json
[{
  "id": "some_uuid",
  "level": "log_level",
  "message": "log message"
}]
```

### Filtered request

```
GET /logs.json?last_id=some_uuid
```

Returns only logs **newer** than the given `last_id`, up to `page_size` entries. Since logs are stored in reverse order (newest first), the implementation counts how many entries exist before reaching `last_id`, then returns the oldest among those (respecting page size).

### Pagination

Page size defaults to `20` and is configurable in the YAML config:

```yaml
web:
  port: 3000
  logs_page_size: 30
```

## Solution

- Add `logs_page_size` to `WebConfig` (default: 20), parsed from the `web:` YAML key
- Add a `LogsRequestHandler` in `source/lib/server/` that reads logs from `BufferedLogger` and applies pagination and `last_id` filtering
- Register `GET /logs.json` in `Router`
- Add a `LogSerializer` (or reuse/extend existing serializers) to format log entries

## Benefits
- Enables the frontend to display and poll application logs in real time
- Incremental polling via `last_id` avoids re-fetching already-seen entries

---
See issue for details: https://github.com/darthjee/navi/issues/425
