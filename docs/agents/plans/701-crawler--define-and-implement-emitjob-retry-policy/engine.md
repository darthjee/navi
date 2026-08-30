# engine Plan: Crawler: define and implement EmitJob retry policy

Main plan: [plan.md](plan.md)

## Shared contracts

- Relies on `worker`'s `Job` constructor accepting optional `{ maxRetries, cooldown }`, whose getters return `this.#maxRetries ?? 3` / `this.#cooldown` respectively, and whose subclass getter overrides still win outright.
- Relies on `worker`'s `JobRegistryInstance#fail()` calling `job.exhausted()` (no argument) and `job.applyCooldown(job.cooldown ?? this.#cooldown)`.
- Produces: `RegistriesBuilder` passes `attributes: { maxRetries: config.workersConfig.maxRetries, cooldown: config.workersConfig.retryCooldown }` into the non-`Emit` job factories, so `ResourceRequestJob`/`AssetDownloadJob` keep behaving as they do today.
- Produces: `EmitJob` computes its own effective `maxRetries`/`cooldown` per instance (resource `emit.retries`/`emit.cooldown` override, else its own 5/5000ms default) and never receives the global config from `RegistriesBuilder`.

## Steps

- [01 — Carry Retry-After through RequestFailed and Client](engine/01-request-failed-retry-after.md)
- [02 — Add emit.retries/emit.cooldown config and validation](engine/02-emit-config.md)
- [03 — EmitJob's own retry policy](engine/03-emitjob-retry-policy.md)
- [04 — Wire the global default into RegistriesBuilder](engine/04-registries-builder.md)
- [05 — Document the decisions](engine/05-document-decisions.md)
- [06 — Spec coverage](engine/06-spec-coverage.md)

## CI Checks

- `source`: `npm run coverage` (CI job: Unit tests (Jasmine), parametrized by `path: source` in `.circleci/config.yml`)
- `source`: `npm run lint` (CI job: Lint and report)

## Notes

- `source/package.json` depends on `deku-swarm` via `"deku-swarm": "file:../worker"` (a local path, not an npm-registry version pin) — no publish is needed for `source/`'s tests to see `worker/`'s changes, but re-run `npm install` in `source/` after `worker/`'s changes land so the local copy is refreshed.
- Depends on `worker`'s steps landing first (or at least being implemented in the same PR) — `EmitJob`'s dynamic `maxRetries`/`cooldown` getters and `RegistriesBuilder`'s explicit injection only make sense once `JobRegistryInstance.fail()` is fixed.
