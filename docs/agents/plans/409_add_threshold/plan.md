# Plan: Add Threshold

## Overview

Add a configurable failure threshold: after the Engine finishes, if the ratio of dead jobs
to total jobs exceeds the threshold, Navi exits with a non-zero code. The threshold is
defined in the YAML config under a new top-level `failure:` key and is optional.

## Context

Navi currently exits with success even when jobs die. On CI this masks real failures.
The fix is a post-run check: compute `dead / total * 100` and fail if it exceeds the
configured percentage. Absence of the `failure:` key preserves existing behaviour.

## Implementation Steps

### Step 1 — Add `FailureConfig` model

Create `source/lib/models/FailureConfig.js` following the existing model conventions:

- Constructor receives `{ threshold }` (float, percentage).
- Static `fromObject(config)` factory parses the raw YAML object.
- Static `null` sentinel (or return `null` from `fromObject` when the key is absent) to
  represent "no failure check configured".
- Expose a `threshold` getter.
- Add spec `source/spec/lib/models/FailureConfig_spec.js`.

### Step 2 — Parse `failure:` key in `Config` / `ConfigParser`

In `source/lib/services/ConfigParser.js` (or wherever `Config` is assembled from the YAML
object), read the optional `failure:` key and build a `FailureConfig` instance (or `null`).

Update `Config` to hold and expose a `failureConfig` property.

Add spec coverage for the new parsing logic.

### Step 3 — Check threshold at exit in `Application`

In `source/lib/services/Application.js`, after `engine.run()` resolves:

1. If `config.failureConfig` is `null`, do nothing (current behaviour).
2. Otherwise, fetch `JobRegistry.stats()` to get `dead` and `total` counts.
3. Compute `ratio = dead / total * 100`.
4. If `ratio > failureConfig.threshold`, exit with a non-zero code
   (e.g. `process.exit(1)`).

Add spec coverage for both the passing and failing scenarios.

### Step 4 — Update documentation

Update the following files to document the new `failure:` config key and its behaviour:

- `docs/agents/flow.md` — describe the post-run threshold check in the Engine/Application
  exit flow.
- `docs/agents/overview.md` (if the feature checklist is there) — mark threshold as
  implemented.
- `docs/HOW_TO_USE_NAVI.md` — add a section explaining the `failure.threshold` option with
  an example.
- `README.md` — mention the failure threshold feature.
- `source/README.md` — same.
- `DOCKERHUB_DESCRIPTION.md` — same.

## Files to Change

### Source
- `source/lib/models/FailureConfig.js` — new model
- `source/lib/services/ConfigParser.js` — parse `failure:` key
- `source/lib/models/Config.js` — add `failureConfig` property
- `source/lib/services/Application.js` — post-run threshold check
- `source/spec/lib/models/FailureConfig_spec.js` — new spec
- `source/spec/lib/services/ConfigParser_spec.js` — new coverage
- `source/spec/lib/models/Config_spec.js` — new coverage
- `source/spec/lib/services/Application_spec.js` — new coverage

### Documentation
- `docs/agents/flow.md`
- `docs/agents/overview.md`
- `docs/HOW_TO_USE_NAVI.md`
- `README.md`
- `source/README.md`
- `DOCKERHUB_DESCRIPTION.md`

## Notes

- `total` should count all jobs that ever existed (enqueued + finished + dead), not just
  currently active ones — confirm the right stat from `JobRegistry.stats()`.
- If `total` is 0 (nothing was enqueued), the ratio is undefined — treat it as 0% (no
  failure).
- The threshold comparison should be strict (`>`), so `threshold: 0.0` fails on any dead job.
- `process.exit(1)` is the standard CI failure signal; confirm there is no wrapper that
  intercepts it in the current Application flow.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `docker-compose run --rm navi_app yarn test` (CircleCI job: `source_tests`)
- `source/`: `docker-compose run --rm navi_app yarn lint` (CircleCI job: `source_lint`)
