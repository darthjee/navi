# Wire ApplicationInstance as thin coordinator

Rewire `ApplicationInstance` to delegate to the four new collaborators from steps 01–04, replacing their extracted logic in place, while its public API and every spec-locked behavior stay exactly as before.

- Constructor: `constructor({ workers, state, registriesBuilder, configurator, reporter } = {})`. Each of `state`, `registriesBuilder`, `configurator`, `reporter` defaults independently when not injected (e.g. `state ?? new EngineState()`), so both `new ApplicationInstance()` and partial injection (e.g. `new ApplicationInstance({ state: fake })`) keep working.
- `loadConfig(configPath)`: set `this.#configPath = configPath`, call `this.#configurator.load(configPath)` for `{ config, bufferedLogger }`, assign `this.config`/`this.#bufferedLogger`, then call `this.#registriesBuilder.build({ config, workers: this.#workers })`. Remove the private `#initRegistries()` method entirely — its body now lives in `RegistriesBuilder`.
- `status()`, `setStatus(value)`, `isRunning()`, `isPaused()`, `isStopped()`: delegate to `this.#state.get()` / `this.#state.set(value)` / the matching predicate. Remove the `#engineStatus` private field.
- Every other place that currently does `this.#engineStatus = '<value>'` (`pause`, `stop`, `continue`, `start`, `run`, the `#finishRun` tail) switches to `this.#state.set('<value>')`.
- `#finishRun()`: keep `this.#state.set('stopped')` and `EngineEvents.emit('stop')` here (lifecycle), replace the call to `#printRunSummary()` with `this.#reporter.report({ failureConfig: this.config.failureConfig })`. Remove the private `#printRunSummary()` method entirely — its body now lives in `RunReporter`.
- Everything else (`buildEngine`, `buildWebServer`, `pause`, `stop`, `continue`, `start`, `restart`, `reload`, `shutdown`, `run`, `enqueueFirstJobs`, `enqueueResources`, `#shouldAutostart`, `#handleIdleTimeout`, `#waitForWorkersIdle`) stays as today, only updated where it touched `#engineStatus` directly (see above).
- `EngineEvents` import/usage is untouched — do not remove it (its removal is out of scope, tracked in issue [#718](https://github.com/darthjee/navi/issues/718)).
- Update `source/spec/lib/services/ApplicationInstance_spec.js`: the `#run`-reporting-tail assertions (building/logging `RunSummary`, invoking `FailureChecker`) move to `RunReporter_spec.js` (step 04) — remove or adapt the now-redundant coverage here so it isn't duplicated, while every other existing test (the full "Behavior locked by tests" contract from the issue) keeps passing unchanged, including direct access to `instance.engine`, `instance.webServer`, `instance.config`, and `instance.setStatus`.
- Confirm `source/spec/lib/services/Application_spec.js` and `source/spec/lib/services/Application_webServer_spec.js` still pass unmodified — they exercise `ApplicationInstance` through the static `Application` facade and should be unaffected by an internal delegation change.

## Files to Change
- `source/lib/services/ApplicationInstance.js` — constructor DI, delegate to the four collaborators, remove `#initRegistries()`/`#printRunSummary()`, replace `#engineStatus` with `#state`.
- `source/spec/lib/services/ApplicationInstance_spec.js` — remove/adapt the reporting-tail assertions now covered by `RunReporter_spec.js`; keep everything else passing.
