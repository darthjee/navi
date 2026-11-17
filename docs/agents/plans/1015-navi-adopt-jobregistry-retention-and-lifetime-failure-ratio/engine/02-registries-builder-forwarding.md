# RegistriesBuilder forwarding

In `RegistriesBuilder#build`:

1. Forward retention to the job registry only when set:

   ```js
   const { maxRetries, retryCooldown: cooldown, quantity, retention } = config.workersConfig;
   ...
   JobRegistry.ensureBuild({ cooldown, maxRetries, ...(retention ? { retention } : {}) });
   ```

2. Replace the `...config.workersConfig` spread passed to `WorkersRegistry.ensureBuild` with an explicit `quantity`:

   ```js
   WorkersRegistry.ensureBuild({
     factory: new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, loggerFactory, onWorkerIdle }),
     quantity,
   });
   ```

   Before removing the spread, grep `source/lib` to confirm nothing reads `retryCooldown` / `sleep` / `maxRetries` from the `WorkersRegistry` instance (`WorkersRegistryInstance` only destructures `quantity`, `factory`, `workers`, `busy`, `idle`, `jobRegistry`, `workersRegistry`).

Specs (`RegistriesBuilder_spec.js`):
- `JobRegistry.ensureBuild` receives `retention` when the config sets it.
- `JobRegistry.ensureBuild` receives no `retention` key when the config omits it (args identical to today).
- With only `retention: { finished: 2 }`, the real `JobRegistry` builds without throwing.
- A typo'd key (`{ finshed: 2 }`) makes `build()` throw deku-swarm's `Invalid retention key` error.
- `WorkersRegistry.ensureBuild` receives exactly `{ factory, quantity }`.
- Existing assertions (worker count, factory wiring, `onWorkerIdle`, `loggerFactory`) still pass.

## Files to Change
- `source/lib/services/builders/RegistriesBuilder.js` — forward `retention`, explicit `quantity`.
- `source/spec/lib/services/builders/RegistriesBuilder_spec.js` — cases above.
