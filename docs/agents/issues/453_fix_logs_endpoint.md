# Issue: Fix Logs Endpoint

## Description

The `/logs.json` endpoint in `source/` is currently broken. Requests to it return an error because the `LogRegistry` has not been initialised before the endpoint is called.

## Problem

- `GET /logs.json` fails with the following error:
  ```
  Error: LogRegistry has not been built. Call LogRegistry.build() first
  ```
- `LogRegistry.build()` is never called during application startup, so the registry is uninitialised when the endpoint tries to read from it.

## Expected Behavior

- `GET /logs.json` returns the buffered log entries without error.
- `LogRegistry` is initialised at application startup, before any requests are served.

## Solution

- Call `LogRegistry.build()` during application initialisation (e.g. in `ApplicationInstance` alongside the other registry initialisations in `#initRegistries()`).

## Benefits

- The logs endpoint works correctly, enabling real-time log monitoring via the web UI.

---
See issue for details: https://github.com/darthjee/navi/issues/453
