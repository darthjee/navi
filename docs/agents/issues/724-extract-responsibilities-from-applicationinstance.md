# Issue: Extract responsibilities from ApplicationInstance

## Description

`ApplicationInstance` (`source/lib/services/application/ApplicationInstance.js`, 328 lines, 10 private fields, 18 methods) accumulates four distinct responsibilities despite previous extractions (`ApplicationConfigurator`, `RegistriesBuilder`, `RunReporter`, `ResourceEnqueuer`):

1. **Boot / Lifecycle** — `loadConfig()`, `run()`, `buildEngine()`, `buildWebServer()`, `#shouldAutostart()`
2. **Engine State Machine** — `status()`, `isRunning()`, `isPaused()`, `isStopped()`, `setStatus()`, `#handleIdleTimeout()`
3. **Engine Processing Control** — `pause()`, `stop()`, `continue()`, `start()`, `restart()`, `reload()`, `shutdown()`, `#waitForWorkersIdle()`, `#finishRun()`
4. **Resource Enqueuing** — `enqueueFirstJobs()`, `enqueueResources(names)`

## Problem

The class still centralizes too much instance-level logic across unrelated concerns, making each responsibility harder to reason about and test in isolation.

## Expected Behavior

This is a pure structural refactor: all existing public behavior of `ApplicationInstance`, and transitively of the `Application` static facade, must be preserved exactly. `Application.js` requires zero changes.

## Solution

### Scope

This issue covers only the `EngineController` extraction. The `ResourceQueueFacade` extraction (enqueueing responsibility) was split off into sub-issue #725, since it's a trivial, independent, lower-risk change better landed as its own PR.

### Proposed Extraction: `EngineController`

Move these methods to a new `EngineController` class:

- `pause()` — async, sets state to 'pausing', pauses engine, waits for idle
- `stop()` — async, pauses, waits for idle, clears queues, emits stop event
- `continue()` — async, resumes from 'paused' state
- `start(names, options)` — async, resumes from 'stopped', enqueues resources
- `restart()` — async, stop() + start()
- `reload()` — async, stop() + re-read config + start()
- `shutdown()` — async, shuts down web server + stops engine
- `#waitForWorkersIdle()` — private, polls `WorkersRegistry`
- `finishRun()` — **public** (not private as in the current `ApplicationInstance` implementation): `run()` stays in `ApplicationInstance` and must call `this.#engineController.finishRun()` after its promise aggregator resolves, so this can no longer be a private method internal to `EngineController`.

