# Plan: Fix Server Shutdown

## Overview
The `PATCH /engine/shutdown` endpoint already exists and calls `Application.shutdown()` → `ApplicationInstance.shutdown()` → `WebServer.shutdown()`. The bug is that `WebServer.shutdown()` only calls `httpServer.close()`, which stops new connections but does NOT close existing keep-alive connections. This causes `run()` to hang indefinitely waiting for the web server promise to resolve.

## Context
`ApplicationInstance.run()` starts both the engine and the web server and waits for both via a `PromiseAggregator`:

```js
this.#aggregator.add(this.webServer?.start());   // resolves on httpServer 'close' event
this.#aggregator.add(this.engine.start());        // resolves when engine loop exits
await this.#aggregator.wait();                    // waits for BOTH
```

`WebServer.start()` returns a promise that resolves only when the underlying `httpServer` emits `close`. `httpServer.close()` alone stops new connections but emits `close` only after ALL connections are gone. Since the shutdown request itself is an HTTP keep-alive connection, it stays open after the response is sent, so `close` never fires and `run()` never returns.

`WebServer.shutdown()` (current):
```js
shutdown() {
  this.#httpServer?.close();   // stops new connections only
  return this.#startPromise;
}
```

`ApplicationInstance.shutdown()` (current — already correct structure):
```js
async shutdown() {
  this.webServer?.shutdown();
  if (this.#engineStatus === 'running') {
    await this.stop();
  }
  this.engine.stop();
}
```

## Implementation Steps

### Step 1 — Fix `WebServer.shutdown()` to close all connections
After calling `httpServer.close()`, also call `httpServer.closeAllConnections()` to forcibly close all existing connections (including the idle keep-alive connection left by the shutdown request after its response has been sent).

Use `setImmediate` so that `closeAllConnections()` runs after the current event-loop tick — i.e., after the HTTP response has been flushed to the network and the connection has become idle:

```js
shutdown() {
  this.#httpServer?.close();
  setImmediate(() => this.#httpServer?.closeAllConnections());
  return this.#startPromise;
}
```

### Step 2 — Add tests for `ApplicationInstance.shutdown()`
Add a `#shutdown` describe block to `ApplicationInstance_spec.js` verifying:
- It calls `webServer.shutdown()` when a web server is present
- It stops the engine (`engine.stop()` is called)
- It does not throw when `webServer` is null/undefined

### Step 3 — Add/update tests for `WebServer.shutdown()`
The existing `#shutdown` spec verifies the happy path (no active connections). Consider adding a test that verifies `closeAllConnections` is called (using a spy on the `httpServer`).

## Files to Change
- `source/lib/server/WebServer.js` — add `setImmediate(() => closeAllConnections())` to `shutdown()`
- `source/spec/lib/server/WebServer_spec.js` — update/add tests for `shutdown()` with connection-closing behavior
- `source/spec/lib/services/ApplicationInstance_spec.js` — add `#shutdown` test block

## Notes
- `closeAllConnections()` was added in Node.js 18.2.0. The project targets `darthjee/node:0.2.1`; if that image runs Node < 18.2, a manual socket-tracking approach is needed instead.
- `closeIdleConnections()` (Node 18.2+) is a gentler alternative that only closes idle connections, but since we use `setImmediate`, by the time the callback fires the shutdown-request connection is already idle — either approach should work.
- `ApplicationInstance.shutdown()` already has the correct structure; no changes needed there unless tests reveal otherwise.
