# Issue: Add Stop and Start Endpoint and Behavior

## Description

Currently the Engine starts when Navi starts and runs until completion with no way to
control it at runtime. This issue adds a set of PATCH/GET endpoints to pause, stop,
continue, start, and restart the Engine, along with corresponding frontend controls.

## Problem

- There is no way to pause or stop the Engine without stopping the entire process.
- There is no way to restart the Engine or re-enqueue initial jobs at runtime.
- The frontend has no controls for Engine lifecycle management.

## Expected Behavior

### Backend Endpoints

| Method | Path | Behaviour |
|--------|------|-----------|
| `PATCH` | `/engine/pause` | Stops the Engine loop (a new one can be created later). The Engine's promise resolves successfully, leaving the application waiting only on the web server promise. All jobs remain in their current state; workers go idle. |
| `PATCH` | `/engine/stop` | Same as pause, but additionally clears all jobs from all queues. |
| `PATCH` | `/engine/continue` | Resumes a paused Engine by attaching a new promise. No queue changes. Cannot be called if the Engine is already running. |
| `PATCH` | `/engine/start` | Starts a fresh Engine run: attaches a new promise and re-enqueues all `ResourceRequest`s that do not require parameters. Cannot be called if the Engine is already running. |
| `PATCH` | `/engine/restart` | Equivalent to stop followed by start. |
| `GET` | `/engine/status` | Returns the current Engine status: `running`, `paused`, or `stopped` (no Engine exists after a stop). |

### Frontend

New buttons in the UI for each action, conditionally enabled based on Engine status:

- **Pause** — only available when Engine is running.
- **Stop** — only available when Engine is running.
- **Restart** — only available when Engine is running.
- **Continue** — only available when Engine is stopped/paused.
- **Start** — only available when Engine is stopped/paused.

## Solution

- Add a promise-management layer to `Engine` or `Application` that allows attaching and
  resolving promises externally.
- Add request handlers for each endpoint following the existing `RequestHandler` pattern.
- Register all new routes in `Router`.
- Add frontend API calls and conditional control buttons in the header or a dedicated
  controls section.

## Benefits

- Operators can control the cache-warming process at runtime without restarting the process.
- Enables pause/resume and full restart workflows from the web UI.

---
See issue for details: https://github.com/darthjee/navi/issues/417