**Remains in `ApplicationInstance`:**
- `loadConfig()`, `run()`, `buildEngine()`, `buildWebServer()`, `#shouldAutostart()`
- `enqueueFirstJobs()`, `enqueueResources()` (until sub-issue #725 extracts these into `ResourceQueueFacade`)
- `status()`, `isRunning()`, `isPaused()`, `isStopped()`, `setStatus()`
- `bufferedLogger` getter

### Boot Sequence Gaps

**`finishRun()` call site** — `run()` (staying in `ApplicationInstance`) calls `this.#finishRun()` today after its `PromiseAggregator` resolves. Since `finishRun` is now public on `EngineController` (see above), `run()` must call `this.#engineController.finishRun()` instead.

**`onIdleTimeout` wiring** — `buildEngine()` (staying in `ApplicationInstance`) currently wires `onIdleTimeout: () => this.#handleIdleTimeout()`, where `#handleIdleTimeout` just delegates to `shutdown()`. Decision: drop `#handleIdleTimeout` entirely and wire `onIdleTimeout: () => this.shutdown()` directly, using `ApplicationInstance`'s own public `shutdown()` delegator (see Public API Preservation below). No `#handleIdleTimeout` method needs to exist in `EngineController`.

### Shared Contracts to Resolve

**`this.config`** — Of the methods moving to `EngineController`, only `finishRun()` actually reads config (`failureConfig`); `buildEngine()` and `#shouldAutostart()` — the other config readers — stay behind in `ApplicationInstance`. Despite that narrow need, decision: inject the full `ConfigHolder` into `EngineController` anyway (Option A), favoring a stable constructor if `EngineController` needs more config fields later, over minimizing today's injected surface.

**`this.#state` (`EngineState`)** — Read by `ApplicationInstance` (`status()`, `isRunning()`, `isPaused()`, `isStopped()`, `setStatus()`, all staying), but written by every processing-control method moving to `EngineController` (`pause()`, `stop()`, `continue()`, `start()`, etc.). Both classes must share the **same** `EngineState` instance — `ApplicationInstance` keeps constructing/receiving `#state` exactly as it does today, and passes that same reference into `EngineController`'s constructor, so both classes read/write one shared state machine rather than two disconnected copies.

**`this.engine`** — Created in `buildEngine()` during boot, but used by all processing-control methods. `EngineController` must receive the engine reference **after** boot via setter or post-construction injection.

**`this.#configPath`** — Only used in `reload()`. Either moves with `EngineController` or is injected as a `reloadConfig` callback (cleaner — avoids exposing the path).

**`this.#sleepMs`** — Used in `#waitForWorkersIdle()` and `buildEngine()`. Injected into `EngineController` at boot time.

**`this.#reporter`** — Only used in `finishRun()`. Decision: `ApplicationInstance`'s constructor keeps accepting the existing `reporter` DI param (used today by tests, e.g. `new ApplicationInstance({ reporter })`) and forwards it into the `EngineController` it constructs, rather than requiring tests to construct `EngineController` directly to inject a reporter spy.

**`enqueueResources` callback** — `start(names, options)` currently calls `this.enqueueResources(names)`, but `enqueueResources` stays on `ApplicationInstance` (until sub-issue #725 extracts it into `ResourceQueueFacade`). Once `start()` moves to `EngineController`, it needs an `enqueueResources` callback injected at construction (e.g. `names => this.enqueueResources(names)`) rather than a direct reference back to `ApplicationInstance`. This callback signature stays stable even after #725 moves the real implementation into `ResourceQueueFacade`.

### Public API Preservation

`Application.js` (the static singleton facade) calls `pause()`, `stop()`, `continue()`, `start()`, `restart()`, `reload()`, and `shutdown()` directly on the `ApplicationInstance` singleton — none of these calls should need to change.

Decision: `ApplicationInstance` keeps thin public delegator methods for all seven, each forwarding to the extracted `EngineController` (e.g. `pause() { return this.#engineController.pause(); }`). This mirrors the pattern `Application.js` already uses to delegate to `ApplicationInstance`, requires zero changes to `Application.js`, and keeps `EngineController` encapsulated behind `ApplicationInstance` rather than exposing it as a public getter.

This also affects the existing spec: `source/spec/lib/services/application/ApplicationInstance_spec.js` currently tests pause/stop/continue/start/restart/reload/shutdown behavior directly against `ApplicationInstance`, including setting `instance.engine` by hand. Once extracted, `ApplicationInstance_spec.js` should shrink to verifying pure delegation (each method calls through to `#engineController`), while the actual behavioral tests (state transitions, engine interaction, idle-wait polling, event emission) move to a new `EngineController_spec.js`.

### Suggested File Location

`EngineController` → `source/lib/services/engine/EngineController.js`, colocated with the existing engine-lifecycle siblings `EngineState.js` and `EngineEvents.js`.

(`ResourceQueueFacade`'s suggested location — `source/lib/services/application/ResourceQueueFacade.js` — is tracked in sub-issue #725.)

## Benefits

- Isolates all engine processing-control/state-transition logic (pause/stop/continue/start/restart/reload/shutdown, idle-wait polling, run finalization) into a single-purpose `EngineController`, reducing `ApplicationInstance` to boot/lifecycle and (temporarily) resource-enqueuing concerns.
- Each extracted class becomes independently unit-testable without constructing a full `ApplicationInstance`.
- Establishes the delegator pattern that sub-issue #725 (`ResourceQueueFacade`) will reuse for its own trivial extraction.
