# Switch EngineController to the instance-scoped Engine API and add the 'finish' event

`EngineController` currently emits on the global `EngineEvents` singleton and directly calls `this.#reporter.report(...)` from `finishRun()`. Both change: emits move to `this.engine` (the specific `Engine` instance it already holds), and the run-completion report is no longer `EngineController`'s job — it becomes a `'finish'` event that `ApplicationInstance` listens for (step 03), decoupling `EngineController` from `RunReporter` entirely.

- `stop()`: replace `EngineEvents.emit('stop')` with `this.engine.emit('stop')`.
- `start()`: replace `EngineEvents.emit('start')` with `this.engine.emit('start')`.
- `finishRun()`: replace `EngineEvents.emit('stop')` with `this.engine.emit('stop')` (buffer-clearing still needs to fire on true completion, same as any other stop), then add `this.engine.emit('finish')`, and **remove** the `this.#reporter.report({ failureConfig: this.config.failureConfig })` call — that responsibility moves entirely to the `'finish'` listener `ApplicationInstance` wires in step 03.
- Remove the `#reporter` field, the `reporter` constructor parameter, and the `RunReporter` import from `EngineController.js` — nothing in this class needs `RunReporter` anymore.
- Remove the `EngineEvents` import.

## Files to Change

- `source/lib/services/engine/EngineController.js` — swap `EngineEvents.emit(...)` for `this.engine.emit(...)` in `stop()`/`start()`/`finishRun()`; add the new `'finish'` emit in `finishRun()`; drop the `#reporter` field, `reporter` constructor param, the direct `reporter.report(...)` call, and the now-unused `RunReporter`/`EngineEvents` imports.
