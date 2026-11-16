# Issue: Navi: wire onWorkerIdle to Engine#wake()

## Description

Adopt deku-swarm's `onWorkerIdle` hook and `Engine#wake()` (#1010) in navi's own app, so a freed worker gets its next job immediately instead of waiting up to `sleepMs` for the next tick.

## Problem

Navi builds its `WorkerFactory` in `source/lib/services/builders/RegistriesBuilder.js`, called from `ApplicationInstance#loadConfig()`. The `Engine` is only created later, in `ApplicationInstance#run()`, by `EngineController.build()` (`source/lib/services/engine/EngineController.js`). Without wiring, navi keeps pure tick polling, and each job completion can wait up to `sleepMs` before reallocation.

## Expected Behavior

- When a worker finishes a job (success or failure), the running engine is woken and allocates the next ready job right away, instead of on the next `sleepMs` tick.
- When no engine exists yet (before `run()`), the hook is a safe no-op.
- There is no config or API change.

## Solution

Responsible agent: **engine** (`source/`). Depends on #1010 being **merged to main**. The app links deku-swarm via `file:../deku-swarm`, so no npm release is needed.

### Wiring

- `RegistriesBuilder.build({ config, onWorkerIdle })` accepts an optional `onWorkerIdle` callback and passes it to its `WorkerFactory`. When it is omitted, `build({ config })` behaves as before.
- `ApplicationInstance` passes `() => this.#engineController?.engine?.wake()`. The callback resolves the engine when it is called, not when the factory is built.
- No new holder class and no static/global engine reference.

Why late binding:

- The factory is built in `loadConfig()`, before `run()` builds the engine.
- `WorkersRegistry.ensureBuild` is idempotent, so the factory and its callback are set up once per process.
- The `Engine` itself is built **once** per `run()`. `restart()`, `reload()`, `stop()` and `resumeProcessing()` reuse the same instance, so there are no engine rebuilds to track.

### Scope

In scope: the `RegistriesBuilder` pass-through and the `ApplicationInstance` wiring.

Out of scope:

- `EngineController#waitForWorkersIdle`, the separate `sleepMs` polling used during `pause()` and `stop()`. It keeps polling; the latency only affects pause and stop transitions.
- Navi adopting `Engine.shutdown({ timeoutMs })` or the status API.

### Edge cases

Navi adds no guards of its own beyond optional chaining. It relies on the `Engine#wake()` contract from #1010:

| Situation | Behavior |
|---|---|
| Hook fires before `run()` builds the engine | The optional chaining short-circuits, so it is a no-op. |
| Engine paused (`pause()` / `stop()`) | `wake()` ends the current sleep; the loop allocates nothing and sleeps again. This is harmless. |
| Engine loop stopped (after `shutdown()`) | `wake()` is a no-op when the loop isn't running. |
| Hook throws | Caught and logged at `warn` inside deku-swarm's `Worker`, so `perform()` still completes. |

### Versioning

Bump the app's patch version per the repo's cascade-bump rules. deku-swarm itself is not touched.

### Testing

Unit specs only, against real deku-swarm classes, with no timing assertions. The end-to-end wake behavior is covered by #1010's `Engine_wake_spec.js`.

- `source/spec/lib/services/builders/RegistriesBuilder_spec.js`:
  - With `onWorkerIdle`, a built worker invokes it after a job finishes, or after it fails.
  - Without it, `build({ config })` works as before.
- `source/spec/lib/services/application/ApplicationInstance_spec.js`:
  - The callback handed to `RegistriesBuilder` doesn't throw before `run()`.
  - After `run()`, invoking it calls the built engine's `wake()` (spy).

### Context

Follow-up to #1010 (deku-swarm only). Part of Epic #1004's area.

## Benefits

- Lower latency between jobs: throughput is no longer capped by `sleepMs` when the queue is busy.
- A larger `sleepMs` stops costing throughput, so idle polling can be relaxed later.
