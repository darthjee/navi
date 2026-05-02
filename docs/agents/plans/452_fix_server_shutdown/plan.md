# Plan: Fix Server Shutdown

## Overview
The server shutdown endpoint triggers the engine to stop but does not shut down the Express web server. This plan adds a `stop()` method to `WebServer` and wires it into the `ApplicationInstance` shutdown flow.

## Context
`ApplicationInstance` manages the engine lifecycle via `pause()`, `stop()`, `continue()`, `start()`, and `restart()`. The web server is started concurrently with the engine during `run()`, but there is no corresponding call to stop it when the application shuts down. `WebServer` only exposes `start()` — it has no `stop()` method.

## Implementation Steps

### Step 1 — Add `stop()` to `WebServer`
Add a `stop()` method to `WebServer` that closes the underlying Node.js HTTP server (the object returned by `app.listen()`). Store the server handle as an instance field during `start()` so it is accessible from `stop()`.

### Step 2 — Call `webServer.stop()` from `ApplicationInstance`
In `ApplicationInstance`, update the `stop()` lifecycle method (and any other shutdown paths, such as the one triggered after the engine finishes in `run()`) to also call `webServer.stop()` when a web server instance exists.

### Step 3 — Add tests
- Add a unit test for `WebServer.stop()` verifying it closes the HTTP server.
- Update `ApplicationInstance` specs to assert that `webServer.stop()` is called during shutdown.

## Files to Change
- `source/lib/server/WebServer.js` — add `stop()` method; store HTTP server handle from `start()`
- `source/lib/services/Application.js` — call `webServer.stop()` in `ApplicationInstance` shutdown flow
- `source/spec/lib/server/WebServer_spec.js` — add test for `stop()`
- `source/spec/lib/services/Application_spec.js` — assert `webServer.stop()` is invoked on shutdown

## Notes
- The HTTP server handle must be stored as an instance field (e.g., `#server`) during `start()` so `stop()` can call `#server.close()`.
- `WebServer.stop()` should be a no-op (or guard) if `start()` was never called.
- The `run()` method in `ApplicationInstance` awaits both engine and web server promises; shutting down the web server should not block the engine from stopping cleanly.
