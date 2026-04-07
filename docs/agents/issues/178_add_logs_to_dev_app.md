# Issue: Add Logs to Dev App

## Description

The dev application does not log incoming HTTP requests. Adding request logging would make it easy to observe when requests pass through the proxy and reach the application, similar to Apache's access log format.

## Problem

- The dev app silently handles requests with no console output
- There is no way to tell, from the app's output, whether a request arrived directly or was forwarded through the proxy
- Debugging request flow requires guesswork or external tools

## Expected Behavior

- Every incoming HTTP request is logged to stdout
- Log format follows Apache Combined Log / Common Log style, e.g.:
  ```
  ::1 - - [07/Apr/2026:12:34:56 +0000] "GET /resource HTTP/1.1" 200 512
  ```
- Fields should include at minimum: remote IP, timestamp, HTTP method, path, status code, and response size

## Solution

- Add an Express request-logging middleware to the dev app (e.g. `morgan` with the `combined` or `common` format, or a lightweight custom middleware)
- Mount the middleware globally so all routes are covered
- Ensure the logger writes to stdout so output is visible in Docker Compose logs

## Benefits

- Makes it straightforward to confirm that requests are reaching the app after passing through the proxy
- Speeds up debugging of caching, routing, and retry behaviour during local development

---
See issue for details: https://github.com/darthjee/navi/issues/178
