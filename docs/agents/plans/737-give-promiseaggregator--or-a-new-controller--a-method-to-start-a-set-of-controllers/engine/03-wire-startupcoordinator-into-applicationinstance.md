# Wire StartupCoordinator into ApplicationInstance

Replace `ApplicationInstance`'s manual per-controller promise wiring (`#aggregator` + `#enginePromise`) with the new `StartupCoordinator` from step 02, now that both `EngineController#start()` and `ServerController#start()` (step 01) share a uniform no-arg contract.

- Remove the `#aggregator` and `#enginePromise` private fields; add a `#startupCoordinator` field, instantiated in `run()` (`this.#startupCoordinator = new StartupCoordinator();`) in place of `this.#aggregator = new PromiseAggregator();`.
- Replace the manual add/launch block:
  ```javascript
  this.#aggregator.add(this.#serverController.start());
  this.#enginePromise = this.#engineController.launch(this.#shouldAutostart());
  this.#aggregator.add(this.#enginePromise);
  ```
  with:
  ```javascript
  this.#startupCoordinator.startAll([this.#serverController, this.#engineController]);
  ```
  (server started before engine, preserving today's order).
- Replace `await this.#aggregator.wait();` with `await this.#startupCoordinator.wait();`.
- Remove the now-unused `PromiseAggregator` import from `ApplicationInstance.js`; add the `StartupCoordinator` import instead.

## Files to Change

- `source/lib/services/application/ApplicationInstance.js` — remove `#aggregator`/`#enginePromise` fields and the `PromiseAggregator` import; add `#startupCoordinator` field and `StartupCoordinator` import; update `run()` as described above.
- `source/spec/lib/services/application/ApplicationInstance_spec.js` — update any specs asserting `PromiseAggregator`/`#aggregator` usage or `#enginePromise` to instead assert against `StartupCoordinator`/`#startupCoordinator` (`startAll` called with `[serverController, engineController]`, `wait()` awaited before `finishRun()`).
