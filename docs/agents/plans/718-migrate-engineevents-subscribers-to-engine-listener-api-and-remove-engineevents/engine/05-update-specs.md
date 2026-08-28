# Update affected specs

The following specs assert the actual behavior being replaced, not just teardown boilerplate — they need real rewrites (and, along the way, should also drop their now-dead `EngineEvents` import/`.reset()` teardown call, same as step 04's list).

- `source/spec/lib/utils/logging/LogBufferCollection_spec.js`: remove the test that does `EngineEvents.emit('stop')` to prove buffers clear (line ~97) — `LogBufferCollection` no longer self-subscribes. Its `clear()` method should already have direct coverage elsewhere in this file; if not, add a direct `collection.clear()` test.
- `source/spec/lib/registry/LogRegistryInstance_spec.js`: add coverage for the new `clearBuffers()` method — push logs into both the job and worker buffers, call `clearBuffers()`, assert both are empty.
- `source/spec/lib/registry/LogRegistry_spec.js`: add coverage for the new static `clearBuffers()` delegate, following the pattern of its other static-delegate tests.
- `source/spec/lib/services/engine/EngineController_spec.js`:
  - Replace the `spyOn(EngineEvents, 'emit')` assertions (currently asserting `'stop'`/`'start'` in the `#stop`/`#start`/`finishRun` describe blocks) with assertions against the injected/spied `engine` object's `emit` method instead (`expect(engine.emit).toHaveBeenCalledWith('stop')`, etc.), and add coverage for the new `this.engine.emit('finish')` call in `finishRun()`.
  - Remove the `#finishRun` test that currently asserts `reporter.report` was called (~line 277-294) — `EngineController` no longer calls it directly; that behavior's coverage moves to `ApplicationInstance_spec.js` below. Also remove the `reporter` constructor param from any `EngineController` construction in this spec file that still passes it.
- `source/spec/lib/services/application/ApplicationInstance_spec.js`: add coverage for the new wiring added in step 03 — after `run()`, triggering `engine.emit('stop')` should call `LogRegistry.clearBuffers()` (or an equivalent spy-based check), and triggering `engine.emit('finish')` should call the injected `reporter.report({ failureConfig: ... })` — this is where the `#finishRun`-report test removed from `EngineController_spec.js` above should effectively move to.

## Files to Change

- `source/spec/lib/utils/logging/LogBufferCollection_spec.js` — remove the `EngineEvents`-driven clear test; ensure `clear()` still has direct coverage.
- `source/spec/lib/registry/LogRegistryInstance_spec.js` — add `clearBuffers()` coverage; drop dead `EngineEvents` import/teardown.
- `source/spec/lib/registry/LogRegistry_spec.js` — add static `clearBuffers()` coverage; drop dead `EngineEvents` import/teardown.
- `source/spec/lib/services/engine/EngineController_spec.js` — swap `EngineEvents.emit` assertions for `engine.emit` assertions, add `'finish'` coverage, remove the reporter-calling test and the `reporter` constructor param; drop dead `EngineEvents` import/teardown.
- `source/spec/lib/services/application/ApplicationInstance_spec.js` — add coverage for the `'stop'`/`'finish'` listener wiring; drop dead `EngineEvents` import/teardown.
