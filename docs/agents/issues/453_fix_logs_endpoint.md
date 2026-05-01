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

## Root Cause Detail

`ApplicationInstance.loadConfig()` already creates a `BufferedLogger` manually and wires it into `Logger`:

```js
this.#bufferedLogger = new BufferedLogger(undefined, this.config.logConfig.size);
Logger.addLogger(this.#bufferedLogger);
```

`LogRegistry.build()` does the same thing internally. Simply adding `LogRegistry.build()` to `#initRegistries()` without removing the manual creation would result in **two** `BufferedLogger`s registered in `Logger`, causing every log message to be stored twice.

## Solution

- Replace the manual `BufferedLogger` creation in `ApplicationInstance.loadConfig()` with a call to `LogRegistry.build({ retention: this.config.logConfig.size })`.
- Remove `this.#bufferedLogger` and the `Logger.addLogger()` call from `loadConfig()`.
- Update `get bufferedLogger()` in `ApplicationInstance` to delegate to `LogRegistry`.

## Benefits

- The logs endpoint works correctly, enabling real-time log monitoring via the web UI.

---
See issue for details: https://github.com/darthjee/navi/issues/453
