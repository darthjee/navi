# Plan: Refactor `JobDetails` Component

## Current State

- `JobDetails.jsx` — pure render component but contains all HTML inline, plus constants (`STATUSES_WITH_REMAINING_ATTEMPTS`, `STATUSES_WITH_READY_IN`, `STATUSES_WITH_ERROR`) and conditional rendering logic. No Helper or View file exists.

## Target State

- `JobDetails.jsx` — thin component; delegates to `JobDetailsHelper`
- `JobDetailsHelper.jsx` — **new file**: HTML rendering helpers and the status constants

## Notes on View

`JobDetails` receives `job` as a prop and performs no data fetching — it is a pure rendering component. A `JobDetailsView` is not needed; only a Helper is required to extract the HTML.

## Implementation Steps

### Step 1 — Create `JobDetailsHelper.jsx`

Move into the new Helper class:
- The three `Set` constants: `STATUSES_WITH_REMAINING_ATTEMPTS`, `STATUSES_WITH_READY_IN`, `STATUSES_WITH_ERROR`
- Rendering methods: `renderDetails(job)`, plus private helpers for each conditional block (remaining attempts, ready-in countdown, last error section)

### Step 2 — Update `JobDetails.jsx`

Replace the inline JSX with a call to `JobDetailsHelper.render(job)` (or equivalent). Remove the constants and imports that moved to the Helper.

## Files to Change

- `frontend/src/components/JobDetails.jsx` — delegate rendering to Helper
- `frontend/src/components/JobDetailsHelper.jsx` — **new file**
