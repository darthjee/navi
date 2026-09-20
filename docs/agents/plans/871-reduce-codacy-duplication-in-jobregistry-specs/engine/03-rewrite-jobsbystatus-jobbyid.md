# Rewrite jobsByStatus / jobById specs
Rewrite `.jobsByStatus` and `.jobById` to iterate the scenarios from step 02 instead of nine hand-copied `describe` blocks each. Keep the non-lifecycle cases inline (unknown status → `[]`, no jobs added → `[]`, `jobById` of a nonexistent id → `null`) and keep the two extra `jobsByStatus` assertions ("returns an empty array for other statuses" for the enqueued job, and "returns an empty array for enqueued" for the processing job). Each generated case's `describe` text must still read like today's (`when a job has been enqueued`, ...) so failures stay readable.

Also deduplicate the file header shared with `JobRegistry_enqueue_spec.js` (the `resourceRequest` `beforeEach`), e.g. by folding the `ResourceRequestFactory.build` call into the shared setup or the scenarios helper, and check `JobRegistry_enqueue_spec.js` benefits from the same change.

## Files to Change
- `source/spec/lib/registry/JobRegistry_jobsByStatus_spec.js` — table-drive `jobsByStatus` and `jobById`
- `source/spec/lib/registry/JobRegistry_enqueue_spec.js` — align the shared header if the change above touches it
- `source/spec/support/utils/JobRegistryUtils.js` — only if the header setup moves there
