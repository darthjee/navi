# Add buildEngine and bind to EngineController

Move `ApplicationInstance.buildEngine()` onto `EngineController` as an instance method, and add a new `bind(reporter)` instance method that wires the `stop`/`finish` engine event listeners currently set up inline in `ApplicationInstance.run()`.

`buildEngine()` keeps identical behavior, but reads `this.#sleepMs`/`this.config` (already present on `EngineController`) instead of `ApplicationInstance`'s, and its `onIdleTimeout` callback calls `this.shutdown()` — which now resolves to `EngineController#shutdown()` (already implemented) instead of `ApplicationInstance#shutdown()`. Net effect on behavior is the same, since `ApplicationInstance#shutdown()` already just delegates to `this.#engineController.shutdown()`.

`bind(reporter)` stores `reporter` on a new `#reporter` private field (add it alongside the existing `#state`/`#sleepMs`/`#reloadConfig`/`#enqueueResources` fields) before attaching the listeners, since the `finish` listener needs it:

```javascript
bind(reporter) {
  this.#reporter = reporter;
  this.engine.on('stop', () => LogRegistry.clearBuffers());
  this.engine.on('finish', () => this.#reporter.report({ failureConfig: this.config.failureConfig }));
}
```

Add the two new imports this file needs: `Engine` from `deku-swarm` (already imported there as `JobRegistry, WorkersRegistry`, extend that import) and `LogRegistry` from `../../registry/LogRegistry.js` (same relative path `ApplicationInstance.js` uses, adjusted for `EngineController.js`'s location one level deeper).

## Files to Change
- `source/lib/services/engine/EngineController.js` — add `Engine`/`LogRegistry` imports, add `#reporter` private field, add `buildEngine()` and `bind(reporter)` instance methods.
