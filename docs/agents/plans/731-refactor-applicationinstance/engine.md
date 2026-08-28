# engine Plan: Refactor ApplicationInstance

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the `deku-swarm` API changes produced by the `worker` agent — see [plan.md](plan.md) "Shared contracts". In short:

- `WorkersRegistry.ensureBuild(opts)` / `JobRegistry.ensureBuild(opts)` — build once, pure no-op on an already-built singleton (ignores `opts`).
- `WorkersRegistry.initWorkers()` is idempotent.
- `Engine` constructor no longer needs `jobRegistry` / `workersRegistry` (defaults to the singleton classes on `undefined`).

Produces (internal): `ConfigStore` — `source/lib/services/application/ConfigStore.js`, `{ config, bufferedLogger, entryFilePath }` getters, `entryFilePath` stored verbatim.

## Steps

- [01 — Add ConfigStore](engine/01-configstore.md)
- [02 — ApplicationConfigurator returns ConfigStore](engine/02-applicationconfigurator.md)
- [03 — ApplicationInstance: #configStore + drop #workers](engine/03-applicationinstance.md)
- [04 — RegistriesBuilder: drop workers, use ensureBuild](engine/04-registriesbuilder.md)
- [05 — Update source specs](engine/05-specs.md)

## CI Checks

- `source/`: `cd source && npm test` (CI job: `jasmine`)
- `source/`: `cd source && npm run lint` (CI job: `checks`)

## Notes

- `this.config` becomes a getter with **no setter** — `ApplicationInstance_spec` currently assigns `instance.config = {...}` in 5 places (see step 05). Those move to a new `configStore` constructor DI seam.
- `bufferedLogger` and `config` getters must use optional chaining (`this.#configStore?.…`) so reads before `loadConfig()` (or after a `loadConfig` that threw) still return `undefined` rather than throwing (edge case E2).
- Do not touch `ConfigIncluder` — it stays pure (takes a path string). Only the *caller* changes.
