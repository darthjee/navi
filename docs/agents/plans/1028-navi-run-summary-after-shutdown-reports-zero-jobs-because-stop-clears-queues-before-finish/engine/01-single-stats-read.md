# Read stats once in RunReporter and inject them into FailureChecker

Today `RunReporter.report()` and `FailureChecker#loadStats()` each call `JobRegistry.stats()` independently. Make the run outcome derive from one stats object:

- `RunReporter.report({ failureConfig })` (signature unchanged) computes `const stats = LifetimeJobStats.fromStats(JobRegistry.stats())` once, uses it for the `RunSummary`, and builds `new FailureChecker({ failureConfig, stats })`.
- `FailureChecker` constructor takes `{ failureConfig, stats }` (a `LifetimeJobStats`); remove `#loadStats()` and the `JobRegistry` / `LifetimeJobStats` imports; read `stats.dead` / `stats.total` directly. Keep the `!failureConfig` and `total === 0` early returns and the memoized ratio.

Specs:

- `FailureChecker_spec.js`: rewrite to inject `new LifetimeJobStats({ total, dead, unresolved })` instead of building/seeding `JobRegistry`: null `failureConfig` → no exit; over threshold → `process.exit(1)` + error log containing the ratio (e.g. `50.00%`); within threshold → no exit; `total === 0` → no exit. Add one case asserting it does not read `JobRegistry` (e.g. `spyOn(JobRegistry, 'stats')` and expect it not called).
- `RunReporter_spec.js`: add a case asserting `JobRegistry.stats` is called exactly once per `report()`, and that `FailureChecker` receives the same stats used for the summary (e.g. summary says `Result: Failure` iff `process.exit(1)`); existing cases keep passing (they spy on `FailureChecker.prototype.check`, which is unaffected).

## Files to Change

- `source/lib/services/execution/RunReporter.js` — single stats read, pass `stats` to `FailureChecker`.
- `source/lib/services/execution/FailureChecker.js` — accept injected `stats`, drop registry reads.
- `source/spec/lib/services/execution/FailureChecker_spec.js` — inject stats instead of seeding the registry.
- `source/spec/lib/services/execution/RunReporter_spec.js` — single-read / same-stats assertions.
