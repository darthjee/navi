# Migrate the Emissions and Extractions specs

In `EmissionsHelper_spec.js` and `ExtractionsHelper_spec.js`:

- Replace the hand-rolled `container`/`root` `beforeEach`/`afterEach` with `const state = useContainer();` from `../support/dom.js`, and replace `container`/`root` references with `state.container`/`state.root` (using `renderInAct` where it shortens a `act(async …)` block, including the local `render` helper in the Emissions spec).
- Replace the `.renderLoading` and `.renderError` describes with `itBehavesLikeHelperFetchStates({ state, helper: EmissionsHelper, errorPrefix: 'Failed to load emissions' })` (resp. `ExtractionsHelper` / `'Failed to load extractions'`).
- Replace the `with an empty feed` / `with no extraction rows` describes with `itBehavesLikeEmptyFeed({ state, render, emptyText })`, where `render` renders the helper with zero counts and no rows (`No emissions recorded yet.` / `No extractions recorded yet.`).
- Leave the `.render` scenarios, fixtures and every other assertion untouched.

Run `cd frontend && npm run spec` and confirm both files still pass.

## Files to Change
- `frontend/spec/components/EmissionsHelper_spec.js` — use `useContainer`/`renderInAct` and the shared examples
- `frontend/spec/components/ExtractionsHelper_spec.js` — use `useContainer`/`renderInAct` and the shared examples
