# Issue: Keep Engine Alive

## Description

Currently, when a stop is triggered through the API, the Engine is killed and a new one is created on the next start. This needs to change: the Engine lifecycle should be driven by a promise, and its behavior should differ based on whether the web UI is running or not.

## Problem

- The Engine is killed on API stop and recreated on start, which is fragile and prevents future features (e.g. retrying dead jobs).
- When the web UI is running, the Engine is killed when all jobs are processed, even though it should remain alive waiting for new work.
- There is no distinction between CI mode (no web) and web mode regarding Engine lifecycle.

## Expected Behavior

- **Without web UI (CI mode):** the Engine finishes its process as soon as there are no more jobs in the queue.
- **With web UI:** the Engine is never killed on stop (only on shutdown); it also keeps running when all jobs are processed, continuously checking for new jobs.
- The Engine lifecycle is driven by a promise: the Engine keeps running as long as its promise is active.
  - In CI mode: the promise resolves when the job queue is empty.
  - In web mode: the promise can only be resolved by an explicit API shutdown request.

## Solution

`Engine.start()` already returns a promise (it is an `async` method), stored as `#enginePromise` in `ApplicationInstance` and tracked by the `PromiseAggregator`. The existing promise infrastructure can be reused — no new promise mechanism is needed.

The changes required are:

- Add a `keepAlive` flag to `Engine`. When `true`, the loop condition becomes `while (!this.#stopped)` instead of `while (!this.#stopped && this.#continueAllocating())`, keeping the engine running even when the queue is empty.
- `ApplicationInstance` passes `keepAlive: !!this.webServer` when building the engine.
- In web mode, `stop()` only clears the queues and updates status — it does **not** call `engine.stop()`. The engine loop keeps running.
- In web mode, `continue()` and `start()` do **not** create a new engine — they just re-enqueue jobs and update the status.
- Only `shutdown()` calls `engine.stop()`, which sets `#stopped = true` and allows the loop (and its promise) to resolve.

## Benefits

- More robust Engine lifecycle management.
- Enables future features such as retrying dead jobs via the API.
- Clear separation between CI and web server operation modes.

---
See issue for details: https://github.com/darthjee/navi/issues/460
