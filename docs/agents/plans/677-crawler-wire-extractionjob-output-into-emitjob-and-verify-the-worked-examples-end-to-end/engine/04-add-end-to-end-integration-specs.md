# Add end-to-end specs for both worked examples

Reproduce the two worked examples from `docs/agents/future/crawler/flows.md` as automated tests, exercising the real chain (`ResourceRequestJob` → real `ExtractionJob`/parser → real `EmitEnqueuer` → `EmitJob`) rather than mocking each job in isolation — this is what actually proves the wiring from steps 1–3 works, not just each unit individually. Follow the closest existing pattern in `source/spec/` for driving a job chain through the real `JobRegistry`/`JobFactory` (e.g. how `ApplicationInstance_spec.js` or the `ResourceRequestJob_spec.js` chaining tests already drive jobs end-to-end); mock only the outermost HTTP boundary (the initial resource fetch and the final emit POST).

Cover, mapping directly to the issue's acceptance criteria:

- **Loot Studios example** (`json_path` parser + filter + `fields` mapping + chaining): the resource declares both `actions` and `parser`+`emit`; asserts the `ActionProcessingJob` chain still fires (regression) *and* one `Emit` POST per filtered item goes to `/api/miniatures` with the mapped `{inid, name, post_id, bundle}` body.
- **Regex-standalone example**: the resource declares only `parser`+`emit`, no `actions`; asserts extraction + emit happen with no `ActionProcessingJob` enqueued, POSTing to `/api/bundles/resolve` with `{post_id: "..."}`.
- **Only-`actions` resource** (no `parser`): regression check that behavior is byte-for-byte unchanged from before this issue — no `ExtractionJob`/`EmitJob` involved at all.

## Files to Change

- `source/spec/lib/jobs/ExtractionJob_spec.js` and/or a new spec file under `source/spec/lib/jobs/` (name it after whatever real chain-driving pattern is chosen above) — the three scenarios described.
- `source/spec/support/fixtures/` — add fixture response bodies for the Loot Studios and regex-standalone examples if not already present, matching the exact configs quoted in `flows.md`.
