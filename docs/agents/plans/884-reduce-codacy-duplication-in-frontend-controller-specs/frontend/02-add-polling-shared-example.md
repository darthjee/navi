# Add the polling controller shared example
Jasmine has no native shared examples, so add a function (e.g. `itBehavesLikePollingController(options)`) that registers the common `#buildPollingEffect` scenarios when called inside a `describe`. Parameters, kept minimal:

- `build(setData, setError, setLoading)` — returns the controller under test
- `url` — the feed URL that must be fetched first
- `payload(entries)` — wraps a list of entries in the feed's response shape
- `entry(id)` — builds one feed entry
- `idsOf(setDataArg)` — extracts the accumulated ids from what `setData` received

Scenarios covered (all present today in both specs): fetches the feed; stops loading; clears the error; passes accumulated rows to `setData`; advances the cursor to the last id; accumulates rows across polls and advances the cursor to the newest id; fetch failure reports `HTTP 503` and stops loading (via `mockFetchFailure`); cleanup marks the poll loop cancelled. The function owns the `afterEach` that runs `cleanup`. It may also assert that a non-empty batch polls again and an empty one does not, if that passes for both controllers.

Controller-specific scenarios stay in each spec.

## Files to Change
- `frontend/spec/support/polling_controller.js` (new) — the shared example
