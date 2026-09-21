# Add the shared helper-state examples

Create `frontend/spec/support/helper_states.js` exporting two describe-level shared examples, both taking the `state` returned by `useContainer()`:

- `itBehavesLikeHelperFetchStates({ state, helper, wrap, loadingText, errorPrefix, errorMessage })` — registers a `.renderLoading` describe (asserts `.spinner-border`; asserts `loadingText` when given) and a `.renderError` describe (renders `helper.renderError(errorMessage)`; asserts `.alert-danger`, that the text contains `errorMessage`, and `errorPrefix` when given). `wrap` is an optional `(element) => element` applied before rendering (defaults to identity) so Jobs can supply its `MemoryRouter`. `errorMessage` defaults to `'boom'`. Rendering goes through `renderInAct(state.root, …)`.
- `itBehavesLikeEmptyFeed({ state, render, emptyText })` — registers the empty-state scenarios: `render` is an async function that renders the empty variant of the helper; asserts the text `emptyText` is shown (`shows the empty state message`) and that no `table` is rendered (`does not render a table`).

Add a short comment above each example documenting its parameters, in the style of `support/fetch_states.js`. Keep the module free of any `frontend/src` imports.

## Files to Change
- `frontend/spec/support/helper_states.js` — new module with `itBehavesLikeHelperFetchStates` and `itBehavesLikeEmptyFeed`
