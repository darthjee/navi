# Issue: Add a Button to Shut Down the Server

## Description

Add a "Shut Down" button to the web UI and a corresponding API endpoint so that the user can terminate the web server and stop the engine cleanly from the browser, without needing to kill the process externally.

## Problem

- The web server had no shutdown mechanism exposed through the UI
- Users had to kill the process externally to stop the server

## Expected Behavior

- A "Shut Down" button is available in the `EngineControls` panel at all times (not gated on engine status)
- Clicking it calls `PATCH /engine/shutdown`
- The handler closes the HTTP server and stops the engine if it is running

## Solution (implemented)

- Added `EngineShutdownRequestHandler` handling `PATCH /engine/shutdown`, which calls `Application.shutdown()`
- `ApplicationInstance.shutdown()` calls `this.webServer?.shutdown()` to close the HTTP server, then stops the engine if it is `running`
- Added `shutdownServer()` to `frontend/src/clients/EngineClient.js`
- Added a "Shut Down" button (`btn-danger`, always enabled) to `EngineControlsHelper.render()`

## Benefits

- Provides a clean, user-initiated shutdown path without killing the process externally

---
See issue for details: https://github.com/darthjee/navi/issues/422
