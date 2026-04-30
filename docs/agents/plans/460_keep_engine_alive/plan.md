# Plan: Keep Engine Alive

## Overview

Change the Engine lifecycle so that in web mode the Engine loop runs continuously (driven by a single long-lived promise) and is only terminated by an explicit shutdown. In CI mode the existing behaviour is preserved: the loop exits when the job queue is empty.

## Context

- `Engine.start()` is already `async` and returns a promise stored as `#enginePromise` in `ApplicationInstance`.
- Currently the loop exits when `#stopped` is `true` **or** when there are no more jobs/busy workers, regardless of mode.
- `pause()`, `stop()`, `continue()`, and `start()` all kill and recreate the Engine instance, which is fragile.

## Plan Files

| File | Contents |
|---|---|
| [plan_engine.md](plan_engine.md) | `Engine` changes: `keepAlive`, `pause()`, `resume()` — with code snippets |
| [plan_application_instance.md](plan_application_instance.md) | `ApplicationInstance` lifecycle changes |
| [plan_specs.md](plan_specs.md) | Spec changes for `Engine` and `ApplicationInstance` |

## Implementation Order

1. `Engine` — add `keepAlive`, `#paused`, `pause()`, `resume()`
2. `ApplicationInstance` — update lifecycle methods, remove engine recreation
3. Server request handlers — verify/update if needed
4. Specs

## Files to Change

- `source/lib/services/Engine.js`
- `source/lib/services/ApplicationInstance.js`
- `source/lib/server/Engine*RequestHandler.js` — verify/update if needed
- `source/spec/lib/services/Engine_spec.js`
- `source/spec/lib/services/ApplicationInstance_spec.js`

## Notes

- In CI mode (`keepAlive=false`), `pause()`, `stop()`, `start()`, and `continue()` are never called — no behaviour change needed for that path.
- `#waitForWorkersIdle()` is still used by `pause()` and `stop()` to ensure workers finish their current job before status is updated.
- `buildEngine()` is called **only once**, in `run()`, at application startup.
- `engine.stop()` is the only method that exits the loop — in web mode it is only ever called by `shutdown()`.
