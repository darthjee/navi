# Issue: Reduce Codacy duplication in dev frontend page and client specs

## Description
Codacy reports 14% code duplication for the repository (the project goal is 10%). This issue tackles the dev frontend page and client specs, which repeat fetch-stub and scenario scaffolding.

Figures below come from Codacy's analysis of `main` at `bb6e9d4`, which already includes #886 (shared loading/error components and `useFetchData` hook for the dev frontend pages) and #889 (the shared `navi-spec-support` package). Neither is a precondition any more.

`navi-spec-support` already provides `useContainer`/`renderInAct` (`dom.js`), `flushAsync`/`flushMany` (`async.js`) and `noop`; this issue must reuse them and not add a second copy to `dev/frontend`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `dev/frontend/spec/pages/CategoryPage_spec.js` | 85 | 18 | 205 |
| `dev/frontend/spec/pages/CategoryItemPage_spec.js` | 80 | 18 | 205 |
| `dev/frontend/spec/pages/CategoryItemsIndexPage_spec.js` | 97 | 15 | 172 |
| `dev/frontend/spec/pages/CategoriesIndexPage_spec.js` | 90 | 12 | 126 |
| `dev/frontend/spec/clients/ItemsClient_spec.js` | 70 | 7 | 64 |
| `dev/frontend/spec/clients/CategoriesClient_spec.js` | 70 | 6 | 55 |

`IndexPage_spec.js` no longer appears (0 duplicated lines since #889).

- The four page specs repeat the same `while loading` / `when data loads successfully` / `when the fetch fails` scenarios and the same fetch stub: `spyOn(globalThis, 'fetch').and.returnValue(Promise.resolve({ ok: true, json: () => Promise.resolve(data) }))` (or a pending/rejected promise), followed by `render()` and `flushAsync()`
- `CategoryPage_spec.js` and `CategoryItemPage_spec.js` are near copies of each other: the same `NavigationCapture` + `MemoryRouter`/`Routes`/`Route` render and the same `when the id changes` scenario, differing only in path, route pattern, component and data
- `CategoriesIndexPage_spec.js` and `CategoryItemsIndexPage_spec.js` each define an identical `makeFetchResponse` (data + `PAGE`/`PAGE-SIZE`/`PAGES` headers) and repeat the `when data loads with multiple pages` scenario (pagination rendered, current page active)
- `ItemsClient_spec.js` and `CategoriesClient_spec.js` repeat the same fetch stub and response assertions: request URL, returned `data`, pagination headers, query string appended to the URL, and the failure case
- Some of these clones are also matched against `frontend/spec` files (`support/fetch_states.js`, `Emissions_spec.js`, `Job_spec.js`), because the fetch stub is the same one the `frontend` specs already share through `frontend/spec/support/fetch.js` (`mockFetchSuccess`, `mockFetchFailure`) and `fetch_states.js` (`itBehavesLikeFetchStates`)

Out of scope:

- Migrating `frontend/` (and the `navi-hey-test` Dockerfile `COPY`) onto `navi-spec-support/fetch.js`, which would remove the remaining duplicate helper; to be tracked as a separate follow-up issue
- The component/hook specs (`PaginatedList_spec.js`, `useFetchData_spec.js`, `LoadingSpinner_spec.js`, `ErrorAlert_spec.js`), which also show clones after #886; revisit only if Codacy still flags them after this issue

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Add a generic `navi-spec-support/fetch.js` (owned by the `spec-support` agent) with the fetch stubs, register it in the package `exports`, README and agent scope docs, and use it in both the page and client specs of `dev/frontend`. Remember consumers hold a `file:` snapshot: re-run `yarn install` in `dev/frontend/` after changing it
  - Mirror the names and semantics of `frontend/spec/support/fetch.js` so the later `frontend/` migration is a pure import swap: `mockFetchSuccess(data)` and `mockFetchFailure(status)` register a `beforeEach`, `stubFetchSuccess(data)` stubs immediately (usable inside an `it`/`beforeEach`, and needed by scenarios that re-stub `fetch` mid-test such as `when the id changes`)
  - Add `mockFetchPending()` (a promise that never resolves) alongside them
  - The success helpers accept an optional `{ headers }` argument (`PAGE`/`PAGE-SIZE`/`PAGES`) so the paginated responses no longer need a local `makeFetchResponse`
- Add a render-with-router helper (path + route pattern + element, optionally capturing `navigate`) for the page specs, kept in `dev/frontend/spec/support/` (owned by the `dev` agent) because it depends on `react-router-dom`, which `spec-support` does not
- Share the loading/error/success scenarios, the `when the id changes` scenario and the multiple-pages scenario across the page specs as shared examples parameterised by the page, its route and its data, following the `itBehavesLikeFetchStates` precedent in `frontend/spec/support/fetch_states.js`
- Table-drive the client specs' request/response cases
- Reuse `navi-spec-support` (`useContainer`, `renderInAct`, `flushAsync`, `noop`); do not copy them into `dev/frontend`
- Leave `frontend/` and `dockerfiles/navi-hey-test` untouched: `frontend/spec/support/fetch.js` (imported by 17 frontend specs and copied verbatim into the navi-hey-test image) keeps its own copy for now
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
