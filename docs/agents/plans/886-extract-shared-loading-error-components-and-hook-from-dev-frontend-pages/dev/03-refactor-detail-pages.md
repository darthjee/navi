# Refactor the detail pages
Rewrite `CategoryPage` and `CategoryItemPage` to use `useFetchData`, `LoadingSpinner` and `ErrorAlert`:

```jsx
const { data: category, error, loading } = useFetchData(() => fetchCategory(id), [id]);
if (loading) return <LoadingSpinner />;
if (error) return <ErrorAlert message={error} />;
```

Keep the final markup untouched (`<h1>{category.name}</h1>` + "View Items" link; `<h1>{item.name}</h1>`). Existing page specs should pass unchanged; add one scenario to each spec (or the hook spec) covering the deliberate change: after the route `id` changes, the spinner shows again while the new fetch is pending.

## Files to Change
- `dev/frontend/src/pages/CategoryPage.jsx` — use hook and shared components
- `dev/frontend/src/pages/CategoryItemPage.jsx` — use hook and shared components
- `dev/frontend/spec/pages/CategoryPage_spec.js` — keep passing; add id-change scenario if not covered elsewhere
- `dev/frontend/spec/pages/CategoryItemPage_spec.js` — keep passing; add id-change scenario if not covered elsewhere
