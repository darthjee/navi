# Issue: Engine: expose status and last error information

## Description

Give the `deku-swarm` `Engine` observable, serializable status and last-error information, so a host can tell at any time whether the engine is idle, running, paused, draining, stopping, stopped or crashed — and why it crashed — without awaiting `start()`.

## Problem

`Engine` exposes no state. A host cannot tell whether the engine is running, paused, stopped or has crashed, and when `start()` rejects, the failure is visible only to whoever awaited it. A host that runs the engine in the background (e.g. a web server with `keepAlive: true`) can end up with a silently dead pool and no way to report it, for instance from a health/status endpoint.

Job failures are already caught inside `Worker.perform()`, so a "crash" here means the **loop itself** threw — e.g. from `promoteReadyJobs()`, `allocator.allocate()`, `hasReadyJob()`/`hasJob()`/`hasBusyWorker()`, or a synchronous throw from `onIdleTimeout`.

Found while adding background workers to Kerghan (darthjee/kerghan#479): today Kerghan can only log the error and keep serving. Related: #1004 (graceful `shutdown()` drain).

## Expected Behavior

- `engine.status` returns one of: `idle` (never started), `running`, `paused`, `draining`, `stopping`, `stopped`, `crashed`.
- `engine.snapshot()` returns a plain, JSON-serializable object, readable at any time, without awaiting `start()`:

  ```js
  {
    status: 'crashed',
    startedAt: 1731700000000,   // epoch ms of the last start(), or null
    stoppedAt: 1731700005000,   // epoch ms the last loop exited, or null while running / never run
    lastTickAt: 1731700004900,  // epoch ms of the last loop iteration, or null
    lastError: { name: 'TypeError', message: '...', at: 1731700005000 } // or null
  }
  ```

  Every call returns a fresh object (mutating it never affects the engine). `lastError` holds only `name`, `message` and `at` — never the raw `Error` (not serializable).
- A host can distinguish "stopped on request / ran out of work" (`stopped`) from "crashed" (`crashed`).
- When the loop throws, the engine records `lastError`, sets status `crashed`, emits a `'crash'` event with the original `Error` via the existing emitter (`engine.on('crash', err => ...)`), and `start()` still rejects with that same error (current behaviour preserved).
- A later `start()` moves status back to `running` and refreshes `startedAt`; `lastError` is **kept** until a new crash overwrites it.

## Solution

Scope: `deku-swarm` only. Adopting the new data in navi's `source/` (`EngineState` / status endpoint) is a follow-up issue.

### Status derivation (`deku-swarm/lib/services/Engine.js`)

| Status | When |
|---|---|
| `idle` | `start()` has never been called |
| `running` | loop running, not paused, not draining, `stop()` not called |
| `paused` | loop running and `pause()` is in effect |
| `draining` | loop running and a `shutdown()` drain is in progress |
| `stopping` | loop running and `stop()` has been called (the current tick still finishes) |
| `stopped` | loop exited normally (no work left, `stop()`, or drain finished/timed out) |
| `crashed` | loop exited because it threw |

Precedence while the loop is running: `stopping` > `draining` > `paused` > `running`. After exit, `crashed` vs `stopped` depends only on whether the last run threw.

### Implementation notes

- New private fields: `#startedAt`, `#stoppedAt`, `#lastTickAt`, `#lastError`, `#crashed` (reuse the existing `#running`).
- `start()`: set `#startedAt = Date.now()`, clear `#crashed` and `#stoppedAt` (not `#lastError`); update `#lastTickAt` once per iteration; wrap the loop in `try/catch/finally` — on `catch`, record `#lastError = { name, message, at }`, set `#crashed`, emit `'crash'` with the error, and **rethrow**; in `finally` set `#stoppedAt` (alongside the existing drain-settling logic from #1009).
- The `'crash'` emit must not mask the original error: wrap the emit so a throwing listener does not replace the rejection reason. The event name is deliberately not `'error'` (Node's `EventEmitter` throws on an unhandled `'error'`).
- `status` is a getter; `snapshot()` builds a new plain object each call.
- JSDoc for the new getter, method and event; update the class doc comment.

### Specs

New `deku-swarm/spec/services/Engine_status_spec.js` covering: `idle` before start; `running`; `paused`; `draining` during `shutdown()`; `stopping` after `stop()` mid-loop; `stopped` after natural exit and after `stop()`; `crashed` when a stubbed registry/allocator throws (status, `lastError` shape, `'crash'` event payload, `start()` still rejects with the same error); a throwing `'crash'` listener does not change the rejection; restart after crash keeps `lastError` and returns to `running`; `snapshot()` is JSON round-trippable and a fresh object each call; timestamps set/updated as described.

### Docs

Document `status`, `snapshot()` and the `'crash'` event in `docs/guides/deku-swarm/running-the-engine.md` and `docs/guides/deku-swarm/reference.md`.

### Versioning

Minor bump of `deku-swarm` (new public API) via `scripts/bump_version.sh deku-swarm <next minor>`, plus the cascade patch bump of the app (`scripts/bump_version.sh app`), verified with `scripts/ci.sh cascade-bump-check`.

## Benefits

- Hosts (Kerghan, navi itself later) can expose engine health over an API instead of silently serving with a dead pool.
- Crashes become observable without holding on to the `start()` promise.
- Plain-data shape keeps serialization trivial and decoupled from internals.
