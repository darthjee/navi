# Plan: Split Logs Publication Logic

## Overview

Decouple console-only logging from console+API logging by giving `LogRegistry` its own logging API (mirroring `Logger`), and routing each existing call site to the appropriate publisher.

## Context

Currently, `LogRegistry.build()` wires the `BufferedLogger` into `Logger` via `Logger.addLogger()`, so every call to `Logger.*` ends up in both the console and the API buffer. The goal is:

- `Logger` → console only (`ConsoleLogger` only, no `BufferedLogger`)
- `LogRegistry` → console + API buffer (internally holds a `LoggerGroup` of `ConsoleLogger` + `BufferedLogger`)

`LogRegistry` must expose the same `debug/info/warn/error` API as `Logger` so call sites can choose their publisher.

## Implementation Steps

### Step 1 — Remove `BufferedLogger` wiring from `Logger`

In `LogRegistry.build()`, remove the `Logger.addLogger(logRegistry.bufferedLogger)` call.
`Logger` will then hold only its default `ConsoleLogger`, as initialised in `Logger.#ensureLoggerGroup()`.

### Step 2 — Add logging methods to `LogRegistryInstance`

Add a `LoggerGroup` inside `LogRegistryInstance` that contains both a `ConsoleLogger` and the `BufferedLogger`. Expose `debug(msg)`, `info(msg)`, `warn(msg)`, `error(msg)` methods that delegate to this group. This ensures any log published via `LogRegistry` also appears in the console.

### Step 3 — Add static logging methods to `LogRegistry`

Mirror the `Logger` static API on `LogRegistry`: add static `debug`, `info`, `warn`, `error` methods that delegate to the singleton instance's logging methods (same pattern used for `getLogs`, `getLogsByLevel`, etc.).

### Step 4 — Redirect call sites to `LogRegistry`

Update the call sites identified in the audit to import and use `LogRegistry` instead of `Logger`:

**Switch to `LogRegistry`:**
- `services/Client.js` — all `info` and `error` calls (HTTP request/response lifecycle)
- `background/Worker.js:48` — `error` on job execution failure
- `jobs/AssetDownloadJob.js:52` — `error` on job failure
- `jobs/ResourceRequestJob.js:51` — `error` on job failure
- `models/ResourceRequestAction.js:69` — `error` on skipped action
- `services/FailureChecker.js:73` — `error` on threshold exceeded
- `utils/HtmlParser.js:35` — `warn` on selector match failure
- `utils/HtmlElementParser.js:31` — `warn` on missing attribute

**Keep with `Logger` (console only):**
- `jobs/*.js` `debug` performing messages
- `services/Engine.js:71` debug
- `server/RouteRegister.js` debug HTTP logging
- `server/WebServer.js:32` info port binding
- `services/ConfigLoader.js:70` error (happens before registry exists)
- `utils/EnvResolver.js:46,66` warn (config-time, before registry)

### Step 5 — Update specs

Update or add specs for:
- `LogRegistryInstance` — new logging methods
- `LogRegistry` — new static logging delegates; verify `Logger.addLogger` is no longer called
- `Logger` — verify `BufferedLogger` is no longer attached after `LogRegistry.build()`
- Each modified call site — verify log calls go to the correct publisher

## Files to Change

- `source/lib/registry/LogRegistry.js` — remove `Logger.addLogger`; add static `debug/info/warn/error`
- `source/lib/registry/LogRegistryInstance.js` — add `LoggerGroup(ConsoleLogger + BufferedLogger)`; add instance `debug/info/warn/error`
- `source/lib/services/Client.js` — switch to `LogRegistry`
- `source/lib/background/Worker.js` — switch error to `LogRegistry`
- `source/lib/jobs/AssetDownloadJob.js` — switch error to `LogRegistry`
- `source/lib/jobs/ResourceRequestJob.js` — switch error to `LogRegistry`
- `source/lib/models/ResourceRequestAction.js` — switch error to `LogRegistry`
- `source/lib/services/FailureChecker.js` — switch error to `LogRegistry`
- `source/lib/utils/HtmlParser.js` — switch warn to `LogRegistry`
- `source/lib/utils/HtmlElementParser.js` — switch warn to `LogRegistry`
- `source/spec/lib/registry/LogRegistry_spec.js` — update/extend
- `source/spec/lib/registry/LogRegistryInstance_spec.js` — update/extend
- `source/spec/lib/utils/logging/Logger_spec.js` — update
- Specs for each modified call-site file

## Notes

- `Logger.addLogger` / `Logger.setLogger` can be kept for test use but should no longer be called at boot time after this change.
- `ConfigLoader` and `EnvResolver` intentionally stay on `Logger` because they run before `LogRegistry.build()` is called during startup — routing them to `LogRegistry` would require the registry to be available earlier or those errors would be silently dropped.
- `LogRegistryInstance` must instantiate its own `ConsoleLogger` — it cannot reuse `Logger`'s internal `ConsoleLogger` since that is private to `Logger`.
