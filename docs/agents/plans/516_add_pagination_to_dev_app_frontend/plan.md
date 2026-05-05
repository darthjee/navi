# Plan: Add Pagination to Dev App Frontend

## Overview

Update the `dev/frontend/` React SPA to support paginated collection endpoints. The backend already returns pagination headers (introduced in #515); this plan covers forwarding query parameters to the API, rendering a Bootstrap pagination component, and wiring pagination to the hash-based router.

## Context

Collection endpoints (e.g. `/categories.json`) now return paginated responses with pagination headers. The frontend currently ignores these headers and only fetches the first page. Users cannot navigate to subsequent pages.

Pagination uses hash-based routing:
- `/#/categories` → loads `/categories.json` (page 1)
- `/#/categories?page=5` → loads `/categories.json?page=5`
- `/#/categories?<any_query>` → loads `/categories.json?<any_query>`

## Implementation Steps

### Step 1 — Forward query parameters in API client

Update the API client that fetches collection data to read query parameters from the current hash URL and pass them through to the JSON endpoint request. This ensures that when the user navigates to `/#/categories?page=5`, the client fetches `/categories.json?page=5`.

### Step 2 — Read pagination headers from responses

After each collection fetch, extract the pagination metadata from the response headers (total pages, current page, etc.) and make it available to the component.

### Step 3 — Implement the Pagination component tree

Following the project's three-file component convention, the pagination UI is split into:

#### `components/elements/Pagination.jsx`

Top-level element component. Receives `currentPage`, `totalPages`, and `basePath` as props. Delegates page-list computation to `PaginationController` and rendering to `PaginationHelper`.

```jsx
// Minimal shape
<nav aria-label="Page navigation">
  <ul className="pagination justify-content-center">
    {pages.map(entry => <PaginationItem key={entry.key} {...entry} />)}
  </ul>
</nav>
```

Uses Bootstrap 5 classes: `pagination`, `page-item`, `page-link`, `active`, `disabled`.

#### `components/elements/controllers/PaginationController.js`

Pure JS class (no JSX). Receives `currentPage` and `totalPages`, exposes a `pages()` method that returns the ordered list of page descriptors to render.

Each descriptor is one of:
- `{ type: 'page', page: N, active: bool }` — a numbered link
- `{ type: 'ellipsis', key: string }` — a `…` separator (not clickable)

**Ellipsis logic (when `totalPages > 10`):**

Always show: first 2, last 2, and a window of `[currentPage-1, currentPage, currentPage+1]`.

```
General (page 6 of 15):   1  2  …  5  6  7  …  14  15
Near start (page 3):       1  2  3  4  …  14  15   ← no duplicate
Near end (page 13 of 15): 1  2  …  12  13  14  15  ← no duplicate
```

Deduplication rule: if the always-shown pages and the window pages are adjacent or overlapping, merge them and drop the ellipsis between them.

#### `components/elements/helpers/PaginationHelper.jsx`

Pure rendering helper. Maps the descriptor list from `PaginationController` into Bootstrap `<li>` elements.

- `type: 'page'` → `<li class="page-item [active]"><a class="page-link" href={hashUrl}>N</a></li>`
- `type: 'ellipsis'` → `<li class="page-item disabled"><span class="page-link">…</span></li>`

#### `components/elements/PaginationItem.jsx` (optional)

Small stateless component for a single page `<li>` + `<a>` pair, if the helper grows large enough to warrant it.

### Step 4 — Wire pagination to hash-based router

Pagination links are plain `<a href>` elements pointing to hash URLs:

```
/#/categories?page=2
/#/categories/:id/items?page=3
```

React Router's `HashRouter` picks up the new location on click. Each collection page component reads `useSearchParams()` (or `useLocation()`) to extract the `page` query parameter and passes it to the API client.

No programmatic navigation is needed — standard anchor links update the hash and trigger a React Router re-render.

### Step 5 — Integrate pagination into collection views

Add `<Pagination>` below the list in each paginated collection page:

- `CategoriesIndexPage` — below the categories list
- `CategoryItemsIndexPage` — below the items list

Each page component already fetches its data; extend it to also capture `currentPage` and `totalPages` from the response (via the controller) and pass them to `<Pagination basePath="/#/categories" />`.

## Files to Change

- `dev/frontend/src/clients/` — add or update the collection API client to forward query params (including `page`) from the current URL to the fetch call
- `dev/frontend/src/components/pages/CategoriesIndexPage.jsx` — read pagination state, render `<Pagination>`
- `dev/frontend/src/components/pages/CategoryItemsIndexPage.jsx` — same as above
- `dev/frontend/src/components/elements/Pagination.jsx` (new) — top-level pagination element
- `dev/frontend/src/components/elements/helpers/PaginationHelper.jsx` (new) — Bootstrap `<li>` rendering
- `dev/frontend/src/components/elements/controllers/PaginationController.js` (new) — page descriptor list + ellipsis logic
- `dev/frontend/spec/` — unit tests for `PaginationController` (ellipsis edge cases) and component tests for `Pagination`

## Notes

- The exact header names for pagination metadata (current page, total pages) come from #515 — confirm they match what the backend sends.
- The ellipsis component must not render the same page link twice (e.g. if current page is adjacent to an always-shown page, skip the ellipsis).
- Need to confirm how the hash router is currently implemented in `dev/frontend/` to know how to hook into URL changes.
