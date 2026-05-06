# Plan: Pass More Information for Jobs — Frontend

## Overview

Update the React SPA to display the `originUrl` field returned by the backend in both the jobs listing and the show-job detail page.

## Implementation Steps

### Step 1 — Update the jobs listing (if applicable)

If the jobs table already shows arguments or metadata columns, add `originUrl` as an optional column or tooltip. Skip if the listing does not surface per-job arguments.

Files:
- Relevant component under `frontend/src/` (exact path to be confirmed by codebase inspection)

### Step 2 — Update the show-job page

On the job detail page, render the `originUrl` value inside the arguments section when it is present.

- Display it as a labelled field (e.g., "Origin URL").
- If `originUrl` is `null` or absent, render nothing (do not show an empty row).

Files:
- Show-job component under `frontend/src/` (exact path to be confirmed by codebase inspection)

### Step 3 — Update API client / type definitions (if applicable)

If the frontend uses typed API responses or a dedicated API client module, add `originUrl` to the job response type.

Files:
- API client or type definition under `frontend/src/` (exact path to be confirmed)

## Files to Change

- Show-job component — render `originUrl` in arguments section
- Jobs listing component — optionally surface `originUrl` (TBD after codebase inspection)
- API client / types — add `originUrl` field to job response shape (if applicable)

## Notes

- The exact component paths need to be confirmed; check `frontend/src/` structure during implementation.
- The field should be treated as optional — `null` means the job is a root `ResourceRequestJob` and no origin needs to be shown.
