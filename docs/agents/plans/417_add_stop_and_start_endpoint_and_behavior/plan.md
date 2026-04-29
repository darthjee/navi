# Plan: Add Stop and Start Endpoint and Behavior

## Overview

Add runtime Engine lifecycle control via 5 PATCH endpoints and 1 GET endpoint, with
corresponding frontend buttons. The Engine can be paused, stopped, continued, started, and
restarted without killing the process.

## Context

See the issue file for the full status table and endpoint specifications.  
Key architectural decisions established during planning:

- `Application` becomes a static singleton facade (like `JobRegistry`) so that any part of
  the system can call `Application.status()` without threading the instance around.
- The Engine gains an internal stop-flag that breaks its loop on the next tick; its promise
  resolves naturally when the loop exits.
- `PromiseAggregator` stays as-is; new Engine promises are `add`ed to the existing
  aggregator when the Engine is continued or started.
- Enqueue call-sites in model classes check `Application.status()` before calling
  `JobRegistry.enqueue()` to prevent new jobs from being queued during `pausing`/`stopping`/
  `paused`/`stopped` states. `JobRegistry` cannot check this itself (circular import).

## Plan Files

| File | Covers |
|------|--------|
| [plan_refactoring.md](plan_refactoring.md) | Convert `Application` to static singleton + add `engine_status` management |
| [plan_backend.md](plan_backend.md) | Engine stop-flag, status transitions, enqueue gating |
| [plan_api.md](plan_api.md) | New HTTP endpoints, request handlers, Router wiring |
| [plan_frontend.md](plan_frontend.md) | Frontend control buttons with conditional availability |

## Implementation Order

1. `plan_refactoring.md` — foundation; everything else depends on `Application.status()`
2. `plan_backend.md` — Engine behavior + enqueue gating
3. `plan_api.md` — web layer
4. `plan_frontend.md` — UI

## CI Checks

Before opening a PR, run:

- `source/`: `docker-compose run --rm navi_app yarn test`
- `source/`: `docker-compose run --rm navi_app yarn lint`
- `frontend/`: check `docs/agents/frontend.md` and `.circleci/config.yml` for frontend commands
