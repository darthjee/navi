# Refactor the page specs
Rewrite the four page specs to use the helpers from steps 01 and 02 and `navi-spec-support/fetch.js`:

- `CategoryPage_spec.js` and `CategoryItemPage_spec.js`: replace the local `NavigationCapture`/`render`/`navigate` boilerplate with `createPageRenderer`, the loading/error/id-change blocks with the shared examples, and keep the `when data loads successfully` block (name/link assertions) inline using `mockFetchSuccess`.
- `CategoriesIndexPage_spec.js` and `CategoryItemsIndexPage_spec.js`: delete the local `makeFetchResponse`; use `mockFetchSuccess(data, paginationHeaders())` for the success block and `itBehavesLikePaginatedIndex` for the multiple-pages block (page 2/5 for categories, page 3/7 for items, as today), plus the shared loading/error examples.
- Drop imports that become unused (`noop`, `flushAsync`, `act`, `createElement`, `MemoryRouter`, ...); keep `useContainer` from `navi-spec-support/dom.js`.

Run the suite before and after and confirm the same number of specs pass (no scenario or `it` lost).

## Files to Change
- `dev/frontend/spec/pages/CategoryPage_spec.js` — use shared helpers
- `dev/frontend/spec/pages/CategoryItemPage_spec.js` — use shared helpers
- `dev/frontend/spec/pages/CategoriesIndexPage_spec.js` — use shared helpers, drop `makeFetchResponse`
- `dev/frontend/spec/pages/CategoryItemsIndexPage_spec.js` — use shared helpers, drop `makeFetchResponse`
