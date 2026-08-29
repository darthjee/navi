# Update specs for both classes

Update `source/spec/lib/services/engine/EngineController_spec.js` and `source/spec/lib/services/application/ApplicationInstance_spec.js` to match steps 01–03. The existing `ApplicationInstance_spec.js` already has coverage for `buildEngine()` and for the `stop`/`finish` event wiring — that coverage needs to move onto `EngineController`, not be re-derived from scratch, since the behavior itself is unchanged (only which class owns it moves).

## `EngineController_spec.js` — add coverage

- `describe('#buildEngine', ...)` — port the three existing tests from `ApplicationInstance_spec.js`'s `describe('#buildEngine', ...)` (idle-timeout wiring, no-early-shutdown, no-web-config-disables-timeout). Adjust construction to `EngineController`'s DI shape (`state`, `config` via constructor, not `configStore`) and swap `instance.shutdown` spies for `controller.shutdown` spies (already exists on `EngineController`).
- `describe('#bind', ...)` — port the two event-wiring tests from `ApplicationInstance_spec.js`'s `#run` describe (`'clears the log buffers when the engine emits stop'`, `'reports the run outcome when the engine emits finish'`), adapted to call `controller.bind(reporter)` directly and assert via `controller.engine.emit('stop'|'finish')`, using the same `buildFakeEngine()`-style fake (with `on`/`emit`) — the file doesn't have one yet, add a local helper mirroring `ApplicationInstance_spec.js`'s `buildFakeEngine()`.
- `describe('.build', ...)` — new tests: constructs a controller with `engine` set (from `buildEngine()`) and bound (spy on `bind`/`buildEngine` and assert both are called; assert the returned controller's `config` equals `configStore.config`); verify the `reloadConfig` closure calls `NamespaceMap.include(ConfigIncluder.resolve(configStore.entryFilePath))` (spy on both statics).
- `describe('#launch', ...)` — new tests: `launch(true)` sets state to `'running'` and calls `engine.start()` without calling `engine.pause()`; `launch(false)` calls `engine.pause()`, sets state to `'stopped'`, then calls `engine.start()`; both return whatever `engine.start()` resolves to.

## `ApplicationInstance_spec.js` — remove/adjust

- Remove the top-level `instance.engine = { stop, pause, resume }` assignment in the outer `beforeEach` (lines ~48–52) — `ApplicationInstance` no longer has an `.engine` property.
- Remove `describe('#buildEngine', ...)` entirely (ported to `EngineController_spec.js` above).
- In `describe('#run', ...)`: replace `spyOn(instance, 'buildEngine').and.returnValue(buildFakeEngine())` with `spyOn(EngineController.prototype, 'buildEngine').and.returnValue(buildFakeEngine())` (same pattern already used for `EngineController.prototype.finishRun` in this file) — `buildEngine` now lives on `EngineController`, called internally by `EngineController.build`.
- Remove `'clears the log buffers when the engine emits stop'` and `'reports the run outcome when the engine emits finish'` (ported to `EngineController_spec.js`'s new `#bind` describe) — `ApplicationInstance_spec.js` no longer has a reachable `instance.engine` to emit on.
- In `describe('when web.autostart is false', ...)`: `instance.buildEngine.and.returnValue(engine)` becomes `EngineController.prototype.buildEngine.and.returnValue(engine)`; the assertion `expect(engine.pause).toHaveBeenCalled()` stays valid since `EngineController#launch(false)` still calls `this.engine.pause()`.
- In `describe('delegation to EngineController', ...)`: same `spyOn(instance, 'buildEngine')` → `spyOn(EngineController.prototype, 'buildEngine')` swap in its `beforeEach`.
- Keep `spyOn(instance, 'buildWebServer')` as-is everywhere — `WebServer` construction is untouched (deferred to #736).

## Files to Change
- `source/spec/lib/services/engine/EngineController_spec.js` — add `#buildEngine`, `#bind`, `.build`, `#launch` coverage as described above.
- `source/spec/lib/services/application/ApplicationInstance_spec.js` — remove the ported coverage and swap `buildEngine` stub targets from `instance` to `EngineController.prototype`, per the list above.

## Notes
- Run `cd source && npm run coverage` after these changes to confirm both spec files pass and coverage doesn't regress.
