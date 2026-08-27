# Issue: Refactor ApplicationInstance

## Description
`source/lib/services/ApplicationInstance.js` is **381 lines** and mixes six distinct responsibilities into a single class, instead of following the project's existing pattern of small collaborator classes (`ResourceEnqueuer`, `LogRegistry`, `ConfigIncluder`, `PromiseAggregator`).

### Responsibilities mixed into ApplicationInstance

| Responsibility | Current methods / fields | Notes |
| --- | --- | --- |
| Config loading | `loadConfig()`, `#configPath`, `#bufferedLogger` | Builds `Config` via `Config.fromFile`, creates `LogRegistry`/buffered logger |
| Registry/job bootstrap | `#initRegistries()` | Largest block: registers job factories, builds `ParserRegistry`, `JobRegistry`, `WorkersRegistry`, calls `initWorkers()` |
| Engine lifecycle (state machine) | `buildEngine()`, `pause()`, `stop()`, `continue()`, `start()`, `restart()`, `reload()`, `shutdown()`, `status()`, `setStatus()`, `isRunning()`, `isPaused()`, `isStopped()` | Identity of the class |
| Web server | `buildWebServer()`, `#webServer` shutdown | Small |
| Resource enqueueing | `enqueueFirstJobs()`, `enqueueResources()` | Already delegates to `ResourceEnqueuer` |
| Reporting | tail of `run()` | Builds `RunSummary`, logs report, runs `FailureChecker` |

### Private fields

`#workers`, `#bufferedLogger`, `#engineStatus`, `#aggregator`, `#enginePromise`, `#sleepMs`, `#configPath`.

### Imports (~20)

`Engine`, `JobFactory`, `JobRegistry`, `WorkerFactory`, `WorkersRegistry` (from `deku-swarm`), plus Navi services, exceptions, jobs, models, parsers, registries, server, and utils.

## Problem
`ApplicationInstance` violates the Single Responsibility Principle: config loading, registry/job bootstrap, engine lifecycle, web server wiring, resource enqueueing, and run reporting are all implemented directly on the class, making it too big and harder to test each concern in isolation. It needs to be refactored by extracting responsibilities, mirroring the small-collaborator pattern already used elsewhere in the codebase.

## Solution

Keep `ApplicationInstance` as a **thin coordinator** that owns the engine lifecycle and delegates everything else to injected collaborators. Public API is preserved (delegation), so the existing specs keep passing.

| New file | Responsibility | Absorbs from ApplicationInstance |
| --- | --- | --- |
| `EngineState` | Engine status value object (`running`/`pausing`/`paused`/`stopping`/`stopped`) + predicates | `#engineStatus`, `status()`, `setStatus()`, `isRunning()`, `isPaused()`, `isStopped()` |
| `RegistriesBuilder` | Bootstrap: register job factories, build `ParserRegistry`, `JobRegistry`, `WorkersRegistry`, call `initWorkers()` | `#initRegistries()` (the largest block) |
| `ApplicationConfigurator` | Config loading + `LogRegistry`/buffered logger | `loadConfig()` |
| `RunReporter` | Post-run report: `RunSummary` + log + failure decision | tail of `run()` |

Each new file gets a mirrored spec at `source/spec/lib/services/_spec.js`, following the `_spec.js` convention.

### Naming — confirmed final

`EngineState` / `RegistriesBuilder` / `ApplicationConfigurator` / `RunReporter`. No collisions in `source/lib/`; `RegistriesBuilder` matches the existing `NamespaceMapBuilder` precedent, the others match the existing agent-noun style (`ResourceEnqueuer`, `ConfigIncluder`, `PromiseAggregator`).

### Dependency injection

`ApplicationInstance` constructor accepts the collaborators (extending the existing `{ workers }` DI):

```js
constructor({ workers, state, registriesBuilder, configurator, reporter } = {})
```

Defaults are built internally when not injected, so callers and tests that construct `new ApplicationInstance()` keep working.

### Behavior locked by tests (must be preserved)

`source/spec/lib/services/ApplicationInstance_spec.js` and `source/spec/lib/services/Application_spec.js` lock the following contract:

- `pause` → pauses the engine **without stopping**; status `paused`.
- `stop` → **does not recreate the engine** (same instance); pauses; status `stopped`; emits `EngineEvents.emit('stop')`.
- `continue` → **does not create a new engine**; `resume()`; status `running`; no-op when not `paused`.
- `start` → **does not create a new engine**; `resume()`; emits `'start'`; enqueues default set via `enqueueFirstJobs`, or delegates to `enqueueResources(names)` and **returns** `{ enqueued, skippedResources }`; `undefined` when not `stopped`; with `{ enqueue: false }` transitions to `running` without enqueueing.
- `reload` → `stop()` before `start()`; `ConfigIncluder.resolve()` merged into `NamespaceMap` **between** stop and start; no-op when not `running`.
- `shutdown` → `webServer.shutdown()` + `engine.stop()`; does not throw without a web server.
- `buildEngine` → wires `web.idle_timeout` into the `Engine` and calls `shutdown()` when it expires; disables idle-timeout without `webConfig`.
- `run` → prints the `RunSummary` **before** running `FailureChecker.check()`; with `web.autostart: false` boots into `paused`/`stopped` without enqueueing.

The specs access `instance.engine`, `instance.webServer`, `instance.config`, and `instance.setStatus` directly — **this surface is contract**.

### Edge cases / constraints (verified against current code + specs)

