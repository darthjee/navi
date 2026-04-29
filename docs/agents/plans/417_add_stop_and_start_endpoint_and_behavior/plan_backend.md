# Plan: Backend — Engine Control and Enqueue Gating

## Context

The Engine needs to be stoppable mid-run. The cleanest approach is an internal stop-flag
that the Engine's loop checks on each tick — when set, the loop exits and the Engine's
promise resolves naturally. `Application` owns the status transitions and sets the flag.

## Implementation

### Step 1 — Add stop-flag to `Engine`

In `source/lib/services/Engine.js`, add a private `#stopped = false` field.

- Add `stop()` method that sets `#stopped = true`.
- In the main loop (`run()` or equivalent), check `this.#stopped` at the top of each
  iteration; if true, break out of the loop.

The Engine's `start()` promise resolves naturally when the loop exits.

### Step 2 — Status transition logic in `Application`

Add the following static methods to `Application` (delegating to `ApplicationInstance`):

| Method | Behaviour |
|--------|-----------|
| `Application.pause()` | Sets status → `'pausing'`. Calls `engine.stop()`. Once `WorkersRegistry.hasBusyWorker()` is false (poll or hook), sets status → `'paused'`. |
| `Application.stop()` | Sets status → `'stopping'`. Calls `engine.stop()`. Once workers are idle, clears all job queues (`JobRegistry.reset()` or equivalent clear), sets status → `'stopped'`. |
| `Application.continue()` | Only valid from `'paused'`. Creates a new Engine (`buildEngine()`), adds its promise to the existing `PromiseAggregator`, sets status → `'running'`, starts the Engine. |
| `Application.start()` | Only valid from `'stopped'`. Creates a new Engine, adds its promise to aggregator, calls `enqueueFirstJobs()`, sets status → `'running'`, starts the Engine. |
| `Application.restart()` | Only valid when `'running'`. Calls `stop()` internally (waits for `'stopped'`), then calls `start()`. |

**Waiting for workers to finish (pause/stop):**  
After setting the stop-flag, the Engine loop will exit on its own once the current tick
finishes. Workers already executing a job finish their current job (they are not interrupted).
`Application` needs to wait until `WorkersRegistry.hasBusyWorker() === false` before
completing the status transition. This can be done by polling in a tight async loop with a
short sleep (re-use the Engine's `sleepMs` value), or by hooking into the Worker finish
callback — use the polling approach for simplicity.

### Step 3 — Enqueue gating

Any job enqueued as a side-effect of job execution must be skipped when the engine is not
`'running'`. The 4 call-sites to guard:

| File | Call |
|------|------|
| `source/lib/models/ActionEnqueuer.js` | `this.#jobRegistry.enqueue('Action', ...)` |
| `source/lib/models/AssetRequestEnqueuer.js` | `this.#jobRegistry.enqueue('AssetDownload', ...)` |
| `source/lib/models/ResourceRequestAction.js` | `this.#jobRegistry.enqueue('ResourceRequestJob', ...)` |
| `source/lib/models/ResourceRequest.js` | `jobRegistry.enqueue('HtmlParse', ...)` |

In each, add a guard at the top of the enqueue method:

```js
if (Application.status() !== 'running') return;
```

`Application.enqueueFirstJobs()` does NOT need this guard — it is only called explicitly
from `start()` / `restart()` when the status is already transitioning to `'running'`.

### Step 4 — Update specs

- `source/spec/lib/services/Engine_spec.js` — add coverage for `stop()` flag behaviour.
- `source/spec/lib/services/Application_spec.js` — add coverage for each status transition.
- `source/spec/lib/models/ActionEnqueuer_spec.js` — add coverage for gated enqueue.
- `source/spec/lib/models/AssetRequestEnqueuer_spec.js` — add coverage for gated enqueue.
- `source/spec/lib/models/ResourceRequestAction_spec.js` — add coverage for gated enqueue.
- `source/spec/lib/models/ResourceRequest_spec.js` — add coverage for gated enqueue.

## Files to Change

- `source/lib/services/Engine.js` — add `#stopped` flag and `stop()` method
- `source/lib/services/Application.js` — add `pause()`, `stop()`, `continue()`, `start()`,
  `restart()` static methods + `PromiseAggregator` instance kept across Engine restarts
- `source/lib/models/ActionEnqueuer.js` — enqueue gate
- `source/lib/models/AssetRequestEnqueuer.js` — enqueue gate
- `source/lib/models/ResourceRequestAction.js` — enqueue gate
- `source/lib/models/ResourceRequest.js` — enqueue gate
- `source/spec/lib/services/Engine_spec.js`
- `source/spec/lib/services/Application_spec.js`
- `source/spec/lib/models/ActionEnqueuer_spec.js`
- `source/spec/lib/models/AssetRequestEnqueuer_spec.js`
- `source/spec/lib/models/ResourceRequestAction_spec.js`
- `source/spec/lib/models/ResourceRequest_spec.js`
