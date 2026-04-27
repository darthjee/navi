# Issue: Improve View in the Frontend

## Description

All job detail (show) views in the frontend look identical regardless of the job's current status. Each status should display a tailored set of fields to give the user the most relevant information.

## Problem

- The `Job` detail page renders the same fields for every job, independently of its status.
- Some fields (e.g. `readyInMs`, `lastError`, backtrace) are only meaningful for certain statuses but are either always shown or never shown.
- The backend serializer does not yet expose all the information needed for status-specific views.

## Expected Behavior

Each job detail view should display:

**All statuses:**
- ID
- Attempts
- Class
- Arguments (collapsible element)

**Status-specific additions:**
- `enqueued` — Remaining Attempts
- `processing` — Remaining Attempts
- `failed` — Remaining Attempts · Ready In · Last Error (collapsible)
- `finished` — (no additional fields)
- `dead` — Last Error (collapsible, including backtrace)

## Solution

- Update the backend serializer (`JobShowSerializer`) to expose the additional fields (`lastError`, backtrace), handling cases where a field may be absent (e.g. no error recorded yet).
- Add tests for the serializer covering cases where optional fields are empty or missing.
- Implement a base job-detail component and status-specific sub-components (or conditional rendering) in the frontend so each status renders only its relevant fields.
- Make Arguments and Last Error collapsible in the UI.
- Update the documentation to reflect the new serializer output and component structure.

## Benefits

- Users can quickly understand the state of a job without irrelevant noise.
- Failed and dead jobs expose actionable error information (message + backtrace) directly in the UI.
- Cleaner component hierarchy makes future per-status customisation easier to add.

---
See issue for details: https://github.com/darthjee/navi/issues/390
