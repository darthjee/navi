# Dev Plan: Extract shared loading/error components and hook from dev frontend pages

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add LoadingSpinner and ErrorAlert components](dev/01-add-loading-spinner-and-error-alert.md)
- [02 — Add useFetchData hook](dev/02-add-use-fetch-data-hook.md)
- [03 — Refactor the detail pages](dev/03-refactor-detail-pages.md)
- [04 — Add PaginatedList and refactor the index pages](dev/04-add-paginated-list-and-refactor-index-pages.md)
- [05 — Verify tests, lint and duplication](dev/05-verify-tests-lint-and-duplication.md)

## CI Checks
- `dev/frontend`: `yarn test` (CI job: `jasmine-dev-frontend`)
- `dev/frontend`: `yarn lint` and `yarn report` (jscpd) (CI job: `checks-dev-frontend`)

## Notes
- **Deliberate behaviour change:** the hook always sets `loading` to `true` at the start of every fetch, so `CategoryPage` and `CategoryItemPage` will now show the spinner when `id` changes (they previously showed stale data). Rendered output for the same data/error/loading states must otherwise stay identical.
- The index pages already call `setLoading(true)` synchronously inside `useEffect`; if `eslint-plugin-react-hooks` (v7) flags the same pattern in the hook, keep whatever disable/config the existing pages rely on rather than changing the behaviour. Also check that `react-hooks/exhaustive-deps` accepts a caller-supplied deps array; if not, add a narrowly scoped disable comment with a reason.
- Query-string handling (`useLocation` → `search.slice(1)`) belongs in `PaginatedList`, not in the generic hook.
- `dev/frontend/report/` (jscpd output) is untracked local output; do not commit it.
- Success is measured by Codacy after merge; locally, `yarn report` (jscpd) should show the four pages with far fewer clones.
