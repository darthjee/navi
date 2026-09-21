# Plan: Reduce Codacy duplication in dev frontend page and client specs

Issue: [887-reduce-codacy-duplication-in-dev-frontend-page-and-client-specs.md](../../issues/887-reduce-codacy-duplication-in-dev-frontend-page-and-client-specs.md)

## Overview
Add a generic fetch-stub module to the shared `navi-spec-support` package, then use it (plus a router-render helper and shared page scenarios kept in `dev/frontend/spec/support/`) to shrink the four `Category*` page specs and the two client specs of `dev/frontend`. Production code, `frontend/` and the `navi-hey-test` image are not touched; every existing scenario and assertion is preserved.

## Agents involved

- [spec-support](spec-support.md)
- [dev](dev.md)

The `spec-support` work must land first: the `dev` steps import `navi-spec-support/fetch.js`, and `dev/frontend` only sees it after `yarn install` re-copies the `file:` snapshot.

## Shared contracts

New public subpath `navi-spec-support/fetch.js` (ES module, no imports, uses the Jasmine globals `spyOn`/`beforeEach` like `dom.js` does). It is registered in `spec-support/package.json` `exports` as `"./fetch.js": "./fetch.js"` and exports exactly:

| Export | Signature | Behaviour |
| --- | --- | --- |
| `stubFetchSuccess` | `(data, headers?) => void` | Call inside `it`/`beforeEach`: `spyOn(globalThis, 'fetch')` resolving `{ ok: true, json: () => Promise.resolve(data) }`, plus `headers` (a `Headers`) on the response when given |
| `mockFetchSuccess` | `(data, headers?) => void` | Call at `describe` level: registers a `beforeEach` that runs `stubFetchSuccess(data, headers)` |
| `mockFetchFailure` | `(status) => void` | Call at `describe` level: `beforeEach` stub resolving `{ ok: false, status }` |
| `mockFetchPending` | `() => void` | Call at `describe` level: `beforeEach` stub returning a promise that never resolves (loading state) |
| `paginationHeaders` | `({ page = 1, pageSize = 10, pages = 1 } = {}) => Headers` | Builds the `PAGE` / `PAGE-SIZE` / `PAGES` headers (values as strings) that `responseHandler` reads |

`stubFetchSuccess`, `mockFetchSuccess` and `mockFetchFailure` keep the same names and one-argument behaviour as `frontend/spec/support/fetch.js`, so a later migration of `frontend/` is a drop-in import change.
