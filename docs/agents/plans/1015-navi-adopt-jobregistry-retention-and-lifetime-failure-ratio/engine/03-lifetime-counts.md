# Lifetime counts in FailureChecker and RunReporter

`FailureChecker#loadStats()`:

```js
#loadStats() {
  const { dead, total, pruned } = JobRegistry.stats();
  this.#dead = dead + pruned.dead;
  this.#total = total + pruned.finished + pruned.dead;
}
```

`#ratio()`, `#cachedRatio` memoization, the `#total === 0` early return and the `process.exit(1)` path stay untouched.

`RunReporter`:

```js
const stats = JobRegistry.stats();
const summary = new RunSummary({
  totalJobs: stats.total + stats.pruned.finished + stats.pruned.dead,
  failedJobs: stats.failed + stats.retryQueue + stats.dead + stats.pruned.dead,
  threshold: failureConfig?.threshold,
});
```

`RunSummary` is unchanged. Update JSDoc on both classes to say counts are lifetime (resident + pruned, since the last `clearQueues()`).

Specs:
- `FailureChecker_spec.js`: ratio uses `dead + pruned.dead` over `total + pruned.finished + pruned.dead`; with `pruned: { 0, 0 }` equals today's result; heavy pruning (`finished: 10, dead: 10, pruned: { finished: 940, dead: 40 }`) yields 5% — exits at `threshold: 3`, not at `threshold: 6`; `#total === 0` still returns without exit; memoization preserved. Update existing stubs of `stats()` to include `pruned`.
- `RunReporter_spec.js`: `RunSummary` receives lifetime `totalJobs` and `failedJobs`; consistency case: with the worked-example stats and `threshold: 3` the logged summary contains `Result: Failure` and `process.exit(1)` is called; with `threshold: 6` the summary says `Success` and no exit. `FailureChecker` still runs after the summary is logged.

## Files to Change
- `source/lib/services/execution/FailureChecker.js` — lifetime inputs in `#loadStats()`.
- `source/lib/services/execution/RunReporter.js` — lifetime `totalJobs` / `failedJobs`.
- `source/spec/lib/services/execution/FailureChecker_spec.js` — cases above; add `pruned` to stubs.
- `source/spec/lib/services/execution/RunReporter_spec.js` — cases above; add `pruned` to stubs.
