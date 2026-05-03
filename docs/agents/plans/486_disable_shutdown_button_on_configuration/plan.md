# Plan: Disable Shutdown Button on Configuration

## Overview

Add a `web.enable_shutdown` config option that controls whether the shutdown button is visible in the React frontend. A new `GET /settings.json` backend endpoint exposes this setting. The frontend hides the button entirely while loading the settings, and only shows it once the endpoint confirms shutdown is enabled.

## Context

- The shutdown button is currently always visible, which is unsafe for demo deployments.
- The `WebConfig` model already holds web server settings (e.g. `port`); `enable_shutdown` belongs there.
- The `server/` layer already follows the `RequestHandler` subclass pattern for all routes.
- The frontend is a React SPA (`frontend/`) that fetches runtime data from the backend API.

## Implementation Steps

### Step 1 — Extend `WebConfig` with `enable_shutdown`

Add an `enableShutdown` property to `WebConfig`, parsed from `web.enable_shutdown` in the YAML config. Default value is `true` (preserves current behavior when the key is absent).

### Step 2 — Add `SettingsRequestHandler`

Create `source/lib/server/SettingsRequestHandler.js`, a new `RequestHandler` subclass that handles `GET /settings.json`:

- When `enable_shutdown` is `true`: respond `200` with `{ "enable_shutdown": true }`.
- When `enable_shutdown` is `false`: respond with a `4xx` error (e.g. `403 Forbidden`).

The handler receives `webConfig` at construction time (consistent with how other handlers receive their dependencies).

### Step 3 — Register the route in `Router`

Wire `GET /settings.json` to a `SettingsRequestHandler` instance inside `Router`, following the same `RouteRegister` pattern used by the existing routes.

### Step 4 — Update the documentation

Update the relevant docs to reflect the new config field and endpoint:

- `docs/agents/architecture.md` — add `enableShutdown` to the `WebConfig` row and add `SettingsRequestHandler` to the `server/` table.
- `docs/agents/web-server.md` — document the new `GET /settings.json` route and its behavior (200 vs 4xx).

### Step 5 — Update the frontend shutdown button

In the React SPA (`frontend/`):

- On application load, fetch `GET /settings.json`.
- While the request is in flight (loading state), render the shutdown button as completely hidden (not in the DOM).
- On a `200` response: show the button.
- On a `4xx` response or any error: keep the button hidden.

## Files to Change

- `source/lib/models/WebConfig.js` — add `enableShutdown` field (default `true`)
- `source/lib/server/SettingsRequestHandler.js` — new handler (create)
- `source/lib/server/Router.js` — register `GET /settings.json`
- `source/spec/lib/models/WebConfig_spec.js` — tests for new field
- `source/spec/lib/server/SettingsRequestHandler_spec.js` — new spec file (create)
- `docs/agents/architecture.md` — update `WebConfig` row and add `SettingsRequestHandler` to server table
- `docs/agents/web-server.md` — document the new `GET /settings.json` route
- `frontend/` — fetch settings on load, conditionally render shutdown button

## Notes

- The `4xx` status code for the disabled case is not specified in the issue; `403 Forbidden` is a reasonable default.
- The exact frontend files are not yet identified — a codebase lookup is needed before implementation.
- The `enable_shutdown` default of `true` ensures zero behavior change for existing deployments that omit the key.
