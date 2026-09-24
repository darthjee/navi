# Split the spec into three files

Move the spec into `source/spec/lib/jobs/emit_job/` (mirroring #932's `resource_request/` folder) and delete the old file. Each file calls `EmitJobSpecUtils.setup()` at the top of its `describe('EmitJob', ...)` and uses the returned context. Fix relative import paths (one extra `../`).

- `emit_job/EmitJob_spec.js` — `#constructor`, `#arguments`, `#perform` (all current sub-blocks, including `itForwardsToClientEmit` usages and `namespace-aware client resolution`).
- `emit_job/EmitJob_emission_tracking_spec.js` — the `emission tracking` block (with its `EmissionRegistry.build()`/`reset()` hooks).
- `emit_job/EmitJob_retry_spec.js` — `#maxRetries` and `#cooldown`. Where the `#cooldown` cases are table-like (the 429 fallback cases: no header, non-numeric, HTTP-date, and the non-429 with a Retry-After-like header all expect `EmitJob.DEFAULT_COOLDOWN`), drive them from a list of `{ description, error }` examples with `forEach`, keeping one `it` per case so test titles stay descriptive.

Keep every `describe`/`it` title and expectation intact (apart from reshaping the table-driven cooldown cases).

## Files to Change
- `source/spec/lib/jobs/EmitJob_spec.js` — delete.
- `source/spec/lib/jobs/emit_job/EmitJob_spec.js` — new: constructor/arguments/perform.
- `source/spec/lib/jobs/emit_job/EmitJob_emission_tracking_spec.js` — new: emission tracking.
- `source/spec/lib/jobs/emit_job/EmitJob_retry_spec.js` — new: `#maxRetries` and `#cooldown`, table-driven cooldown fallbacks.
