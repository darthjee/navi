# Plan: Keep Engine Alive

## Overview

Change the Engine lifecycle so that in web mode the Engine loop runs continuously (driven by a single long-lived promise) and is only terminated by an explicit shutdown. In CI mode the existing behaviour is preserved: the loop exits when the job queue is empty.

## Context

- `Engine.start()` is already `async` and returns a promise stored as `#enginePromise` in `ApplicationInstance`.
- Currently the loop exits when `#stopped` is `true` **or** when there are no more jobs/busy workers, regardless of mode.
- `pause()`, `stop()`, `continue()`, and `start()` all kill and recreate the Engine instance, which is fragile.

## Implementation Steps

### Step 1 — Add `keepAlive` flag to `Engine`

Change the loop condition to respect the mode:

```js
// CI mode (keepAlive = false, default)
while (!this.#stopped && this.#continueAllocating()) { ... }

// Web mode (keepAlive = true)
while (!this.#stopped) { ... }
```

`ApplicationInstance.buildEngine()` passes `keepAlive: !!this.webServer`.

### Step 2 — Add `pause()` and `resume()` to `Engine`

Add a `#paused` private flag. When paused, the loop skips allocation but keeps iterating:

```js
pause()  { this.#paused = true; }
resume() { this.#paused = false; }
```

Inside the loop, wrap the allocation block:

```js
if (!this.#paused && JobRegistry.hasReadyJob()) {
  this.allocator.allocate();
}
```

### Step 3 — Update `ApplicationInstance` lifecycle methods

In web mode, `engine.start()` is called **once** in `run()`. Its promise never recreates — only `shutdown()` resolves it.

| Method | Old behaviour | New behaviour (web mode) |
|---|---|---|
| `pause()` | `engine.stop()` + wait for idle | `engine.pause()` + wait for idle |
| `stop()` | `engine.stop()` + wait for idle + clear queues | `engine.pause()` + wait for idle + clear queues |
| `continue()` | `buildEngine()` + `engine.start()` | `engine.resume()` |
| `start()` | `buildEngine()` + `engine.start()` + enqueue | `engine.resume()` + enqueue |
| `shutdown()` | `engine.stop()` (unchanged) | `engine.stop()` (unchanged) |

Remove all `buildEngine()` calls from `continue()` and `start()`. `buildEngine()` is called **only once**, in `run()`, at application startup.

### Step 4 — Update server request handlers

The handlers call `Application.pause()`, `Application.stop()`, etc. The status transitions (`pausing → paused`, `stopping → stopped`) are managed inside `ApplicationInstance`, so handler response logic should remain unchanged. Verify each handler still returns the correct HTTP status codes and response bodies after the `ApplicationInstance` changes.

### Step 5 — Update specs

- `Engine_spec.js`: add tests for `keepAlive` (loop continues when queue is empty), `pause()` (allocation skipped), `resume()` (allocation resumes), and `stop()` (loop exits).
- `ApplicationInstance_spec.js`: update tests for `pause()`, `stop()`, `continue()`, and `start()` to verify no new Engine is created in web mode and that the promise is reused.
- Server handler specs: verify existing behaviour is preserved after the `ApplicationInstance` changes.

## Files to Change

- `source/lib/services/Engine.js` — add `keepAlive`, `#paused`, `pause()`, `resume()`
- `source/lib/services/ApplicationInstance.js` — update `buildEngine()`, `pause()`, `stop()`, `continue()`, `start()`
- `source/lib/server/Engine*RequestHandler.js` — verify/update if needed
- `source/spec/lib/services/Engine_spec.js` — new tests for keepAlive and pause/resume
- `source/spec/lib/services/ApplicationInstance_spec.js` — updated lifecycle tests

## Notes

- In CI mode (`keepAlive=false`), `pause()`, `stop()`, `start()`, and `continue()` are never called — no behaviour change needed for that path.
- `#waitForWorkersIdle()` is still used by `pause()` and `stop()` to ensure workers finish their current job before the status is updated.
- `engine.stop()` continues to be the only method that exits the loop — in web mode it is only ever called by `shutdown()`.
