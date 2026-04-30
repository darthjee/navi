# Issue: Add Apache-Style Access Logging to Web Server

## Description

Every time the web server receives a request, a `debug` log should be recorded after the response is sent, capturing the request method, path, and HTTP status code in an Apache-style format. If the request handler throws an error, a `debug` log should also be recorded with the same information.

## Expected Behavior

- After each successful response: log at `debug` level with method, path, and status code
- After each failed response: log at `debug` level with method, path, and error status code
- Format resembles Apache Combined/Common Log format, e.g.:
  ```
  GET /stats.json 200
  PATCH /engine/pause 409
  GET /unknown 404
  ```

## Solution

- Add access logging middleware or hook in `RouteRegister` (or a new `AccessLogger` helper) that fires after `res` is sent
- Use `Logger.debug(...)` to emit the log entry
- Cover both the success path and the error/catch path in `RouteRegister`

## Benefits

- Operators can trace every request through the log stream visible in `/#/logs`
- Consistent with the existing `Logger`/`LogRegistry` infrastructure already in place

---
See issue for details: https://github.com/darthjee/navi/issues/448
