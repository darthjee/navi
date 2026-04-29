# Plan: Add Apache-Style Access Logging to Web Server

## Overview

After every request handled by the web server, emit a `debug` log entry in Apache-style format (`METHOD /path STATUS`). This covers both successful responses and error responses caught by `RouteRegister`.

## Context

`RouteRegister` is the central place where all routes are wired to handler instances and where errors are caught and converted to HTTP responses. It is the natural single point to add access logging without touching each handler individually.

The logging infrastructure (`Logger.debug()`) is already in place via `source/lib/utils/logging/Logger.js` and `LogRegistry`.

## Implementation Steps

### Step 1 — Read `RouteRegister` to understand current structure

Confirm how the success path and the error path are structured — specifically where `res.json()` / `res.status()` is called and where errors are caught — before writing any code.

### Step 2 — Add access logging to the success path

After the handler's `handle(req, res)` call completes successfully, emit:

```
Logger.debug(`${req.method} ${req.path} ${res.statusCode}`)
```

### Step 3 — Add access logging to the error path

In the existing `catch` block (or equivalent), after the error response is sent, emit a `debug` log with the same format using the error status code.

### Step 4 — Update tests

Add specs to `source/spec/lib/server/RouteRegister_spec.js` asserting that:
- A `debug` log is emitted with the correct method, path, and status on success
- A `debug` log is emitted with the correct method, path, and error status on failure

## Files to Change

- `source/lib/server/RouteRegister.js` — add `Logger.debug(...)` calls after success and error responses
- `source/spec/lib/server/RouteRegister_spec.js` — add tests for the new logging behaviour

## Notes

- The log format should resemble Apache Common Log: `METHOD /path STATUS` (e.g. `GET /stats.json 200`)
- `Logger` must be imported in `RouteRegister` if it is not already
- `LogRegistry` must be built in the `RouteRegister` spec setup (same pattern as `Router_spec.js` and `WebServer_spec.js`)
