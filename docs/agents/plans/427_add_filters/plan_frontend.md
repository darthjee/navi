# Plan: Add Filters — Frontend

## Overview

Add a multi-select dropdown for job-class filtering to every job status view. The active filter is stored in the URL query string so it persists across tab navigation and page refreshes.

## Filter Persistence Strategy

Filters are kept in the URL query string:

- Active URL example: `/#/jobs/dead?filters[class][]=ResourceRequestJob&filters[class][]=ActionProcessingJob`
- When the user switches to another status tab (e.g., from `dead` to `failed`), the router preserves the current filter params in the new URL: `/#/jobs/failed?filters[class][]=ResourceRequestJob&filters[class][]=ActionProcessingJob`.
- On page load the component reads `filters[class][]` from the URL and initialises the dropdown with those values already selected.
- Deselecting all options removes the query string entirely, restoring the plain URL (e.g., `/#/jobs/dead`).

## Implementation Steps

### Step 1 — Parse and serialise filter params

Create a utility (e.g. `src/utils/filterParams.js` or similar) that:

- **Parses** `filters[class][]` from a `URLSearchParams` / location search string into `{ class: string[] }`.
- **Serialises** a filters object back into a query string (`filters[class][]=Foo&filters[class][]=Bar`).

### Step 2 — Read filters from URL on mount

In the jobs view component:

- On mount (and on route change), read `location.search` and parse the `filters[class][]` values.
- Use the parsed values as the initial selection state for the dropdown.

### Step 3 — Create the static job-class registry

Create a constants file (e.g. `src/constants/jobClasses.js`) that exports the exhaustive list of known job classes:

```js
export const JOB_CLASSES = [
  'ResourceRequestJob',
  'ActionProcessingJob',
  'HtmlParseJob',
  'AssetDownloadJob',
];
```

This list is the single source of truth for the dropdown options. **It must be updated whenever a new job class is added to the backend** (see `docs/agents/contributing.md`).

### Step 4 — Add the multi-select dropdown

Add a multi-select dropdown (or checkbox group) to the shared jobs view layout so it appears on every status tab:

- Populate options from `JOB_CLASSES` — all known classes are always shown, regardless of queue state.
- Pre-select the classes already active in the URL.
- On change, update the URL query string (via the router's `navigate` / `history.replace` or equivalent) with the new filter selection — this triggers a re-fetch automatically via the route change.

### Step 5 — Pass filter params to the API request

Update the API client call for `GET /jobs/:status.json` to:

- Read the active filter from the current URL (or from component state already synced with the URL).
- Append the serialised `filters[class][]` query string to the request URL.

### Step 6 — Carry filters when navigating between status tabs

Update the status-tab navigation links so that when the user clicks another tab, the current filter query string is appended to the target URL.

Example: clicking "failed" while `?filters[class][]=ResourceRequestJob` is active navigates to `/#/jobs/failed?filters[class][]=ResourceRequestJob` instead of `/#/jobs/failed`.

## Files to Change

- `frontend/src/constants/jobClasses.js` — new static job-class registry
- `frontend/src/` — jobs view component (exact path TBD after code inspection)
- `frontend/src/` — status-tab navigation component (exact path TBD)
- `frontend/src/` — jobs API client function (exact path TBD)
- `frontend/src/utils/filterParams.js` (or equivalent) — new parse/serialise utility
- `docs/agents/contributing.md` — add checklist item: update `jobClasses.js` when adding a new job class

## Notes

- Keeping filters in the URL means the filtered view is bookmarkable and shareable — no global state or local storage needed.
- `JOB_CLASSES` is the single source of truth for dropdown options; all known classes are always shown, even when queues are empty.
- If the frontend router is React Router, use `useSearchParams` (v6) or `useLocation` + `useHistory` (v5) to read and update the query string without a full navigation.
- The serialisation of `filters[class][]` must match exactly what the backend's `qs` parser expects (`filters%5Bclass%5D%5B%5D=Foo`).
