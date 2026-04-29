# Plan: Engine Control Endpoints

## Context

Six new routes expose the Engine lifecycle control over HTTP, following the existing
`RequestHandler` pattern used by `StatsRequestHandler`, `JobsRequestHandler`, etc.

## New Routes

| Method | Path | Handler |
|--------|------|---------|
| `PATCH` | `/engine/pause` | `EnginePauseRequestHandler` |
| `PATCH` | `/engine/stop` | `EngineStopRequestHandler` |
| `PATCH` | `/engine/continue` | `EngineContinueRequestHandler` |
| `PATCH` | `/engine/start` | `EngineStartRequestHandler` |
| `PATCH` | `/engine/restart` | `EngineRestartRequestHandler` |
| `GET` | `/engine/status` | `EngineStatusRequestHandler` |

## Implementation

### Step 1 — Add handler classes

Each handler lives in `source/lib/server/` and extends `RequestHandler`.

**`EnginePauseRequestHandler`** — calls `Application.pause()`, responds `200 OK` with
`{ status: 'pausing' }`. Returns `409 Conflict` if status is not `'running'`.

**`EngineStopRequestHandler`** — calls `Application.stop()`, responds `200 OK` with
`{ status: 'stopping' }`. Returns `409 Conflict` if status is not `'running'`.

**`EngineContinueRequestHandler`** — calls `Application.continue()`, responds `200 OK`
with `{ status: 'running' }`. Returns `409 Conflict` if status is not `'paused'`.

**`EngineStartRequestHandler`** — calls `Application.start()`, responds `200 OK` with
`{ status: 'running' }`. Returns `409 Conflict` if status is not `'stopped'`.

**`EngineRestartRequestHandler`** — calls `Application.restart()`, responds `200 OK` with
`{ status: 'stopping' }`. Returns `409 Conflict` if status is not `'running'`.

**`EngineStatusRequestHandler`** — calls `Application.status()`, responds `200 OK` with
`{ status: <current_status> }`.

All PATCH handlers that call async Application methods (`pause`, `stop`, `restart`) return
immediately with the transitional status (`'pausing'` / `'stopping'`) — they do not await
the full transition. The client polls `/engine/status` to know when the transition completes.

### Step 2 — Register routes in `Router`

In `source/lib/server/Router.js`, register the 6 new routes via `RouteRegister`, following
the existing pattern.

### Step 3 — Add specs

- `source/spec/lib/server/EnginePauseRequestHandler_spec.js`
- `source/spec/lib/server/EngineStopRequestHandler_spec.js`
- `source/spec/lib/server/EngineContinueRequestHandler_spec.js`
- `source/spec/lib/server/EngineStartRequestHandler_spec.js`
- `source/spec/lib/server/EngineRestartRequestHandler_spec.js`
- `source/spec/lib/server/EngineStatusRequestHandler_spec.js`
- `source/spec/lib/server/Router_spec.js` — update to cover new routes

### Step 4 — Update docs

- `docs/agents/web-server.md` — document all 6 new routes and their handlers
- `docs/agents/architecture.md` — add new handler classes to the server module table

## Files to Change

- `source/lib/server/EnginePauseRequestHandler.js` — new
- `source/lib/server/EngineStopRequestHandler.js` — new
- `source/lib/server/EngineContinueRequestHandler.js` — new
- `source/lib/server/EngineStartRequestHandler.js` — new
- `source/lib/server/EngineRestartRequestHandler.js` — new
- `source/lib/server/EngineStatusRequestHandler.js` — new
- `source/lib/server/Router.js` — register new routes
- `source/spec/lib/server/Engine*RequestHandler_spec.js` — new specs (6 files)
- `source/spec/lib/server/Router_spec.js` — update
- `docs/agents/web-server.md` — update
- `docs/agents/architecture.md` — update
