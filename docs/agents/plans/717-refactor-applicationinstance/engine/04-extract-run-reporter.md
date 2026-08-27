# Extract RunReporter

Move the reporting tail of `ApplicationInstance#run()` — building and logging the `RunSummary`, then running the failure-threshold check — into its own collaborator.

- New file `source/lib/services/RunReporter.js`.
- Expose a method, e.g. `report({ failureConfig })`, containing the current body of `ApplicationInstance#printRunSummary()` (`source/lib/services/ApplicationInstance.js:369-378`) followed by `new FailureChecker({ failureConfig }).check()` — i.e. read `JobRegistry.stats()`, build the `RunSummary`, log it via `LogRegistry.info(...)`, then run the failure check, in that order (the print must happen **before** the check — this is spec-locked behavior).
- Engine-status bookkeeping (`EngineEvents.emit('stop')`, setting status to `stopped`) is lifecycle state, not reporting — it stays in `ApplicationInstance`/`EngineState`, not in `RunReporter`.
- Do not wire this into `ApplicationInstance` yet — that happens in step 05.

## Files to Change
- `source/lib/services/RunReporter.js` (new)
- `source/spec/lib/services/RunReporter_spec.js` (new) — cover that `report()` logs the summary before invoking `FailureChecker.check()`, and that the summary's `totalJobs`/`failedJobs`/`threshold` are derived correctly from `JobRegistry.stats()` and the passed `failureConfig`.
