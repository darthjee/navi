# Adopt helpers in Job and Jobs
In `Job_spec.js` and `Jobs_spec.js`:

- Remove the local `flushAsync` and import it from `../support/async.js`.
- Replace the `while loading` block and the `when the fetch fails` block with an `itBehavesLikeFetchStates` call. Job: `render: () => renderJob(state.root)`, `'Loading job'`, `'Failed to load job'`, status 500. Jobs: `render: () => render(state)`, `'Loading jobs'`, `'Failed to load jobs'`, status 503.
- This also removes the inline `spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({ ok: false, status }))` stubs: the shared example calls `mockFetchFailure(status)` instead. Make sure rendering happens after the stub is registered (it does: the stub is a `beforeEach` registered before the render `beforeEach`).
- Drop the now-unused `noop` import in Jobs; **keep** it in Job, where `mockJobFetch` still uses `new Promise(noop)`.
- Leave Job's `when the job is not found` (404, `.alert-warning`, "Job not found") block, its inline 404 stub, `mockJobFetch`, the success blocks and Jobs' URL-based fake and route-param block untouched.

## Files to Change
- `frontend/spec/components/Job_spec.js` — use shared `flushAsync` and `itBehavesLikeFetchStates`; drop inline failure stub
- `frontend/spec/components/Jobs_spec.js` — same
