# Issue: Backend: memory monitoring endpoint & config

## Description
Add a `GET /memory/status.json` endpoint (unauthenticated) that reports the running Node.js process's memory usage (`rss`) against a configured maximum, plus the `web.memory` config needed to define that maximum and its warning thresholds.

Part of the memory monitoring feature (#682). This sub-issue covers the backend/config side only — no frontend or docs work here.

## Problem
There is currently no way to observe the Node.js process's own memory usage, or to configure what counts as a safe/warning/critical level for it. Nothing in `source/` reads `process.memoryUsage()`, a cgroup memory limit, or `os.totalmem()` today.

## Expected Behavior
- A new `web.memory` config block, parsed alongside the existing `web:` section (see `source/lib/services/ConfigParser.js` / `source/lib/models/configs/WebConfig.js`):

  ```yaml
  web:
    memory:
      maximum: 20971520    # bytes; optional — see fallback logic below
      thresholds:
        low: 25.0           # percentage of `maximum`
        medium: 50.0
        high: 75.0
        over: 100.0
  ```

- `maximum` fallback logic when not set in config, in order: **Config → Cgroup limit → OS total memory**.
- A new `/memory/*` route namespace, independent of the existing `/engine/*` and `/api/*` namespaces.
- `GET /memory/status.json` — **no authentication required** (matching the existing unauthenticated pattern already used by `/engine/*`, `/settings.json`, `/stats.json`, `/jobs/*`, `/logs.json`, `/links.json` — auth in this codebase is opt-in per handler via `SecuredRequestHandler`, not a global gate). Reads `process.memoryUsage().rss` as the current value, and responds:

  ```json
  {
    "current": 89128960,
    "maximum": 20971520,
    "percentage": 25.2,
    "status": "low"
  }
  ```

  - All values are raw bytes (not human-formatted) — precision and formatting are left to consumers.
  - `percentage` is `current / maximum * 100`.
  - `status` is derived by comparing `percentage` against the configured thresholds table (`low`/`medium`/`high`/`over`). Comparisons are **inclusive** (`>=`) — e.g. `percentage == 50.0` with `medium: 50.0` is already `"medium"`, not `"low"`.
- `web.memory.thresholds` config validation: the four values **must be in strictly ascending order** (`low < medium < high < over`). If they aren't, boot **fails fast** while reading configuration, matching the existing convention for invalid config values (e.g. `InvalidParserType`) — add a new `AppError` subclass for this (e.g. `InvalidMemoryThresholds`).

## Solution
- Follow the existing handler pattern under `source/lib/server/handlers/` (see `source/lib/server/handlers/engine/EngineStatusHandler.js` and `source/lib/server/handlers/StatsHandler.js` for the shape of a status-reporting handler with a multi-field JSON body); register the route in `source/lib/server/Router.js` (add to `GET_ROUTES`, e.g. `'/memory/status.json': new HandlerConfig(MemoryStatusHandler, [this.#webConfig.memory])`) — `RouteRegister` already handles GET + error mapping generically, no new middleware/namespace wiring needed.
- Add a `web.memory` sub-config, following the nested-object-with-defaults pattern already used for `web.api` in `WebConfig` (source/lib/models/configs/WebConfig.js). Validate ascending threshold order at construction time (see above).
- `maximum` resolution — no byte-size or cgroup-reading utility exists yet in `source/`; this is new code. Per the project's dependency-injection convention, split each source into its own small, independently-testable reader class rather than one monolithic resolver, then compose them behind one fallback orchestrator:
  - A config reader (returns `web.memory.maximum` when set).
  - A cgroup v2 reader (`/sys/fs/cgroup/memory.max`; treats a missing/unreadable file or the literal `"max"` value as "no limit").
  - A cgroup v1 reader (`/sys/fs/cgroup/memory/memory.limit_in_bytes`; treats a missing/unreadable file or the kernel's "unbounded" sentinel value as "no limit").
  - An OS total-memory reader (wraps `os.totalmem()`).
  - One orchestrator that tries them in order — Config → cgroup v2 → cgroup v1 → OS total — and silently falls through to the next reader whenever one reports "no limit" (no throwing on a missing/unreadable cgroup file; that's expected on non-Linux dev machines and bare hosts).
  - `process.memoryUsage().rss` is likewise wrapped in a small injectable seam class rather than called directly inside the handler, per the project's DI convention.

## Benefits
- Unblocks the frontend/dashboard sub-issue, which will consume this response shape and config shape as-is.
- Gives operators a configurable, observable signal for the process's own memory pressure without requiring a full metrics stack.
