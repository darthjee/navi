# Add shared job scenarios helper
Create a helper under `source/spec/support/utils/` (a new `JobRegistryScenarios.js`, or a static on `JobRegistryUtils` if it stays small) that defines the six lifecycle scenarios as an ordered list of `{ name, status, setup }`, where `setup()` performs the enqueue/pick/finish/fail/promote sequence against the current `JobRegistry` and returns the resulting job:

- `enqueued` — enqueue only
- `processing` — enqueue, pick
- `finished` — enqueue, pick, finish
- `failed` — enqueue, pick, fail (non-exhausted)
- `retryQueue` — enqueue, pick, fail, `promoteReadyJobs()`
- `dead` — enqueue, pick, exhaust (step 01), fail

`setup` takes the enqueue attributes (`{ resourceRequest, parameters }` in `jobsByStatus`/`jobById`, `{ parameters: { value: 1 } }` in `stats`) so both call sites can share it. Add JSDoc. The helper must be usable inside a `beforeEach` (called at spec run time, after `JobRegistryUtils.setup()` has built the registry).

## Files to Change
- `source/spec/support/utils/JobRegistryScenarios.js` (or `JobRegistryUtils.js`) — the scenarios list
