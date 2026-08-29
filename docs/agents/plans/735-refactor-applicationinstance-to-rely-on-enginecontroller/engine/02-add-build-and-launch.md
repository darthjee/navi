# Add build and launch to EngineController

Add a static `build` factory that constructs an `EngineController`, builds its `Engine` via `buildEngine()` (from step 01), and calls `bind(reporter)` (from step 01):

```javascript
static build({ state, configStore, sleepMs, enqueueResources, reporter }) {
  const controller = new EngineController({
    state,
    config: configStore.config,
    sleepMs,
    reloadConfig: () => NamespaceMap.include(ConfigIncluder.resolve(configStore.entryFilePath)),
    enqueueResources,
  });

  controller.engine = controller.buildEngine();
  controller.bind(reporter);
  return controller;
}
```

This moves the `reloadConfig` closure construction out of `ApplicationInstance` and into `EngineController`, so add the two new imports it needs: `NamespaceMap` from `../../registry/NamespaceMap.js` and `ConfigIncluder` from `../config/ConfigIncluder.js` (same relative paths `ApplicationInstance.js` currently uses, valid unchanged from `EngineController.js`'s location).

Also add a `launch(shouldAutostart)` instance method that replaces the direct `this.engine.pause()` / `this.engine.start()` calls `ApplicationInstance.run()` makes today for the autostart branch and the one-time engine-loop kickoff:

```javascript
launch(shouldAutostart) {
  if (!shouldAutostart) {
    this.engine.pause();
    this.#state.set('stopped');
    return this.engine.start();
  }
  this.#state.set('running');
  return this.engine.start();
}
```

Note `launch` takes the autostart decision as a plain boolean — the decision itself (`config.webConfig?.autostart ?? true`) stays computed by `ApplicationInstance.#shouldAutostart()`, only the branching/engine calls move.

## Files to Change
- `source/lib/services/engine/EngineController.js` — add `NamespaceMap`/`ConfigIncluder` imports, add static `build({ state, configStore, sleepMs, enqueueResources, reporter })` and instance method `launch(shouldAutostart)`.
