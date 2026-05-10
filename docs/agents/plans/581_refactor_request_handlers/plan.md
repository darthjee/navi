# Plan: Refactor Request Handlers

## Overview

Rename all `*HandlerExecutor` classes back to `*Handler` now that the old two-layer design (RequestHandler → RequestHandlerExecutor) no longer exists. The base class `RequestHandlerExecutor` becomes `RequestHandler`. Also refactor `handle()` implementations for readability where applicable, and update all documentation.

## Context

After issues #576 and #579, all concrete `RequestHandler` subclasses were removed and routes are now wired directly to `RequestHandlerExecutor` subclasses via `HandlerConfig`. The "Executor" suffix was introduced to distinguish the two layers, but that distinction no longer exists. The classes can now be renamed to the simpler `*Handler` form.

Additionally, since `handle()` no longer receives `req` and `res` as arguments (they are stored as instance variables in each executor's constructor), the method bodies can be reviewed and refactored for clarity.

## Implementation Steps

### Step 1 — Rename base class `RequestHandlerExecutor` → `RequestHandler`

Rename `source/lib/common/server/RequestHandlerExecutor.js` to `RequestHandlerExecutor.js` → `RequestHandler.js` and update the class name and export. Update all files that import from this path (all executor subclasses in both `source` and `dev/app`). Update the corresponding spec.

### Step 2 — Rename `source` handler executors

Rename each `*HandlerExecutor` class and file in `source/lib/server/handlers/` and subfolders:

| Old name | New name |
|---|---|
| `AssetsHandlerExecutor` | `AssetsHandler` |
| `IndexHandlerExecutor` | `IndexHandler` |
| `LinksHandlerExecutor` | `LinksHandler` |
| `LogsHandlerExecutor` | `LogsHandler` |
| `SettingsHandlerExecutor` | `SettingsHandler` |
| `StatsHandlerExecutor` | `StatsHandler` |
| `EngineContinueHandlerExecutor` | `EngineContinueHandler` |
| `EnginePauseHandlerExecutor` | `EnginePauseHandler` |
| `EngineRestartHandlerExecutor` | `EngineRestartHandler` |
| `EngineShutdownHandlerExecutor` | `EngineShutdownHandler` |
| `EngineStartHandlerExecutor` | `EngineStartHandler` |
| `EngineStatusHandlerExecutor` | `EngineStatusHandler` |
| `EngineStopHandlerExecutor` | `EngineStopHandler` |
| `JobHandlerExecutor` | `JobHandler` |
| `JobLogsHandlerExecutor` | `JobLogsHandler` |
| `JobRetryHandlerExecutor` | `JobRetryHandler` |
| `JobsHandlerExecutor` | `JobsHandler` |

Update `source/lib/server/Router.js` imports and `HandlerConfig` references. Update all corresponding spec files.

### Step 3 — Rename `dev/app` handler executors

Rename each `*HandlerExecutor` class and file in `dev/app/lib/handlers/`:

| Old name | New name |
|---|---|
| `ContentHandlerExecutor` | `ContentHandler` |
| `CollectionHandlerExecutor` | `CollectionHandler` |
| `IndexHandlerExecutor` | `IndexHandler` |
| `RedirectHandlerExecutor` | `RedirectHandler` |

Update `dev/app/lib/routing/Router.js` imports and `HandlerConfig` references. Update all corresponding spec files and `AppFactory.js`.

### Step 4 — Refactor `handle()` implementations for readability

Review each renamed handler's `handle()` method. Since `req` and `res` are instance variables, refactor any implementation that can be made clearer — e.g., extracting private helper methods, simplifying conditional chains, or removing unnecessary intermediate variables.

### Step 5 — Update `docs/agents` documentation

Update `docs/agents/architecture.md` and any other doc files that reference old class names (`*HandlerExecutor`) to use the new `*Handler` names.

## Files to Change

**Renamed files (source):**
- `source/lib/common/server/RequestHandlerExecutor.js` → `RequestHandler.js`
- `source/spec/lib/common/server/RequestHandlerExecutor_spec.js` → `RequestHandler_spec.js`
- `source/lib/server/handlers/AssetsHandlerExecutor.js` → `AssetsHandler.js` (and spec)
- `source/lib/server/handlers/IndexHandlerExecutor.js` → `IndexHandler.js` (and spec)
- `source/lib/server/handlers/LinksHandlerExecutor.js` → `LinksHandler.js` (and spec)
- `source/lib/server/handlers/LogsHandlerExecutor.js` → `LogsHandler.js` (and spec)
- `source/lib/server/handlers/SettingsHandlerExecutor.js` → `SettingsHandler.js` (and spec)
- `source/lib/server/handlers/StatsHandlerExecutor.js` → `StatsHandler.js` (and spec)
- All 7 engine handler executor files → renamed (and specs)
- All 4 job handler executor files → renamed (and specs)
- `source/lib/server/Router.js` — update all imports

**Renamed files (dev/app):**
- `dev/app/lib/handlers/ContentHandlerExecutor.js` → `ContentHandler.js` (and spec)
- `dev/app/lib/handlers/CollectionHandlerExecutor.js` → `CollectionHandler.js` (and spec)
- `dev/app/lib/handlers/IndexHandlerExecutor.js` → `IndexHandler.js` (and spec)
- `dev/app/lib/handlers/RedirectHandlerExecutor.js` → `RedirectHandler.js` (and spec)
- `dev/app/lib/routing/Router.js` — update all imports
- `dev/app/spec/support/utils/AppFactory.js` — update imports

**Documentation:**
- `docs/agents/architecture.md` — update all references to executor class names

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source`: `cd source && npm run coverage` (CircleCI job: `jasmine`)
- `source`: `cd source && npm run lint` (CircleCI job: `checks`)
- `dev/app`: `cd dev/app && npm run coverage` (CircleCI job: `jasmine-dev`)
- `dev/app`: `cd dev/app && npm run lint` (CircleCI job: `checks-dev`)

## Notes

- Each step should be its own commit (or a few commits for large rename steps, grouped by folder).
- The rename is purely mechanical for most classes — no logic changes.
- Step 4 (readability refactoring) is optional per class; only refactor where there is a genuine improvement to be made.
- `HandlerConfig` itself is not renamed — it already has a clean name.
