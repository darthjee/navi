# RegistriesBuilder: drop workers, use ensureBuild

`build({ config, workers })` → `build({ config })`.

- Remove the `workers` param and its JSDoc `@param` line.
- `WorkersRegistryInstance` already defaults `workers = new IdentifyableCollection()`,
  so the `WorkersRegistry.ensureBuild(...)` call simply stops passing `workers`.
- Swap `JobRegistry.build({ cooldown: config.workersConfig.retryCooldown, maxRetries: config.workersConfig.maxRetries })`
  → `JobRegistry.ensureBuild({ ...same... })`.
- Swap `WorkersRegistry.build({ factory: new WorkerFactory({...}), ...config.workersConfig })`
  → `WorkersRegistry.ensureBuild({ factory: new WorkerFactory({...}), ...config.workersConfig })`.
- Keep the trailing `WorkersRegistry.initWorkers()` call as-is — it is now idempotent
  on the `worker` side, so a second `RegistriesBuilder.build` (spec pre-built the
  registry) neither throws nor doubles the pool.
- The `JobFactory.build('...')` registrations are unchanged (out of scope — they
  still overwrite last-write-wins).

## Files to Change

- `source/lib/services/builders/RegistriesBuilder.js` — `build` signature, `ensureBuild`
  swap for both registries, JSDoc.
