# Plan: Add a Button to Shut Down the Server

## Overview

Add a shutdown mechanism to Navi: a new API endpoint that terminates the web server and stops the engine, plus a "Shut Down" button in the frontend that calls it.

## Context

The web server currently runs indefinitely. There is no way to stop it from the UI — users must kill the process externally. The existing engine lifecycle endpoints (`pause`, `stop`, `continue`, `start`, `restart`) only control the engine loop, not the web server itself. A true shutdown must end the web server promise AND stop the engine.

## Implementation Steps

### Step 1 — Expose a shutdown method on the web server

`WebServer` (or `Application`) must expose a method that resolves the promise keeping the server alive and closes the HTTP listener. This is the core mechanism all other steps depend on.

### Step 2 — Add `EngineShutdownRequestHandler`

Create `source/lib/server/EngineShutdownRequestHandler.js` following the existing handler pattern (extends `RequestHandler`). It should:
- Call the shutdown method added in Step 1
- Respond with `{ status: 'stopping' }` (or similar) on success

### Step 3 — Refactor `Router` to use a route map

Before adding the new route, refactor `source/lib/server/Router.js` to replace the individual `RouteRegister` calls with a declarative map of `path => handlerClass`, one for GET routes and one for PATCH routes. Example structure:

```js
const GET_ROUTES = {
  '/stats.json': StatsRequestHandler,
  '/jobs/:status.json': JobsRequestHandler,
  // ...
};

const PATCH_ROUTES = {
  '/engine/pause': EnginePauseRequestHandler,
  '/engine/stop': EngineStopRequestHandler,
  // ...
};
```

The router then iterates these maps and calls `RouteRegister.register()` / `RouteRegister.registerPatch()` for each entry. This makes adding new routes a one-line change.

### Step 4 — Register the new route in `Router`

Add `'/engine/shutdown': EngineShutdownRequestHandler` to the PATCH routes map.

### Step 5 — Add the Shut Down button to the frontend

In `frontend/`, add a "Shut Down" button to the appropriate component (likely the engine controls area). Clicking it should:
- Send `PATCH /engine/shutdown`
- Handle the response (e.g., disable further controls, show a "Server stopped" state)

## Files to Change

- `source/lib/server/WebServer.js` — add shutdown method
- `source/lib/services/Application.js` — expose shutdown delegate (if needed)
- `source/lib/server/EngineShutdownRequestHandler.js` — new handler
- `source/lib/server/Router.js` — refactor routes to declarative map; add `PATCH /engine/shutdown`
- `frontend/` — new Shut Down button and API call
- `source/spec/lib/server/EngineShutdownRequestHandler_spec.js` — new spec
- `source/spec/lib/server/Router_spec.js` — updated to cover new route
- `source/spec/lib/server/WebServer_spec.js` — updated to cover shutdown method

## Notes

- The shutdown must close the HTTP listener, not just stop the engine — otherwise the process stays alive.
- Existing `PATCH /engine/stop` stops the engine loop but does not terminate the web server; this new endpoint goes further.
- Open question: should the shutdown wait for the engine to finish its current tick before closing, or close immediately?
