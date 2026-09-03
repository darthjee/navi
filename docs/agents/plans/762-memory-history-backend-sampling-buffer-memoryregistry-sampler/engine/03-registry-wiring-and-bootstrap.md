# Registry bootstrap wiring + test cleanup

Build `MemoryRegistry` during config load, guarded so it never builds without a `web:`
section, and make the shared test-reset helper aware of it.

## What to do

- In `ApplicationConfigurator.load()`, after the existing
  `LogRegistry.build` / `EmissionRegistry.build` / `ExtractionRegistry.build` calls, add:

  ```js
  if (config.webConfig) {
    MemoryRegistry.build({ retention: config.webConfig.memory.dataStoreSize });
  }
  ```

  The guard is required: `config.webConfig` is `null` when there is no `web:` section
  (unlike the other three registries, whose config sections always exist).
- Add `MemoryRegistry.reset()` to the `resetApplicationState()` method of
  `source/spec/support/utils/RegistryCleanupUtils.js`, alongside the existing
  `LogRegistry.reset()` / `EmissionRegistry.reset()` / `ExtractionRegistry.reset()`.
  Without it, the new `build()` causes "already built" failures in `Application_spec.js`,
  `Application_webServer_spec.js`, `RegistriesBuilder_spec.js` (which already call it).
- Spec: extend `ApplicationConfigurator_spec.js` —
  `MemoryRegistry.build({ retention: <dataStoreSize> })` is called when `webConfig` is
  present, and **not** called when there is no `web:` section. Reset `MemoryRegistry` in
  the spec's own teardown.

## Files to Change

- `source/lib/services/application/ApplicationConfigurator.js` — guarded
  `MemoryRegistry.build(...)` call + import.
- `source/spec/support/utils/RegistryCleanupUtils.js` — `MemoryRegistry.reset()` in
  `resetApplicationState()` + import.
- `source/spec/lib/services/application/ApplicationConfigurator_spec.js` — build-guard
  assertions + teardown reset.
