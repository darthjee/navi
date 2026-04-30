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
- Add a `#paused` flag to `Engine` with `pause()` and `resume()` methods. When paused, the loop skips allocation but keeps iterating.
- `ApplicationInstance` passes `keepAlive: !!this.webServer` when building the engine.
- In web mode, `engine.start()` is called **once** during the initial `run()`. Its promise is never recreated — it only resolves on `shutdown()`.
- `pause()` in web mode calls `engine.pause()` (sets `#paused = true`), skipping allocation without exiting the loop.
- `stop()` in web mode calls `engine.pause()` and clears the job queues. The loop keeps running.
- `continue()` and `start()` in web mode call `engine.resume()` (clears `#paused`) and re-enqueue jobs. No new promise is created.
- Only `shutdown()` calls `engine.stop()` (sets `#stopped = true`), which exits the loop and resolves the promise.

## Behavior Table

| Event / Action | CI mode (no web UI) | Web mode |
|---|---|---|
| Queue empties naturally | Engine loop exits, promise resolves, process finishes | Engine loop keeps running (`keepAlive=true`) |
| `stop()` | *(not applicable — queue empties naturally)* | `engine.pause()` called, queues cleared — loop keeps running, promise stays alive |
| `pause()` | *(not applicable)* | `engine.pause()` called — allocation skipped, loop keeps running, promise stays alive |
| `continue()` | *(not applicable)* | `engine.resume()` called — allocation resumes, no new promise created |
| `start()` | *(not applicable)* | `engine.resume()` called, jobs re-enqueued — no new promise created |
| `restart()` | *(not applicable)* | `stop()` then `start()` — loop never stops, no new promise created |
| `shutdown()` | *(not applicable)* | `engine.stop()` called — loop exits, promise resolves, aggregator completes |

## Benefits

- More robust Engine lifecycle management.
- Enables future features such as retrying dead jobs via the API.
- Clear separation between CI and web server operation modes.

---
See issue for details: https://github.com/darthjee/navi/issues/460
