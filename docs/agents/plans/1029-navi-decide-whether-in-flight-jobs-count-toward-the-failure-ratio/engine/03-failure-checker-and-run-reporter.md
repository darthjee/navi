# FailureChecker and RunReporter use the shared ratio
`FailureChecker`: remove the private `#ratio()` / `#cachedRatio` and use `this.#stats.percentage` in `#isOverThreshold()` and in the `#fail()` log message. Constructor and behaviour are unchanged (including the `total === 0` skip).

`RunReporter`: build one `LifetimeJobStats.fromStats(JobRegistry.stats())` and pass it as `stats` to both `new RunSummary({ stats, threshold: failureConfig?.threshold })` and `new FailureChecker({ failureConfig, stats })`.

Specs:
- `FailureChecker_spec.js` — adjust to the removed private ratio if any spec relied on it; existing threshold cases must still pass.
- `RunReporter_spec.js` — update the expected summary strings for stats with `failed`/`retryQueue > 0` (e.g. `{ total: 10, failed: 1, retryQueue: 1, dead: 2 }` now prints `Failed: 2 (20%)` plus `Unresolved: 2`). Add a regression spec: with jobs in `failed`/`retryQueue` whose inclusion would previously have pushed the summary over the threshold, the printed `Result:` is `Success` and `FailureChecker` does not exit (and conversely, when dead jobs exceed the threshold, both report failure).
- `source/spec/lib/services/application/Application_shutdown_threshold_spec.js` — must stay green; update expectations only if they asserted on the old summary output.

## Files to Change
- `source/lib/services/execution/FailureChecker.js` — use `stats.percentage`.
- `source/lib/services/execution/RunReporter.js` — pass the stats instance to `RunSummary`.
- `source/spec/lib/services/execution/FailureChecker_spec.js` — adjust if needed.
- `source/spec/lib/services/execution/RunReporter_spec.js` — updated expectations + regression spec.
- `source/spec/lib/services/application/Application_shutdown_threshold_spec.js` — only if affected.
