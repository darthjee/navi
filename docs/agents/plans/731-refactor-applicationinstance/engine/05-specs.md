# Update source specs

## `ApplicationInstance_spec.js`

`this.config` is now a getter with no setter, so the 5 direct assignments
(`instance.config = { workersConfig: {...}, ... }` at ~lines 85, 107, 127, 158, 211)
would throw. Replace them with the new `configStore` DI seam:

```js
const configStore = { config: { workersConfig: { sleep: -1 }, webConfig: {...} } };
instance = new ApplicationInstance({ configStore });
```

- A plain object duck-typing `ConfigStore` is enough — the `config` getter only reads
  `.config`. (Use a real `ConfigStore` instance where a test also needs
  `bufferedLogger` / `entryFilePath`.)
- The `instance.config.webConfig = { autostart: false }` mutation (~line 193) keeps
  working — it mutates the object returned by the getter (same reference held in
  `configStore.config`); just make sure that block's `instance` was built with a
  `configStore` whose `config` is mutable.
- Reorder so `instance` is constructed with its `configStore` before the
  `instance.engine = {...}` / `instance.setStatus('running')` setup from the
  top-level `beforeEach` where needed (extract a small local helper if it reduces
  churn).
- No `workers` was ever passed here, so the constructor change is otherwise
  transparent.

## `RegistriesBuilder_spec.js`

- The `build({ config, workers })` case "initializes workers using the configured
  quantity" passes a fresh `IdentifyableCollection` and asserts `workers.size()`.
  `workers` is gone — rewrite the assertion to observe the built pool via
  `WorkersRegistry.stats().idle` (equals the configured quantity, 5 for
  `sample_config.yml`) after `builder.build({ config })`.
- All other `builder.build({ config })` calls are already in the new shape.
- `afterEach` still calls `RegistryCleanupUtils.resetApplicationState()` — unchanged.

## `Application_spec.js`, `Application_webServer_spec.js`, `Application_threshold_spec.js`

All three share the run-scenario helper shape:

```js
app.loadConfig(...);                 // real WorkersRegistry built via RegistriesBuilder
WorkersRegistry.reset();
WorkersRegistry.build({ quantity: 1, factory: workerFactory });
WorkersRegistry.initWorkers();
JobFactory.registry('ResourceRequestJob', jobFactory);
```

Move to **mock-first** ordering (issue acceptance criterion), dropping the
`reset()` + rebuild dance:

```js
WorkersRegistry.build({ quantity: 1, factory: workerFactory });
WorkersRegistry.initWorkers();
app.loadConfig(...);                  // WorkersRegistry.ensureBuild -> no-op; JobRegistry.ensureBuild builds real
JobFactory.registry('ResourceRequestJob', jobFactory);   // stays AFTER loadConfig (RegistriesBuilder would overwrite it)
```

- `workerFactory` is already built in `beforeEach` before the helper runs, so it is
  available.
- `afterEach` `RegistryCleanupUtils.resetApplicationState()` unchanged — it still
  `WorkersRegistry.reset()` / `JobRegistry.reset()` between examples, so each
  example's mock-first build starts from a clean singleton.
- The `Application_spec` `#loadConfig` describe block (no pre-built pool, just
  `app.loadConfig` + assertions) needs no change — `ensureBuild` on a null instance
  behaves exactly like `build`.

## Files to Change

- `source/spec/lib/services/application/ApplicationInstance_spec.js` — `configStore` DI seam replacing `instance.config = {...}`.
- `source/spec/lib/services/application/Application_spec.js` — mock-first run-scenario ordering.
- `source/spec/lib/services/application/Application_webServer_spec.js` — mock-first ordering.
- `source/spec/lib/services/application/Application_threshold_spec.js` — mock-first ordering.
- `source/spec/lib/services/builders/RegistriesBuilder_spec.js` — `stats().idle` instead of `workers.size()`; drop the `workers` injection.
