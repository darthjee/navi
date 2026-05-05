# Plan: Add Pagination to Dev App Frontend

## Overview

Update the `dev/frontend/` React SPA to support paginated collection endpoints. The backend already returns pagination headers (introduced in #515); this plan covers forwarding query parameters to the API, reading pagination headers from responses, rendering a Bootstrap pagination component, and wiring pagination to the hash-based router.

## Context

Collection endpoints (e.g. `/categories.json`) now return paginated responses with the following headers:

| Header | Meaning |
|--------|---------|
| `PAGE` | Current page number |
| `PAGE-SIZE` | Number of items per page |
| `PAGES` | Total number of pages |

The frontend currently ignores these headers and only fetches the first page. Users cannot navigate to subsequent pages.

Pagination uses hash-based routing:
- `/#/categories` → loads `/categories.json` (page 1)
- `/#/categories?page=5` → loads `/categories.json?page=5`
- `/#/categories?<any_query>` → loads `/categories.json?<any_query>`

## Current Structure (`dev/frontend/src/`)

```
src/
├── App.jsx
├── main.jsx
├── clients/
│   ├── CategoriesClient.js   # fetchCategories(), fetchCategory(id)
│   └── ItemsClient.js        # fetchItems(categoryId), fetchItem(categoryId, id)
├── pages/
│   ├── IndexPage.jsx
│   ├── CategoriesIndexPage.jsx
│   ├── CategoryPage.jsx
│   ├── CategoryItemsIndexPage.jsx
│   └── CategoryItemPage.jsx
└── styles/
    └── main.css
```

Page components follow a uniform pattern: `useState` for data/error/loading, `useEffect` for fetching via the client, Bootstrap spinner/alert for loading and error states.

API clients use native `fetch()`, check `res.ok`, and return the parsed JSON. Currently they do not forward query parameters.

## Implementation Steps

### Step 1 — Update API clients to forward query parameters

Modify `fetchCategories()` in `CategoriesClient.js` and `fetchItems(categoryId)` in `ItemsClient.js` to accept an optional `queryString` parameter and append it to the endpoint URL.

```js
// Example
export const fetchCategories = (queryString = '') => {
  const url = `/categories.json${queryString ? `?${queryString}` : ''}`;
  return fetch(url).then(res => { ... });
};
```

The calling page component reads the current search params from the URL and passes them through.

### Step 2 — Return pagination metadata from clients

Update the client functions to return both the JSON body and the pagination headers together, so the page component can consume them without accessing the raw response.

```js
return fetch(url)
  .then(res => {
    if (!res.ok) throw new Error(res.status);
    return res.json().then(data => ({
      data,
      pagination: {
        page: Number(res.headers.get('PAGE')),
        pageSize: Number(res.headers.get('PAGE-SIZE')),
        pages: Number(res.headers.get('PAGES')),
      },
    }));
  });
```

### Step 3 — Read page param in paginated page components

In `CategoriesIndexPage` and `CategoryItemsIndexPage`, use `useLocation()` from React Router to read the current query string and extract the `page` param. Pass the query string to the client and store the returned `pagination` object in state alongside the data.

```jsx
const { search } = useLocation();
const params = new URLSearchParams(search);
const currentPage = Number(params.get('page') || 1);
```

Re-run the effect whenever `search` changes (add it to the `useEffect` dependency array).

### Step 4 — Implement the Pagination component

Create `src/components/Pagination.jsx` — a reusable functional component using Bootstrap 5 pagination classes.

**Props:** `currentPage`, `totalPages`, `basePath` (e.g. `"/#/categories"`)

**Rendered HTML shape:**
```html
<nav aria-label="Page navigation">
  <ul class="pagination justify-content-center">
    <li class="page-item [disabled]"><a class="page-link" href="...">«</a></li>
    <li class="page-item [active]"><a class="page-link" href="...">1</a></li>
    <li class="page-item disabled"><span class="page-link">…</span></li>
    ...
    <li class="page-item [disabled]"><a class="page-link" href="...">»</a></li>
  </ul>
</nav>
```

Bootstrap classes used: `pagination`, `page-item`, `page-link`, `active`, `disabled`.

**Ellipsis logic (when `totalPages > 10`):**

Always render: first 2 pages, last 2 pages, and a window of `[currentPage-1, currentPage, currentPage+1]`. Fill the gaps with `…` only when the gap is more than 1 position wide.

```
General (page 6 of 15):   1  2  …  5  6  7  …  14  15
Near start (page 3):       1  2  3  4  …  14  15
Near end (page 13 of 15): 1  2  …  12  13  14  15
```

The page-list computation (which page numbers and ellipses to show) lives in a helper function inside the same file (or a small `paginationPages(currentPage, totalPages)` utility), keeping the component simple.

### Step 5 — Integrate Pagination into collection pages

In `CategoriesIndexPage` and `CategoryItemsIndexPage`, render `<Pagination>` below the list, passing the pagination state:

```jsx
{pagination && pagination.pages > 1 && (
  <Pagination
    currentPage={pagination.page}
    totalPages={pagination.pages}
    basePath="/#/categories"
  />
)}
```

## Files to Change

| File | Change |
|------|--------|
| `dev/frontend/src/clients/CategoriesClient.js` | Accept `queryString`, return `{ data, pagination }` |
| `dev/frontend/src/clients/ItemsClient.js` | Same as above for `fetchItems` |
| `dev/frontend/src/pages/CategoriesIndexPage.jsx` | Read `search` param, pass to client, store pagination, render `<Pagination>` |
| `dev/frontend/src/pages/CategoryItemsIndexPage.jsx` | Same as above |
| `dev/frontend/src/components/Pagination.jsx` (new) | Bootstrap pagination component with ellipsis logic |
| `dev/frontend/spec/` | Unit tests for ellipsis logic and `Pagination` component |

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/frontend/`: `yarn test` and `yarn lint` (CircleCI jobs: `jasmine-dev-frontend`, `checks-dev-frontend`)

## Notes

- The `PAGE`, `PAGE-SIZE`, and `PAGES` headers come from #515.
- File organization (controllers/helpers split) will be addressed in a follow-up.
- When `totalPages <= 1`, do not render the `<Pagination>` component at all.
- Prev/next arrow links (`«`/`»`) should be `disabled` when on the first/last page respectively.
