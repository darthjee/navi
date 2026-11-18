# Shutdown drains without clearing queues

In `source/lib/services/engine/EngineController.js`:

- Extract a private `async #drain()` holding the first half of `stop()`: `this.#state.set('stopping')`, `this.engine.pause()`, `await this.#waitForWorkersIdle()`.
- `stop()` becomes `await this.#drain(); JobRegistry.clearQueues(); this.#state.set('stopped'); this.engine.emit('stop');` — behavior unchanged for `stop()`, `restart()`, `reload()`.
- `shutdown()`: keep `this.serverController?.shutdown()`; when `this.#state.isRunning()`, call `await this.#drain()`, then `this.#state.set('stopped')` and `this.engine.emit('stop')` (so the `stop` listener still clears log/emission/extraction buffers) — **without** `JobRegistry.clearQueues()`. Then `this.engine.stop()` as today.

Specs in `source/spec/lib/services/engine/EngineController_lifecycle_spec.js` (`#shutdown` / `#stop` blocks; use `spyOn(JobRegistry, 'clearQueues')` and the existing `ctx` helpers):

- `#shutdown` when running: does not call `JobRegistry.clearQueues()`; pauses the engine; ends in state `stopped`; emits `stop`; calls `engine.stop()`.
- `#shutdown` when paused: does not pause again/drain, does not clear, calls `engine.stop()`.
- `#shutdown` called twice: `clearQueues` never called.
- `#shutdown` while state is `stopping` (a `stop()` in flight): skips its own drain; the in-flight `stop()` still calls `clearQueues()` (documents accepted edge case).
- Regression: `#stop` calls `clearQueues()`; `#restart` and `#reload` (when running) call `clearQueues()` (add to `EngineController_lifecycle_spec.js` or the existing restart/reload specs, whichever already covers them).

## Files to Change

- `source/lib/services/engine/EngineController.js` — `#drain()`, `stop()` refactor, `shutdown()` without clear, JSDoc.
- `source/spec/lib/services/engine/EngineController_lifecycle_spec.js` — shutdown/stop/restart/reload clear assertions.
