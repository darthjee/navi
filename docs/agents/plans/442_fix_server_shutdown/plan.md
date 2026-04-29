# Plan: Fix Server Shutdown

## Overview

Change `WebServer.start()` to return a Promise that resolves when the HTTP server fires its `'close'` event, so that `PromiseAggregator` correctly waits for the web server alongside the engine promise and the application exits cleanly on shutdown.

## Context

`ApplicationInstance.run()` adds the result of `webServer.start()` to a `PromiseAggregator`. Currently `start()` returns an `http.Server` instance — not a Promise — so `Promise.allSettled` wraps it with `Promise.resolve()` and it settles immediately. The aggregator never actually waits for the server to close, so calling `shutdown()` does not cause `run()` to complete.

## Implementation Steps

### Step 1 — Change `WebServer.start()` to return a Promise

Wrap the `http.Server` in a Promise that resolves when the `'close'` event fires:

```js
start() {
  Logger.info(`Listening to port ${this.#port}`);
  return new Promise((resolve) => {
    this.#httpServer = this.#app.listen(this.#port);
    this.#httpServer.on('close', resolve);
  });
}
```

`shutdown()` already calls `this.#httpServer?.close()`, which triggers `'close'` and resolves the promise — no change needed there.

### Step 2 — Update `WebServer` specs

Update `source/spec/lib/server/WebServer_spec.js` to assert that:
- `start()` returns a Promise
- The Promise resolves after `shutdown()` is called (i.e. after `'close'` fires)

## Files to Change

- `source/lib/server/WebServer.js` — `start()` returns a Promise resolving on `'close'`
- `source/spec/lib/server/WebServer_spec.js` — add/update tests for the Promise-based return value

## Notes

- `shutdown()` does not need to change: `this.#httpServer?.close()` already triggers the `'close'` event.
- The `PromiseAggregator` silently ignores `null`/`undefined`, so `webServer?.start()` (optional chaining when `webServer` is `null`) already works correctly — no change needed in `ApplicationInstance`.
