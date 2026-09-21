# Table-drive the client specs
`ItemsClient_spec.js` and `CategoriesClient_spec.js` repeat the same fetch stub and assertions for each function. Replace the hand-written stubs with `mockFetchSuccess`/`mockFetchFailure` from `navi-spec-support/fetch.js` (using `paginationHeaders` for the pagination headers) and table-drive the repeated cases, e.g. an array of `{ description, call, url, ... }` rows iterated with `forEach` to generate the `it` blocks for: the request URL, the returned `data`, the pagination metadata (`{ page, pageSize, pages }`), the query string appended to the URL (`page=3` / `page=2`), and the failure case (`HTTP 404` / `HTTP 500`). Cover both the list function (`fetchItems`/`fetchCategories`) and the single-record function (`fetchItem`/`fetchCategory`) of each client.

Keep the exact URLs, status codes and expected values, so the same behaviours stay verified. Compare the spec count before and after.

## Files to Change
- `dev/frontend/spec/clients/ItemsClient_spec.js` — table-driven, uses the shared fetch stubs
- `dev/frontend/spec/clients/CategoriesClient_spec.js` — table-driven, uses the shared fetch stubs
