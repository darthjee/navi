# Issue: Add a Button to Shut Down the Server

## Description

The UI already has a "Shut Down" button and the backend already has a `PATCH /engine/shutdown` endpoint, but the shutdown does not actually terminate the application. The root cause is that `WebServer.start()` returns an `http.Server` instance instead of a Promise, so `PromiseAggregator` immediately resolves it (via `Promise.allSettled`) and never truly waits for the web server to close.

## Problem

- `WebServer.start()` returns `this.#app.listen(port)` — an `http.Server`, not a Promise
- `PromiseAggregator.add(webServer.start())` pushes the `http.Server` into the promises array; `Promise.allSettled` wraps it with `Promise.resolve()` and it settles immediately
- `ApplicationInstance.run()` is therefore not waiting on the web server at all
- Calling `shutdown()` closes the HTTP server, but nothing in the aggregator is unblocked by that

## Expected Behavior

- `WebServer.start()` returns a Promise that resolves when the HTTP server fires its `'close'` event
- `PromiseAggregator` correctly waits for the web server alongside the engine promise
- Clicking "Shut Down" in the UI causes `run()` to complete and the application to exit cleanly

## Solution

- Change `WebServer.start()` to return a Promise that wraps the `http.Server` and resolves on the `'close'` event:
  ```js
  start() {
    Logger.info(`Listening to port ${this.#port}`);
    return new Promise((resolve) => {
      this.#httpServer = this.#app.listen(this.#port);
      this.#httpServer.on('close', resolve);
    });
  }
  ```
- Update `WebServer` specs to cover the new Promise-based return value

## Benefits

- Clean, user-initiated shutdown from the browser without killing the process externally
- `run()` completes naturally once both the engine and the web server have finished

---
See issue for details: https://github.com/darthjee/navi/issues/422