- **`EngineState` must not leak through the public API.** `ApplicationInstance_spec.js` calls `instance.setStatus('running')` and asserts `instance.status()` via `.toBe('running')` — plain strings in and out (see e.g. lines 22, 43, 56, 76, 195, 213, 225). `status()`/`setStatus()` keep their string-in/string-out signature regardless of what `EngineState` looks like internally.
- **Collaborators can't capture `config` at construction time.** `ApplicationInstance`'s constructor runs before `loadConfig()` is ever called, but `RegistriesBuilder`, `ApplicationConfigurator`, and `RunReporter` all need `this.config` (and `RegistriesBuilder` also needs `#workers`). If injected via the constructor, they must be stateless services invoked later with config/workers passed as method arguments — not objects that capture config as a field at construction.
- **Undefined initial status.** Before `setStatus`/`run()` is ever called, `#engineStatus` is `undefined`, and `isRunning()`/`isPaused()`/`isStopped()` all return `false`. `EngineState`'s default must represent "no status yet" without throwing.
- **Direct `instance.engine =` stubbing.** The spec assigns a plain object directly to `instance.engine` (bypassing `buildEngine()`) to spy on `pause`/`stop`/`resume`. `engine` must stay a plain public field untouched by any new collaborator — nothing should wrap or proxy it.
- **Partial DI.** `new ApplicationInstance({ state: fake })` must still default-build the other three collaborators independently — each constructor param needs its own independent default, not an all-or-nothing DI object.

### EngineEvents — kept, not removed

An earlier pass at this issue claimed `EngineEvents` had no subscribers and could be removed here. That's **incorrect** — verified by reading the code:

- Only `ApplicationInstance` emits (`stop()` emits `'stop'`, `start()` emits `'start'`).
- All HTTP handlers (`EngineStartHandler`, `EngineStopHandler`, `EngineStatusHandler`, `ApiEngineStartHandler`) use the static `Application` facade instead — no bus usage there.
- `WebServer` does not use the bus.
- **`source/lib/common/utils/logging/LogBufferCollection.js:19` does subscribe**: `EngineEvents.on('stop', () => this.clear())`. `LogBufferCollection` backs both the job-log and worker-log buffers in `LogRegistryInstance`, so this clears log buffers on every engine stop/restart — real, live production behavior, not test-only wiring.
- `EngineEvents_spec.js` only tests the bus mechanism itself (`on`/`emit`/`reset`).

So `EngineEvents` stays as-is in this issue; `EngineEvents.emit('stop')` / `emit('start')` calls stay wired (in `ApplicationInstance`, or moved alongside the status transitions into `EngineState` — an implementation detail, not a behavior change). Full removal — migrating `LogBufferCollection`, `FailureChecker`, and `EngineStopService` off the bus onto a generic `Engine` listener API, then deleting `EngineEvents.js`/`EngineEvents_spec.js` — is tracked as sub-issue [#718](https://github.com/darthjee/navi/issues/718).

### Implementation order

1. Extract `EngineState` (value object + predicates).
2. Extract `RegistriesBuilder` (the bootstrap block).
3. Extract `ApplicationConfigurator` (config loading).
4. Extract `RunReporter` (reporting tail of `run()`).
5. Keep `EngineEvents` as-is (real subscriber — `LogBufferCollection`; removal deferred to [#718](https://github.com/darthjee/navi/issues/718)).
6. Keep `ApplicationInstance` as thin coordinator with injected collaborators and preserved public API.
7. Add specs for each new collaborator; update `ApplicationInstance_spec.js` where `#run`/reporting tests migrate to `RunReporter`.

### Test impact

| Spec | Impact |
| --- | --- |
| `ApplicationInstance_spec.js` | Mostly green if public API preserved; `#run` reporting tests migrate to `RunReporter` |
| `Application_spec.js` | Preserved if `loadConfig` still exposes `config`/`bufferedLogger` |
| `Application_threshold_spec.js` | Exit-code path moves with `FailureChecker` (part of [#718](https://github.com/darthjee/navi/issues/718)) |
| `Application_webServer_spec.js` | Unchanged (web server stays in coordinator) |
| `EngineEvents_spec.js` | Unchanged (bus kept this phase; removal deferred to [#718](https://github.com/darthjee/navi/issues/718)) |
| New specs | `EngineState_spec.js`, `RegistriesBuilder_spec.js`, `ApplicationConfigurator_spec.js`, `RunReporter_spec.js` |

### Performance & security considerations

Not applicable beyond the general refactor-safety concerns already covered above: this is a pure internal SRP extraction — no new I/O, no new external inputs, no algorithmic complexity change, and no new attack surface. The one behavior-adjacent risk (accidentally breaking `LogBufferCollection`'s stop-triggered buffer clearing) is called out under "EngineEvents — kept, not removed" above.

## Benefits
- Each collaborator has a single, testable responsibility, matching the project's existing small-collaborator pattern.
- Config loading, registry/job bootstrap, and run reporting can be unit-tested in isolation instead of only through `ApplicationInstance`'s integration-style specs.
- `ApplicationInstance` shrinks to just the engine lifecycle it's named for, making that state machine easier to read and reason about.
- Corrects and de-risks a prior misreading of `EngineEvents` before it could silently break `LogBufferCollection`'s log-clearing behavior, and gives the deferred bus removal ([#718](https://github.com/darthjee/navi/issues/718)) a clean, correctly-scoped follow-up.
