# Wire the 'stop'/'finish' listeners in ApplicationInstance

`ApplicationInstance` is the only place with access to both the already-built `LogRegistry` singleton (built during `loadConfig()`, before `Engine` exists) and the freshly-built `engine` instance (built in `run()`), so it's where the two listener subscriptions belong.

In `run()`, immediately after `this.engine = this.buildEngine();`, add:

```js
this.engine.on('stop', () => LogRegistry.clearBuffers());
this.engine.on('finish', () => this.#reporter.report({ failureConfig: this.config.failureConfig }));
```

Also stop forwarding `reporter: this.#reporter` into the `new EngineController({...})` call — `EngineController` no longer accepts that parameter (step 02). `ApplicationInstance` keeps its own `#reporter` field/constructor injection exactly as today (still needed here, and still overridable in tests) — only the forwarding into `EngineController` is removed.

Add the missing `LogRegistry` import (`source/lib/registry/LogRegistry.js`) to `ApplicationInstance.js`.

## Files to Change

- `source/lib/services/application/ApplicationInstance.js` — add the `LogRegistry` import, wire the two `engine.on(...)` subscriptions right after `buildEngine()`, and drop the `reporter` key from the `EngineController` constructor call.
