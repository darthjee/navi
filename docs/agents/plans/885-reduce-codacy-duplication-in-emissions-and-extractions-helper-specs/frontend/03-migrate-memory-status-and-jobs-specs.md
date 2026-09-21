# Migrate the MemoryStatus and Jobs specs

- `MemoryStatusHelper_spec.js`: replace its `.renderLoading` and `.renderError` describes with `itBehavesLikeHelperFetchStates({ state, helper: MemoryStatusHelper, loadingText: 'Loading memory status', errorPrefix: 'Failed to load memory status' })`. It already uses `useContainer()`/`renderInAct`, so only the two describes change.
- `JobsHelper_spec.js`: replace the hand-rolled container setup with `useContainer()`, keep (or reimplement on top of `renderInAct`) the local `render` helper that wraps elements in `MemoryRouter` for the `.renderStatusTabs` and later scenarios, and replace `.renderLoading`/`.renderError` with `itBehavesLikeHelperFetchStates({ state, helper: JobsHelper, wrap: (element) => createElement(MemoryRouter, { initialEntries: ['/jobs'] }, element), loadingText: 'Loading jobs', errorMessage: 'HTTP 503' })` (no `errorPrefix`, matching the current assertions). Update the remaining `container`/`root` references in the file to `state.container`/`state.root`.
- Leave all other scenarios untouched.

Run `cd frontend && npm run spec && npm run lint`, then check that the Codacy clone count for the touched files drops.

## Files to Change
- `frontend/spec/components/MemoryStatusHelper_spec.js` — use the shared `.renderLoading`/`.renderError` example
- `frontend/spec/components/JobsHelper_spec.js` — use `useContainer()` and the shared example with a `MemoryRouter` wrapper
