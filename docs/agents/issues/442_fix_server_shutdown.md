# Issue: Fix Server Shutdown

## Description

When calling shutdown on the server, the application never actually terminates. The root cause is that `WebServer.start()` returns an `http.Server` instance instead of a Promise, so `PromiseAggregator` wraps it with `Promise.resolve()` via `Promise.allSettled` and resolves it immediately — it never truly waits for the web server to close.

## Problem

- `WebServer.start()` returns `this.#app.listen(port)` — an `http.Server`, not a Promise
- `PromiseAggregator.add(webServer.start())` pushes the `http.Server` into the promises array; `Promise.allSettled` wraps it with `Promise.resolve()` and it settles immediately
- `ApplicationInstance.run()` is therefore not waiting on the web server at all
- Calling `shutdown()` closes the HTTP server, but nothing in the aggregator is unblocked by that, so the application does not exit

## Expected Behavior

- `WebServer.start()` returns a Promise that resolves when the HTTP server fires its `'close'` event
- `PromiseAggregator` correctly waits for the web server alongside the engine promise
- Calling shutdown causes `run()` to complete and the application to exit cleanly

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

- Shutdown triggered via `PATCH /engine/shutdown` (or the "Shut Down" UI button) causes the application to exit cleanly without killing the process externally

---
See issue for details: https://github.com/darthjee/navi/issues/442
