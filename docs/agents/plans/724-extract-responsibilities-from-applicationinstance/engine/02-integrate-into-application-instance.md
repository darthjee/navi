# Integrate EngineController into ApplicationInstance

Wire the new `EngineController` (step 01) into `ApplicationInstance`, keeping every existing public method name/signature so `Application.js` needs zero changes.

Remove `pause()`, `stop()`, `continue()`, `start(names, options)`, `restart()`, `reload()`, `shutdown()`, `#waitForWorkersIdle()`, `#finishRun()`, and `#handleIdleTimeout()` from `ApplicationInstance`, and their now-unused imports (`EngineEvents`, `NamespaceMap`, `ConfigIncluder`, `RunReporter` if no longer referenced directly — check `#reporter` default usage below before removing).

Add thin public delegators, each forwarding to `this.#engineController`:

```js
async pause() { return this.#engineController.pause(); }
async stop() { return this.#engineController.stop(); }
async continue() { return this.#engineController.continue(); }
async start(names = [], options = {}) { return this.#engineController.start(names, options); }
async restart() { return this.#engineController.restart(); }
async reload() { return this.#engineController.reload(); }
async shutdown() { return this.#engineController.shutdown(); }
```

Add a new private field `#engineController`, constructed inside `run()` — not the constructor — since it needs `this.config`/`this.#sleepMs`, which are only set once `run()` starts (see [engine.md](../engine.md)'s Notes for why this timing is safe):

```js
async run() {
  this.#aggregator = new PromiseAggregator();
  this.#sleepMs = this.config.workersConfig.sleep;

  this.#engineController = new EngineController({
    state: this.#state,
    config: this.config,
    sleepMs: this.#sleepMs,
    reporter: this.#reporter,
    reloadConfig: () => NamespaceMap.include(ConfigIncluder.resolve(this.#configPath)),
    enqueueResources: names => this.enqueueResources(names),
  });

  this.engine = this.buildEngine();
  this.webServer = this.buildWebServer();
  this.#engineController.engine = this.engine;
  this.#engineController.webServer = this.webServer;

  if (this.#shouldAutostart()) {
    this.enqueueFirstJobs();
    this.#state.set('running');
  } else {
    this.engine.pause();
    this.#state.set('stopped');
  }

  this.#aggregator.add(this.webServer?.start());
  this.#enginePromise = this.engine.start();
  this.#aggregator.add(this.#enginePromise);

  await this.#aggregator.wait();
  this.#engineController.finishRun();
}
```

Note the `this.engine.pause()` call in the non-autostart branch stays exactly as-is — it's raw engine manipulation done during boot, not one of the extracted state-transition methods, and was never part of the "Proposed Extraction" list in the issue.

Update `buildEngine()`'s `onIdleTimeout` wiring per the issue's decision — drop the `#handleIdleTimeout()` indirection entirely:

```js
onIdleTimeout: () => this.shutdown(),
```

(was `onIdleTimeout: () => this.#handleIdleTimeout()`, which just called `this.shutdown()` anyway).

Import `EngineController` from `../engine/EngineController.js`.

## Files to Change

- `source/lib/services/application/ApplicationInstance.js` — remove the seven moved methods plus `#waitForWorkersIdle`/`#finishRun`/`#handleIdleTimeout`; add the seven thin delegators; construct/wire `#engineController` in `run()`; rewire `onIdleTimeout`; update imports (drop `EngineEvents`, `NamespaceMap`, `ConfigIncluder` if `ApplicationInstance` no longer references them directly; add `EngineController`).
