# Issue: Add Pagination to Dev App Frontend

## Description

The JSON endpoints that list collections in `dev/frontend` now return paginated responses (introduced by #515). The frontend currently only requests the first page and has no UI to navigate between pages. This issue adds full pagination support to the frontend.

## Problem

- The frontend only fetches the first page of collection endpoints (e.g. `/categories.json`), ignoring the pagination headers introduced in #515.
- There is no pagination UI to let the user navigate to other pages.

## Expected Behavior

- The frontend reads pagination headers from collection endpoints and renders a Bootstrap pagination component.
- The pagination component lists available pages. When there are more than 10 pages it uses an ellipsis pattern:
  - General case: `(1), (2), ..., (prev), (current), (next), ..., (last-1), (last)`
  - Near the start: no duplicate links — e.g. on page 3: `(1), (2), (3), (4), ..., (last-1), (last)`
  - Near the end: same logic in reverse.
- Pagination links use hash-based routing:
  - `/#/categories` loads `/categories.json` (first page) and renders links like `(/#/categories?page=1)`, `(/#/categories?page=2)`, etc.
  - `/#/categories?page=5` loads `/categories.json?page=5`.
  - `/#/categories?<some_query>` loads `/categories.json?<some_query>`.
- Clicking a pagination link navigates to the corresponding hash URL, which triggers loading of that page from the API.

## Solution

- Update the frontend API client to forward query parameters (including `page`) when fetching collection endpoints.
- Add a pagination component using Bootstrap's pagination styles.
- Implement the ellipsis logic for large page counts.
- Wire pagination links to the hash-based router so page changes update the URL and reload the correct data.

## Benefits

- Users can browse all pages of large collections in the dev app frontend.
- Keeps the frontend consistent with the paginated API introduced in #515.

---
See issue for details: https://github.com/darthjee/navi/issues/516
