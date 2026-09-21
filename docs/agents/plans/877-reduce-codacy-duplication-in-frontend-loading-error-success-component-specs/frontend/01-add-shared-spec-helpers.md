# Add shared spec helpers
Create the three shared helpers in `frontend/spec/support/`, following the existing convention of functions called at describe level.

- `async.js` (new): export `flushAsync = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); })`, importing `act` from `react`.
- `fetch.js` (extend): add `mockFetchPending()`, which registers a `beforeEach` that runs `spyOn(globalThis, 'fetch').and.returnValue(new Promise(noop))`, and export it alongside `mockFetchSuccess`/`mockFetchFailure` (import `noop` from `../../src/utils/noop.js`). Include a short comment in the same style as the existing helpers.
- `fetch_states.js` (new): export `itBehavesLikeFetchStates({ render, loadingText, errorText, status })`, to be called at describe level inside the spec's own `describe`. It needs access to the container, so `render` is an async function with no arguments that closes over the spec's `state` (e.g. `() => renderEmissions(state.root)`), and the example also takes `state` (from `useContainer()`) for the DOM assertions. It registers:
  - `describe('while loading')`: `mockFetchPending()`, `beforeEach(render)`, then `renders a spinner` (`.spinner-border` present) and `shows loading text` (`textContent` contains `loadingText`).
  - `describe('when the fetch fails')`: `mockFetchFailure(status)`, `beforeEach` that renders and calls `flushAsync()`, then the four `it`s: no spinner, `.alert-danger` present, `textContent` contains `errorText` (the "Failed to load X" message), and contains `HTTP ${status}`.

Keep `it` descriptions identical to the existing wording ("renders a spinner", "shows loading text", "does not show a spinner", "renders an error alert", "shows a descriptive error message", "includes the error details in the message") so failure output stays familiar.

## Files to Change
- `frontend/spec/support/async.js` — new: shared `flushAsync`
- `frontend/spec/support/fetch.js` — add and export `mockFetchPending`
- `frontend/spec/support/fetch_states.js` — new: `itBehavesLikeFetchStates` shared example
