# Add PaginatedList and refactor the index pages
Create `dev/frontend/src/components/PaginatedList.jsx` holding everything the two index pages share:

- reads `search` via `useLocation()` and derives `queryString = search ? search.slice(1) : ''`
- calls `useFetchData(() => fetchPage(queryString), [queryString, ...])` where the fetched value is `{ data, pagination }` (the shape `fetchCategories`/`fetchItems` already return)
- renders `LoadingSpinner` / `ErrorAlert` / the `<h1>{title}</h1>` + `<ul className="list-group mt-3">` of `<li className="list-group-item"><Link to={itemPath(item)}>{item.name}</Link></li>` + `Pagination` when `pagination && pagination.pages > 1`

Suggested props: `title`, `fetchPage(queryString)`, `itemPath(item)`, `basePath`, and an extra dependency (e.g. `resourceId`) so `CategoryItemsIndexPage` refetches when the category `id` changes. Final prop naming is the implementer's call as long as the rendered markup is byte-for-byte the same as today.

Then reduce the pages to thin wrappers:

- `CategoriesIndexPage`: `title="Categories"`, `fetchPage={fetchCategories}`, ``itemPath={(cat) => `/categories/${cat.id}`}``, `basePath="/#/categories"`
- `CategoryItemsIndexPage`: `useParams()` for `id`, `title="Items"`, `fetchPage={(qs) => fetchItems(id, qs)}`, ``itemPath={(item) => `/categories/${id}/items/${item.id}`}``, ``basePath={`/#/categories/${id}/items`}``

Add `spec/components/PaginatedList_spec.js` (loading, error, list rendering with links, pagination shown only when `pages > 1`, query string forwarded to `fetchPage`, refetch on search change). Keep the existing index page specs passing; trim any now-redundant scenarios only if they are fully covered by the component spec and still verify the same behaviour for the page.

## Files to Change
- `dev/frontend/src/components/PaginatedList.jsx` — new shared component
- `dev/frontend/src/pages/CategoriesIndexPage.jsx` — thin wrapper around `PaginatedList`
- `dev/frontend/src/pages/CategoryItemsIndexPage.jsx` — thin wrapper around `PaginatedList`
- `dev/frontend/spec/components/PaginatedList_spec.js` — new spec
- `dev/frontend/spec/pages/CategoriesIndexPage_spec.js` — keep passing
- `dev/frontend/spec/pages/CategoryItemsIndexPage_spec.js` — keep passing
