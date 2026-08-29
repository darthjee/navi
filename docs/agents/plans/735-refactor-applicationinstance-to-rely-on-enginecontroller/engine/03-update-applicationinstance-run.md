# Update ApplicationInstance.run() to use EngineController.build/launch

Rewrite `ApplicationInstance.run()` to construct `EngineController` via the new `EngineController.build(...)` (step 02) instead of `new EngineController({...})` + manual `this.engine = this.buildEngine()` + manual `this.engine.on('stop', ...)`/`this.engine.on('finish', ...)` wiring. Remove `buildEngine()` from `ApplicationInstance` entirely (it now lives on `EngineController`, step 01).

Also route the autostart branch and the initial engine-loop kickoff through `EngineController#launch(shouldAutostart)` (step 02) instead of touching `this.engine` directly.

Target shape of `run()`:

```javascript
async run() {
  this.#aggregator = new PromiseAggregator();
  this.#sleepMs = this.config.workersConfig.sleep;

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
}
```

Notes on what stays unchanged, to avoid scope creep:
- `this.webServer = this.buildWebServer()` and `this.#engineController.webServer = this.webServer` stay exactly as today — `WebServer` extraction is out of scope (#736).
- `this.#aggregator` usage stays exactly as today — aggregator-driven controller starts are out of scope (#737).
- `enqueueFirstJobs()`, `enqueueResources()`, `#shouldAutostart()`, and all delegate methods (`pause`, `stop`, `continue`, `start`, `restart`, `reload`, `shutdown`, `status`, `isRunning`, `isPaused`, `isStopped`, `setStatus`) are untouched.
- No more `this.engine` field/reference should remain anywhere in `ApplicationInstance.js` after this step — grep the file for `this.engine` and `buildEngine` to confirm the removal is complete (the `Engine` import from `deku-swarm` becomes unused and should be removed from `ApplicationInstance.js`'s import list too).

## Files to Change
- `source/lib/services/application/ApplicationInstance.js` — remove `buildEngine()`, remove the now-unused `Engine` import, rewrite `run()` per the shape above.
