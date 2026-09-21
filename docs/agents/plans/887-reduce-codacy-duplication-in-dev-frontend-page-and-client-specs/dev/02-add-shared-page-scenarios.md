# Add the shared page scenarios
Add `dev/frontend/spec/support/page_scenarios.js` with reusable shared examples, following the `itBehavesLikeFetchStates` precedent in `frontend/spec/support/fetch_states.js`. Each takes the `state` from `useContainer()` and a `render` function (from step 01) and registers the same `describe`/`it` blocks the specs have today, with the same names:

- `itBehavesLikeLoadingState({ state, render })` — `while loading`: `mockFetchPending()`, render, `shows a spinner`.
- `itBehavesLikeErrorState({ state, render, status })` — `when the fetch fails`: `mockFetchFailure(status)`, render, `flushAsync()`, `shows an error alert` (`.alert-danger`) and `displays the error message` (`HTTP <status>`). The status differs per spec (404 for three pages, 500 for `CategoriesIndexPage`), so it is a parameter.
- `itRefetchesWhenTheIdChanges({ state, render, navigate, data, nextPath })` — `when the id changes`: stub success with `data`, render, `flushAsync()`, switch the fetch stub to a pending promise, `navigate(nextPath)`, expect the spinner again. Used by `CategoryPage` and `CategoryItemPage` only.
- `itBehavesLikePaginatedIndex({ state, render, data, headers, path, activePage })` — `when data loads with multiple pages`: stub success with `data` and `paginationHeaders(...)`, render `path`, `flushAsync()`, expect `.pagination` and `.page-item.active` containing `activePage`. Used by the two index pages, replacing their identical local `makeFetchResponse` and scenario.

The `when data loads successfully` scenario keeps its page-specific assertions inline in each spec (names, links, `does not show a spinner`, `does not render pagination when there is only 1 page`); only the stubbing and rendering boilerplate is replaced by `mockFetchSuccess`/`render`. Do not fold page-specific expectations into a callback-heavy shared example if that makes a failing spec harder to read.

## Files to Change
- `dev/frontend/spec/support/page_scenarios.js` — new shared examples built on `navi-spec-support/fetch.js` and `flushAsync`
