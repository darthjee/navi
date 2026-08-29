# Issue: Refactor ApplicationInstance to rely on EngineController

## Description
`ApplicationInstance` (`source/lib/services/application/ApplicationInstance.js`) currently shares engine construction and lifecycle responsibilities with `EngineController` (`source/lib/services/engine/EngineController.js`): it builds the `Engine` instance itself, wires its `stop`/`finish` event listeners inline, and manually constructs `EngineController` in `run()` — even though `EngineController` already owns the engine's pause/stop/continue/start/restart/reload/shutdown lifecycle.

## Problem
Because `ApplicationInstance.run()` builds the `Engine`, wires its events, and touches `this.engine` directly (`engine.pause()`, `engine.start()`) alongside constructing `EngineController` by hand, engine construction/lifecycle knowledge is split across two classes instead of living entirely in `EngineController`. This duplication makes future changes to engine wiring (e.g. adding new lifecycle events, or swapping how the engine is constructed) require touching both files, and blurs the boundary between "orchestrates the app lifecycle" (`ApplicationInstance`) and "owns the engine" (`EngineController`).

## Expected Behavior
No observable behavior change. The application starts, autostarts/pauses, processes jobs, reports, and shuts down identically to today; `ApplicationInstance`'s public API (`pause`, `stop`, `continue`, `start`, `restart`, `reload`, `shutdown`, `status`, etc.) keeps the same external signatures and behavior. This is purely an internal wiring refactor.

## Solution

### Scope

**In scope:**
- `EngineController` gains a static `build` factory and a `bind` instance method (see below).
- `EngineController` also takes over building the `Engine` instance itself (`buildEngine`, currently on `ApplicationInstance`).
- `EngineController` gains a `launch` instance method that owns the initial autostart-branch pause and the one-time `engine.start()` kickoff, moved from `ApplicationInstance.run()`.
- `ApplicationInstance.run()` stops constructing `EngineController` and building the engine manually, and uses `EngineController.build` + `EngineController#launch` instead.

**Explicitly out of scope (spun off separately):**
- Extracting `WebServer` construction/lifecycle out of `ApplicationInstance` into a `ServerController` — tracked in #736.
- Changing `PromiseAggregator` (or adding an aggregator controller) to accept a set of controllers and call `start()` on each — tracked in #737.
- `ResourceQueueFacade`, `ApplicationConfigurator`, `RegistriesBuilder` — unrelated collaborators, not touched here.
- Any change to `ApplicationInstance`'s public API — this is an internal wiring refactor, not an API change.
- `EngineState` and `WorkersRegistry` — used as-is, no changes to their contracts.

### `EngineController` (`source/lib/services/engine/EngineController.js`)

- add static method `build`
- add instance method `buildEngine` (moved from `ApplicationInstance`)
- add instance method `bind`
- add instance method `launch`
- store `reporter` on a new `#reporter` private field so `bind`'s `finish` handler can use it
- `build`'s `reloadConfig` closure imports `NamespaceMap`/`ConfigIncluder` directly in `EngineController.js` (new imports for this file) instead of having `ApplicationInstance` construct the closure and pass it in

#### new static method `build`

Creates a new `EngineController`, builds its `Engine`, and does the event bindings.

```javascript
static build({ state, configStore, sleepMs, enqueueResources, reporter }) {
  const controller = new EngineController({
    state,
    config: configStore.config,
    sleepMs,
    reloadConfig: () => NamespaceMap.include(ConfigIncluder.resolve(configStore.entryFilePath)),
    enqueueResources,
  });

  controller.engine = controller.buildEngine();
  controller.bind(reporter);
  return controller;
}
```

#### new method `buildEngine`

Moved from `ApplicationInstance.buildEngine()` — same behavior, now referencing the controller's own `config`/`sleepMs` and calling `this.shutdown()` (which already exists on `EngineController`) on idle timeout instead of `ApplicationInstance`'s.

```javascript
buildEngine() {
  return new Engine({
    sleepMs: this.#sleepMs ?? this.config.workersConfig.sleep,
    keepAlive: !!this.config.webConfig,
    idleTimeoutMs: (this.config.webConfig?.idleTimeout ?? 0) * 1000,
    onIdleTimeout: () => this.shutdown(),
  });
}
```

#### new method `bind`

```javascript
bind(reporter) {
  this.#reporter = reporter;
  this.engine.on('stop', () => LogRegistry.clearBuffers());
  this.engine.on('finish', () => this.#reporter.report({ failureConfig: this.config.failureConfig }));
}
```

#### new method `launch`

Replaces the direct `this.engine.pause()` / `this.engine.start()` calls that `ApplicationInstance.run()` makes today. Takes the autostart decision (still computed by `ApplicationInstance.#shouldAutostart()`, since that reads `this.config.webConfig?.autostart`) as a plain boolean, so `ApplicationInstance` never touches `.engine` directly.

```javascript
launch(shouldAutostart) {
  if (!shouldAutostart) {
    this.engine.pause();
    this.#state.set('stopped');
    return this.engine.start();
  }
  this.#state.set('running');
  return this.engine.start();
}
```

#### existing delegate methods
`start`, `pause` (and `stop`, `continue`, `restart`, `reload`, `shutdown`) already delegate to `engine` — no change needed there, this issue only adds construction/binding on top.

### `ApplicationInstance` (`source/lib/services/application/ApplicationInstance.js`)
- remove `buildEngine()` (moved to `EngineController`)
- remove references to engine and rely on `EngineController`
- builds `EngineController` using `EngineController.build` instead of `new EngineController(...)` + manual event wiring
- `run()`'s autostart branch and initial engine start now go through `EngineController#launch(this.#shouldAutostart())` instead of touching `this.engine` directly:

```javascript
this.#engineController = EngineController.build({
  state: this.#state,
  configStore: this.#configStore,
  sleepMs: this.#sleepMs,
  enqueueResources: names => this.enqueueResources(names),
  reporter: this.#reporter,
});
this.webServer = this.buildWebServer();
this.#engineController.webServer = this.webServer;

if (this.#shouldAutostart()) {
  this.enqueueFirstJobs();
}

this.#aggregator.add(this.webServer?.start());
this.#enginePromise = this.#engineController.launch(this.#shouldAutostart());
this.#aggregator.add(this.#enginePromise);

await this.#aggregator.wait();
this.#engineController.finishRun();
```

- `webServer` construction/assignment stays on `ApplicationInstance` for now (deferred to #736), so `run()` still builds and starts the web server itself alongside the controller

## Benefits
- `EngineController` becomes the single owner of engine construction, event wiring, and lifecycle — `ApplicationInstance` no longer touches `.engine` directly.
- Clears a well-defined path for the two related follow-ups already spun off from this discussion: #736 (`ServerController`, mirroring this same split for `WebServer`) and #737 (aggregator-driven controller starts).
- No change to `ApplicationInstance`'s public API — safe to land without touching call sites.
