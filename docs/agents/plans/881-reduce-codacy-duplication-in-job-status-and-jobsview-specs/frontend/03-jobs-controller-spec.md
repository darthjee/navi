# Rename and de-duplicate the JobsController spec
`frontend/spec/components/JobsView_spec.js` tests `JobsController` (no React rendering). Rename it with `git mv` to `frontend/spec/components/controllers/JobsController_spec.js` and fix the import to `../../../src/components/pages/controllers/JobsController.jsx` (matching `EmissionsController_spec.js`). Then remove the repeated setup:

- The `spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve(data) }))` stub (4 occurrences, used inside `it` blocks) becomes a helper in `frontend/spec/support/fetch.js`, e.g. `stubFetchSuccess(data)` (non-hook; `mockFetchSuccess` registers a `beforeEach` and cannot be used inside an `it`). Have `mockFetchSuccess` reuse it to avoid duplicating the response shape.
- The `setJobs`/`setError`/`setLoading` `jasmine.createSpy` triples (3 occurrences) become a small factory (e.g. `buildSetterSpies()` returning `{ setJobs, setError, setLoading }`) in `frontend/spec/support/`.
- The repeated `new JobsController('failed', '', navigate)` construction becomes a local or shared `buildController(status = 'failed', search = '')` helper.

Keep every existing `describe`/`it` and assertion. Verify that no other file references `JobsView_spec.js` (a grep found none outside the issue file).

## Files to Change
- `frontend/spec/components/JobsView_spec.js` — renamed (`git mv`) to `frontend/spec/components/controllers/JobsController_spec.js`, import path fixed, repeated setup replaced by helpers
- `frontend/spec/support/fetch.js` — add `stubFetchSuccess(data)`; `mockFetchSuccess` reuses it
- `frontend/spec/support/` — add the setter-spies factory (new file, e.g. `spies.js`, or alongside the fetch helper if it fits)
