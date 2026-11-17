# Config-layer, integration and StatsHandler specs

Cover the paths that unit stubs cannot.

**Config parsing**
- New fixture `source/spec/support/fixtures/config/sample_config_with_retention.yml` (copy of `sample_config.yml` plus `workers.retention: { finished: 100, dead: 50 }`).
- `ConfigParser_spec.js`: `workersConfig.retention` equals `{ finished: 100, dead: 50 }`.

**Env-var interpolation** (production image path)
- New fixture `source/spec/support/fixtures/config/sample_config_with_retention_env_vars.yml` with `finished: $NAVI_TEST_RETENTION_FINISHED` and `dead: $NAVI_TEST_RETENTION_DEAD`.
- `ConfigLoader_spec.js`, following the existing `sample_config_with_env_vars.yml` set-up/tear-down of `process.env`:
  - vars `"100"` / `"50"` → numbers (`typeof === 'number'`) in `workersConfig.retention`;
  - vars `''` → `workersConfig.retention` is `undefined`, and `Logger.warn` is not called with `Environment variable not defined: ...`;
  - vars unset → `undefined`, and the warning is logged.

**Real-registry integration** (no stubbed `stats()`)
- In `RunReporter_spec.js` (or a sibling spec), build the real `JobRegistry` with `retention: { finished: 2, dead: 2 }` (reset it in `afterEach`), drive jobs to finished and dead through its public API until evictions happen, then run `RunReporter`. Assert the logged `Total` / `Failed` lines use lifetime counts and that the summary's `Result` matches whether `process.exit` was called (spy on it).

**StatsHandler**
- `StatsHandler_spec.js`: response `jobs` includes `pruned` with `finished` and `dead`; `workers` and `emissions` unchanged. No production change.

## Files to Change
- `source/spec/support/fixtures/config/sample_config_with_retention.yml` — new fixture.
- `source/spec/support/fixtures/config/sample_config_with_retention_env_vars.yml` — new fixture.
- `source/spec/lib/services/config/ConfigParser_spec.js` — retention parsing case.
- `source/spec/lib/services/config/ConfigLoader_spec.js` — env-var cases.
- `source/spec/lib/services/execution/RunReporter_spec.js` (or new sibling spec) — real-registry integration.
- `source/spec/lib/server/handlers/StatsHandler_spec.js` — `jobs.pruned` assertion.
