# Add exhaust helper and apply it
Add a static `exhaust(job, times = 3)` (name may vary) to `JobRegistryUtils` that calls `job._fail(new Error())` `times` times, swallowing the expected thrown error each time. `_fail` throws once retries are exhausted, so the swallow is part of the helper. Where a spec uses a custom error message or a different retry count (`_retryJob_spec`, `_fail_spec` use `maxRetries` 1/2 with `fail` + `promoteReadyJobs` between attempts), accept an optional error argument or a single-attempt variant so those sites can use it too without changing behaviour.

Replace every `try { job._fail(...) } catch { /* expected */ }` in `source/spec` with the helper.

## Files to Change
- `source/spec/support/utils/JobRegistryUtils.js` — add the helper (with JSDoc, matching the file's style)
- `source/spec/lib/registry/JobRegistry_jobsByStatus_spec.js` — use the helper
- `source/spec/lib/registry/JobRegistry_stats_spec.js` — use the helper
- `source/spec/lib/registry/JobRegistry_fail_spec.js` — use the helper
- `source/spec/lib/registry/JobRegistry_retryJob_spec.js` — use the helper
- `source/spec/lib/services/execution/FailureChecker_spec.js` — use the helper
- `source/spec/lib/jobs/EmitJob_spec.js` — optionally fold the local `fail` arrows into the helper if the signature fits cleanly
