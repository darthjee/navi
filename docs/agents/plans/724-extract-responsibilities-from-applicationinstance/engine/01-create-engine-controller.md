# Create EngineController

Create the new `EngineController` class holding all engine processing-control/state-transition logic currently on `ApplicationInstance`. It owns transitions on a **shared** `EngineState` instance (injected, not owned) — `ApplicationInstance` keeps reading/writing the same instance via its own `status()`/`isRunning()`/`isPaused()`/`isStopped()`/`setStatus()`, which stay unchanged.

Constructor shape: `constructor({ state, config, sleepMs, reporter, reloadConfig, enqueueResources } = {})`, where:
- `state` — the shared `EngineState` instance passed in by `ApplicationInstance`.
- `config` — the `Config` instance (`ApplicationInstance#config`) at the time of construction. Only `config.failureConfig` is read today, but the whole object is stored per the issue's Option A decision (stable constructor for future config needs).
- `sleepMs` — the poll interval in ms, used by `#waitForWorkersIdle()`.
- `reporter` — defaults to `new RunReporter()` if omitted, matching `ApplicationInstance`'s current `#reporter ?? new RunReporter()` default pattern.
- `reloadConfig` — a callback invoked by `reload()`; `ApplicationInstance` passes `() => { NamespaceMap.include(ConfigIncluder.resolve(this.#configPath)); }`. Keeps `EngineController` free of any `NamespaceMap`/`ConfigIncluder`/`configPath` knowledge.
- `enqueueResources` — a callback invoked by `start()`; `ApplicationInstance` passes `names => this.enqueueResources(names)`. Stays stable after sub-issue #725 moves the real implementation into `ResourceQueueFacade` (only the body of `ApplicationInstance#enqueueResources` changes then, not this callback's shape).

Also add two plain public fields, set by `ApplicationInstance` right after `buildEngine()`/`buildWebServer()` run (mirroring how `ApplicationInstance` itself holds `this.engine`/`this.webServer` as plain fields today, not via setters):
- `engine` — the `Engine` instance built in `ApplicationInstance#buildEngine()`.
- `webServer` — the `WebServer|null` built in `ApplicationInstance#buildWebServer()`.

Move these methods verbatim from `ApplicationInstance` (see `source/lib/services/application/ApplicationInstance.js` for the current implementations), replacing `this.engine`/`this.#state`/`this.#sleepMs`/`this.#reporter`/`this.config`/`this.enqueueResources(names)` with the injected/shared equivalents described above:

- `pause()`
- `stop()`
- `continue()`
- `start(names, options)` — replace its `this.enqueueResources(names)` call with `this.#enqueueResources(names)`.
- `restart()`
- `reload()` — replace `NamespaceMap.include(ConfigIncluder.resolve(this.#configPath))` with `this.#reloadConfig()`.
- `shutdown()` — `this.webServer?.shutdown()` now reads `EngineController`'s own `webServer` field (same expression, new owner).
- `#waitForWorkersIdle()` (private)
- `finishRun()` — **public** (was `#finishRun()`, private, on `ApplicationInstance`). `ApplicationInstance#run()` (staying put) must be able to call it from outside, so it can no longer be private.

Do **not** move `#handleIdleTimeout()` — per the issue's decision, it is dropped entirely; `ApplicationInstance#buildEngine()`'s `onIdleTimeout` callback is rewired directly to `() => this.shutdown()` in step 02, so no idle-timeout method needs to exist here.

## Files to Change

- `source/lib/services/engine/EngineController.js` (new) — the class described above. Import `JobRegistry`, `WorkersRegistry` from `deku-swarm` (for `stop()`'s `JobRegistry.clearQueues()` and `#waitForWorkersIdle()`'s `WorkersRegistry.hasBusyWorker()`), `EngineEvents` from `../engine/EngineEvents.js`, `RunReporter` from `../execution/RunReporter.js` (for the constructor default).
