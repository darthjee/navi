# Plan: Fix Logs Endpoint

## Overview

`GET /logs.json` crashes because `LogRegistry.build()` is never called during application startup. The fix replaces the manual `BufferedLogger` creation in `ApplicationInstance.loadConfig()` with a call to `LogRegistry.build()`, which both initialises the registry and wires the logger into `Logger` — the same thing the manual code did, but in one place.

## Context

`ApplicationInstance.loadConfig()` currently creates a `BufferedLogger` manually:

```js
this.#bufferedLogger = new BufferedLogger(undefined, this.config.logConfig.size);
Logger.addLogger(this.#bufferedLogger);
```

`LogRegistry.build()` does exactly this internally (`new LogRegistryInstance(options)` → `new BufferedLogger(level, retention)` + `Logger.addLogger(...)`). Simply calling both would register two `BufferedLogger`s in `Logger`, doubling all log output.

## Implementation Steps

### Step 1 — Update `ApplicationInstance.loadConfig()`

Replace the manual `BufferedLogger` creation with `LogRegistry.build()` and store the resulting `bufferedLogger` in `#bufferedLogger`:

```js
// Before
this.#bufferedLogger = new BufferedLogger(undefined, this.config.logConfig.size);
Logger.addLogger(this.#bufferedLogger);

// After
const logRegistry = LogRegistry.build({ retention: this.config.logConfig.size });
this.#bufferedLogger = logRegistry.bufferedLogger;
```

`LogRegistry.build()` already calls `Logger.addLogger()` internally, so the explicit call is removed.

### Step 2 — Add `LogRegistry` import to `ApplicationInstance.js`

```js
import { LogRegistry } from '../registry/LogRegistry.js';
```

Remove the now-unused `BufferedLogger` import.

### Step 3 — Add `LogRegistry.reset()` to spec teardowns

`LogRegistry` is a singleton, so it must be reset between tests to avoid state leakage:

- `ApplicationInstance_spec.js` — add `LogRegistry.reset()` to `afterEach`
- `Application_spec.js` — add `LogRegistry.reset()` to the existing `afterEach`

## Files to Change

- `source/lib/services/ApplicationInstance.js` — replace `BufferedLogger` creation with `LogRegistry.build()`; swap imports
- `source/spec/lib/services/ApplicationInstance_spec.js` — add `LogRegistry.reset()` to teardown
- `source/spec/lib/services/Application_spec.js` — add `LogRegistry.reset()` to teardown
- `docs/agents/architecture.md` — document `LogRegistry` and `LogRegistryInstance` in the `registry/` section

### Step 4 — Update `docs/agents/architecture.md`

Add `LogRegistry` and `LogRegistryInstance` to the `registry/` section:

- **`LogRegistry`** — Static singleton facade for buffered log access. `LogRegistry.build(options)` creates the instance and wires the `BufferedLogger` into `Logger`. Exposes `getLogs()`, `getLogById()`, `getLogsByLevel()`, `getLogsJSON()`. Call `reset()` in tests.
- **`LogRegistryInstance`** — Holds the `BufferedLogger` instance. Provides filtered log queries via `LogFilter`. Not exported directly; accessed only via `LogRegistry`.

Also note in the `registry/` section that `LogRegistry` does **not** extend `NamedRegistry` — it is a standalone singleton following the same façade pattern as `JobRegistry` and `WorkersRegistry`.

## Notes

- There is exactly **one** `BufferedLogger` instance. `LogRegistry.build()` creates it; `Logger` receives a reference to it via `addLogger()`; `ApplicationInstance.#bufferedLogger` holds another reference to the same object. All three point to the same instance — no duplication.
- The manual `BufferedLogger` creation in `loadConfig()` is **removed**, not supplemented. Before the fix there was one manual instance; after the fix there is one registry-owned instance.
- `get bufferedLogger()` and `Application.bufferedLogger` remain unchanged — `this.#bufferedLogger` is still populated, just sourced from `LogRegistry` instead of being created directly.
- No changes needed to `LogsRequestHandler`, `LogRegistry`, or `LogRegistryInstance` — they are already correct.
