# worker Plan: Refactor ApplicationInstance

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **produces** the `deku-swarm` API changes that `engine` and `docs`
consume. Full contract in [plan.md](plan.md) "Shared contracts". Summary:

- `WorkersRegistry.ensureBuild(options = {})` — build once; pure no-op on an
  already-built singleton (no reconstruct, no re-init, `options` ignored); returns
  the instance.
- `JobRegistry.ensureBuild(options = {})` — identical contract.
- `WorkersRegistry.initWorkers()` — idempotent: returns early if the pool already
  has workers; must not short-circuit on `quantity` (`quantity: 0` still runs a
  0-iteration loop).
- `Engine` constructor — `jobRegistry` / `workersRegistry` default to the
  `JobRegistry` / `WorkersRegistry` classes (from `../background/`); defaults fire
  only on `undefined`; injected values always win; `null` is unsupported. No
  `EngineFactory`, no `Engine.build`.
- `build()` on both registries keeps its "throws if already built" behaviour.
- `worker/package.json` → `1.8.0`.

## Steps

- [01 — Engine constructor registry defaults](worker/01-engine-registry-defaults.md)
- [02 — WorkersRegistry.ensureBuild + idempotent initWorkers](worker/02-workersregistry-ensurebuild.md)
- [03 — JobRegistry.ensureBuild](worker/03-jobregistry-ensurebuild.md)
- [04 — Version bump + README](worker/04-version-and-readme.md)
- [05 — Worker specs](worker/05-specs.md)

## CI Checks

- `worker/`: `cd worker && npm test` (CI job: `jasmine-worker`)
- `worker/`: `cd worker && npm run lint` (CI job: `checks-worker`)
- On a version-tagged build, `check-and-publish-worker` diffs `worker/` since the
  last tag and publishes `deku-swarm@1.8.0` — the `1.8.0` in `worker/package.json`
  is what that job reads.

## Notes

- `worker/lib/background/` must not import from `worker/lib/services/` (it does not
  today) — keep it that way so `Engine.js` importing the two registry classes from
  `../background/` introduces no cycle.
- There is no `worker/spec/background/JobRegistry_spec.js` today — `JobRegistry`
  behaviour is otherwise exercised from `source/spec/lib/registry/`. Add a minimal
  new worker-side spec for `JobRegistry.ensureBuild` (step 05).
- `worker/README.md` has no embedded version string (nothing to keep in sync with
  `package.json` there).
