# Plan: Docs — Update docs/agents

## Context

Several files under `docs/agents/` describe the architecture, runtime flow, and web server
routes. This issue touches all three layers, so the docs must be kept in sync.

## Files to Update

### `docs/agents/architecture.md`

- **`services/` table** — update `Application` entry to reflect the static singleton facade
  pattern and the new `engine_status` / `#aggregator` fields.
- **`services/` table** — add entries for the new Engine lifecycle methods (`pause`, `stop`,
  `continue`, `start`, `restart`) on `Application`.
- **`registry/` table** — update `JobRegistry` entry to document the new `clearQueues()`
  method.
- **`server/` table** — add all 6 new handler classes (`EnginePauseRequestHandler`,
  `EngineStopRequestHandler`, `EngineContinueRequestHandler`, `EngineStartRequestHandler`,
  `EngineRestartRequestHandler`, `EngineStatusRequestHandler`).

### `docs/agents/web-server.md`

- Document the 6 new routes:
  - `PATCH /engine/pause`
  - `PATCH /engine/stop`
  - `PATCH /engine/continue`
  - `PATCH /engine/start`
  - `PATCH /engine/restart`
  - `GET /engine/status`
- For each route: document the handler class, request/response format, valid preconditions,
  and the `409 Conflict` behaviour when called in an invalid state.

### `docs/agents/flow.md`

- Add a section describing the Engine lifecycle states (`running`, `pausing`, `paused`,
  `stopping`, `stopped`) and the transitions between them.
- Describe the enqueue gating behaviour: jobs are not enqueued when the engine status is not
  `'running'`.
- Describe the `#aggregator` persistence across Engine restarts.

### `docs/agents/frontend.md`

- Document the new `EngineControls` component: its polling behaviour, the availability
  matrix for each button, and where it is placed in the header.
