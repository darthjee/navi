# Engine Plan: Navi: run summary after shutdown reports zero jobs because stop() clears queues before finish

Main plan: [plan.md](plan.md)

## Shared contracts

Implements the behavioral contract in [plan.md](plan.md#shared-contracts): a shutdown of a running engine drains (pause + wait for idle workers) but never calls `JobRegistry.clearQueues()`; `stop()`/`restart()`/`reload()` keep clearing. Internal-only signature change: `new FailureChecker({ failureConfig, stats })` where `stats` is a `LifetimeJobStats`.

## Steps

- [01 — Read stats once in RunReporter and inject them into FailureChecker](engine/01-single-stats-read.md)
- [02 — Shutdown drains without clearing queues](engine/02-shutdown-without-clear.md)
- [03 — Integration specs for shutdown run summary and threshold](engine/03-shutdown-integration-specs.md)

## CI Checks

- `source`: `cd source && npm test` (CI job: `jasmine`)
- `source`: `cd source && npm run lint` (CI job: `checks`)

## Notes

- Edge cases the implementation must satisfy (from the issue): workers finishing during the drain are counted; no snapshot state exists, so restart/reload counts can never leak into a later report; a second shutdown call can't wipe counts (nothing clears); shutdown while paused does no drain and no clear; shutdown with zero jobs reports `Total: 0` and doesn't exit; `failed` + `retryQueue` stay in the registry and count in the summary's `failedJobs`.
- Shutdown while a `stop()`/`restart()`/`reload()` is in progress (state `stopping`) still reports 0 — accepted as intended; do not add coordination.
- Update JSDoc on `stop()`, `shutdown()`, `RunReporter`, `FailureChecker` to match the new behavior.
