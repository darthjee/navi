# Refactor EmitJob_spec.js
`EmitJob_spec.js` (largest offender, 23 clones) already has a local `rebuildJob` helper and uses `EmitJobFactory`, but many `describe`s bypass it with hand-written `emit = ResourceRequestEmitFactory.build(...); job = EmitJobFactory.build({ item, emit, clients, parameters: {} })` blocks, and the same `await job.perform(logContext).catch(() => {})` and record-assertion shapes repeat throughout.

- Extend `rebuildJob` to accept `retries`, `cooldown` and `extractionId` and use it in the `#maxRetries`, `#cooldown`, "emit fails past maxRetries", "namespace-aware client resolution" (via a `client` option) and "extractionId" describes, instead of re-assembling `emit`/`job`/`parameters` by hand.
- Add a local `performIgnoringFailure()` (or reuse/extend `JobRegistryUtils`) for the ~15 `await job.perform(logContext).catch(() => {})` calls, and a loop helper for the repeated "perform ×5" in the exhaustion test.
- Parameterise scenarios that differ only by input/expectation: the emission-tracking failure cases (retryable 502 → `failed`, non-retryable 404 → `dead`, network error → `failed` with null `httpStatus`, past maxRetries → `dead`) as a table of `{ description, stub, expectedStatus, expectedHttpStatus }`; the two `extractionId` stamping tests (success/failed); the headers / body_template forwarding pairs where applicable.
- Extract a `firstRecord()` (or similar) helper for `EmissionRegistry.getRecords()[0]` reads.
- Keep all `describe`/`it` semantics: the spec count must stay the same.

## Files to Change
- `source/spec/lib/jobs/EmitJob_spec.js` — dedupe as above
- `source/spec/support/utils/` (only if a helper is reused by another spec in this issue, e.g. an emission-record helper; otherwise keep helpers local to the file)
