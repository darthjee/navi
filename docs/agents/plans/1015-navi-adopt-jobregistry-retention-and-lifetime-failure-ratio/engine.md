# Engine Plan: Navi: adopt JobRegistry retention and lifetime failure ratio

Main plan: [plan.md](plan.md)

## Shared contracts

- Parse `workers.retention: { finished?, dead? }` into `WorkersConfig#retention`: `undefined` when the block is absent/`null` or all its values are `null`/`undefined`; otherwise only the non-null keys, with every other key passed through untouched so deku-swarm validates it.
- Forward it to `JobRegistry.ensureBuild` only when defined. `WorkersRegistry.ensureBuild` receives exactly `{ factory, quantity }`.
- `/stats.json` already exposes `jobs.pruned` (frontend relies on it); no handler change, add a spec assertion only.
- Lifetime counts: ratio `(dead + pruned.dead) / (total + pruned.finished + pruned.dead)`; `RunSummary` `totalJobs = total + pruned.finished + pruned.dead`, `failedJobs = failed + retryQueue + dead + pruned.dead`.
- App patch bump via `scripts/bump_version.sh` (no deku-swarm bump).

## Steps

- [01 — WorkersConfig retention](engine/01-workers-config-retention.md)
- [02 — RegistriesBuilder forwarding](engine/02-registries-builder-forwarding.md)
- [03 — Lifetime counts in FailureChecker and RunReporter](engine/03-lifetime-counts.md)
- [04 — Config-layer, integration and StatsHandler specs](engine/04-config-and-integration-specs.md)
- [05 — Version bump](engine/05-version-bump.md)

## CI Checks

- `source`: `scripts/ci.sh coverage source` and `scripts/ci.sh lint-and-report source` (CircleCI jobs `Unit tests (Jasmine)` / `Lint and report`); locally `cd source && yarn test && yarn lint`.
- Repo-wide: `scripts/ci.sh cascade-bump-check` must pass after the app bump.

## Notes

- `deku-swarm`'s `#validateRetention` iterates `Object.entries(retention)`, so a present key with an `undefined` value throws. Omitting unset keys is mandatory, not cosmetic.
- `ConfigIncluder` interpolates `$VAR` on raw text before `YAML.parse`; an empty/undefined var becomes `''` → `null`. Numeric strings become numbers.
- `workersConfig.sleep` is read by `ApplicationInstance` / `EngineController` directly, not via the `WorkersRegistry` spread, so removing the spread is safe; confirm with a grep before removing.
- `#1023` will later extract the duplicated lifetime formula; keep both inline here, guarded by the consistency spec.
- Do not touch `deku-swarm/`.
