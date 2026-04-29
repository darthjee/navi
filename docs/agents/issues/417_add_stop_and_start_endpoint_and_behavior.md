# Issue: Add Stop and Start Endpoint and Behavior

## Description

Currently the Engine starts when Navi starts and runs until completion with no way to
control it at runtime. This issue adds a set of PATCH/GET endpoints to pause, stop,
continue, start, and restart the Engine, along with corresponding frontend controls.

## Problem

- There is no way to pause or stop the Engine without stopping the entire process.
- There is no way to restart the Engine or re-enqueue initial jobs at runtime.
- The frontend has no controls for Engine lifecycle management.

## Engine Status

`Application` becomes a static singleton (like `JobRegistry` / `WorkersRegistry`) and owns
the `engine_status`. A static method `Application.status()` delegates to the internal
instance and is the single source of truth for the current engine state.

The full set of statuses:

| Status | Meaning |
|--------|---------|
| `running` | Engine loop is active. |
| `pausing` | Pause requested; waiting for active workers to finish their current job. |
| `paused` | Engine loop stopped; jobs remain in queues. |
| `stopping` | Stop requested; waiting for active workers to finish their current job. |
| `stopped` | Engine loop stopped and all queues cleared. |

During `pausing` and `stopping`, all control actions are unavailable (buttons disabled in
the frontend). Only once workers finish does the status transition to `paused` or `stopped`.

Any process that would enqueue new jobs (e.g. action chaining) must check
`Application.status()` before enqueuing — if the engine is not `running`, the enqueue is
skipped.

## Promise Management

`PromiseAggregator` (`source/lib/utils/PromiseAggregator.js`) is the existing class
responsible for managing the Engine's promise. When the Engine is paused or stopped, its
promise is resolved successfully via `PromiseAggregator`. When the Engine is continued or
started, a new promise is attached via `PromiseAggregator`.

## Expected Behavior

### Backend Endpoints

| Method | Path | Behaviour |
|--------|------|-----------|
| `PATCH` | `/engine/pause` | Sets status to `pausing`. Once all active workers finish, resolves the Engine promise via `PromiseAggregator`, sets status to `paused`. Jobs remain in queues. |
| `PATCH` | `/engine/stop` | Sets status to `stopping`. Once all active workers finish, resolves the Engine promise via `PromiseAggregator`, clears all job queues, sets status to `stopped`. |
| `PATCH` | `/engine/continue` | Only valid from `paused`. Attaches a new promise via `PromiseAggregator`, sets status to `running`. No queue changes. |
| `PATCH` | `/engine/start` | Only valid from `stopped`. Attaches a new promise via `PromiseAggregator`, re-enqueues all `ResourceRequest`s that do not require parameters, sets status to `running`. |
| `PATCH` | `/engine/restart` | Only valid when `running`. Equivalent to pause-until-workers-finish → clear queues → start. |
| `GET` | `/engine/status` | Returns the current Engine status. |

### Frontend Controls

Buttons shown in the UI, enabled only in the listed states:

| Action | Available when |
|--------|---------------|
| Pause | `running` |
| Stop | `running` |
| Restart | `running` |
| Continue | `paused` |
| Start | `stopped` |
| *(all disabled)* | `pausing`, `stopping` |

## Solution

- Convert `Application` to a static singleton facade (same pattern as `JobRegistry`).
- Add `engine_status` management to `Application` with transition logic.
- Add request handlers for each endpoint following the existing `RequestHandler` pattern.
- Register all new routes in `Router`.
- Update any enqueue call-sites to check `Application.status()` before enqueuing.
- Add frontend API calls and conditional control buttons.

## Benefits

- Operators can control the cache-warming process at runtime without restarting the process.
- Enables pause/resume and full restart workflows from the web UI.
- Clear transitional states (`pausing`/`stopping`) prevent race conditions.

---
See issue for details: https://github.com/darthjee/navi/issues/417
