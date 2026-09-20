# Trim pick, retryJob and fail specs
Remove the remaining Codacy clones in the three smaller files, only where it keeps them readable:

- `JobRegistry_pick_spec.js` — the "when the queue has jobs", "when the queue has a failed job" and "when the queue has failed and not failed jobs" blocks repeat the same three `it`s (`returns the first job`, `removes the job from the queue`, `decreases the queue size`); table-drive or extract a shared example set. Note the "failed job" block currently sets up identical state to "has jobs" — keep both scenarios' assertions, but do not add new ones.
- `JobRegistry_retryJob_spec.js` and `JobRegistry_fail_spec.js` — extract the repeated `JobRegistry.reset(); JobRegistry.build({ cooldown })` + enqueue/pick/fail sequences into a small helper (e.g. `JobRegistryUtils.setupWithCooldown(ms)` or a `failJobWithCooldown` helper), and use the exhaust helper from step 01 for the dead-queue setups.

## Files to Change
- `source/spec/lib/registry/JobRegistry_pick_spec.js` — dedupe the repeated `it` trio
- `source/spec/lib/registry/JobRegistry_retryJob_spec.js` — use shared helpers
- `source/spec/lib/registry/JobRegistry_fail_spec.js` — use shared helpers
- `source/spec/support/utils/JobRegistryUtils.js` — add the small shared helpers if needed
