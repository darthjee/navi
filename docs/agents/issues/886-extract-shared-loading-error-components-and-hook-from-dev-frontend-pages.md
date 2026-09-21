# Issue: Extract shared loading/error components and hook from dev frontend pages

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the four dev frontend page components, which are the only non-spec source files in Codacy's top duplication list.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `dev/frontend/src/pages/CategoryItemsIndexPage.jsx` | 58 | 7 | 80 |
| `dev/frontend/src/pages/CategoriesIndexPage.jsx` | 57 | 6 | 74 |
| `dev/frontend/src/pages/CategoryPage.jsx` | 39 | 6 | 66 |
| `dev/frontend/src/pages/CategoryItemPage.jsx` | 38 | 5 | 60 |

- All four pages contain the same spinner block (`<div className="container mt-5 text-center"><div className="spinner-border" role="status" /></div>`) and the same `alert alert-danger` error block
- All four use the same `useState` (data, error, loading) + `useEffect` + `fetch...().then(...).catch(...).finally(...)` pattern; the two index pages also share the same query-string handling (`search ? search.slice(1) : ''`), pagination state and markup (CategoriesIndexPage:25-45 vs CategoryItemsIndexPage:26-46, 49-57 vs 50-58)
- The pages differ slightly in behaviour: the two index pages call `setLoading(true)` on every refetch (so the spinner reappears when `search`/`id` changes), while `CategoryPage` and `CategoryItemPage` only show the spinner on first mount

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios), with the single deliberate exception described under Solution.

## Solution
- Extract `LoadingSpinner` and `ErrorAlert` components next to `components/Pagination.jsx` (`dev/frontend/src/components/`)
- Extract a generic data-fetching hook in a new `dev/frontend/src/hooks/` folder that owns the loading/error/data state (takes a fetcher and its dependencies)
- Extract a shared paginated-list component (or hook + component) used by `CategoriesIndexPage` and `CategoryItemsIndexPage`. It owns the `useLocation` → query-string handling, pagination state and the list/`Pagination` markup; the generic hook stays free of query-string concerns. Each page only supplies the fetch call, heading, item link and `basePath`
- The hook always sets `loading` to `true` at the start of every fetch. This is a deliberate, minor change for `CategoryPage` and `CategoryItemPage`: they will show the spinner when `id` changes instead of briefly showing stale data. Rendered output for the same data/error/loading states is otherwise unchanged
- Update the existing page specs so they still pass; add component-level specs for the extracted components and hook
- Scope: `dev/frontend/` only (dev agent)

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
- Makes loading behaviour consistent across all four pages
