# Adopt useContainer and the shared flushAsync in the page specs
Replace the hand-rolled setup in the dev specs with the shared helpers, without changing what the specs verify:

- `createRoot` + `document.createElement('div')` + `beforeEach`/`afterEach` mount/unmount becomes `useContainer()` from `navi-spec-support/dom.js`, in `Pagination_spec.js`, `IndexPage_spec.js`, `CategoriesIndexPage_spec.js`, `CategoryPage_spec.js`, `CategoryItemPage_spec.js` and `CategoryItemsIndexPage_spec.js`; use `renderInAct` where they wrap `root.render` in `act`.
- The locally redefined `flushAsync` becomes an import from `navi-spec-support/async.js` in `PaginatedList_spec`, `useFetchData_spec` and the four `Category*Page` specs.

Run the suite after each spec to confirm identical assertions and unchanged behavior; keep this to a mechanical swap (further duplication reduction belongs to #887).

## Files to Change
- `dev/frontend/spec/components/Pagination_spec.js`, `dev/frontend/spec/components/PaginatedList_spec.js`
- `dev/frontend/spec/hooks/useFetchData_spec.js`
- `dev/frontend/spec/pages/{IndexPage,CategoriesIndexPage,CategoryPage,CategoryItemPage,CategoryItemsIndexPage}_spec.js`
