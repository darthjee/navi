# Plan: Extract shared loading/error components and hook from dev frontend pages

Issue: [886-extract-shared-loading-error-components-and-hook-from-dev-frontend-pages.md](../../issues/886-extract-shared-loading-error-components-and-hook-from-dev-frontend-pages.md)

## Overview
Remove the duplicated spinner/error markup, fetch-state boilerplate and paginated-list markup from the four dev frontend pages by extracting `LoadingSpinner`, `ErrorAlert`, a generic `useFetchData` hook and a shared `PaginatedList` component. All work is inside `dev/frontend/`.

See [dev.md](dev.md) for the full plan.
