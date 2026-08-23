# Issue: Crawler: register ExtractionJob and EmitJob in the frontend job-class constants

## Description
Part of #671. The monitoring dashboard (`frontend/`) maps known job class names via `frontend/src/constants/jobClasses.js` (a flat array, `JOB_CLASSES`, consumed only by the job-class filter dropdown in `frontend/src/components/pages/FilterPanel.jsx`). `ExtractionJob` was already added to this list by #674/#681. `EmitJob` (landed on the backend via #693, `source/lib/jobs/EmitJob.js`) is still missing, so jobs of that type fall back to unknown/generic rendering in the filter dropdown.

## Problem
`EmitJob` is not present in `JOB_CLASSES`, so it does not appear as a selectable option in the job-class filter dropdown, unlike the other known job classes.

## Acceptance criteria
- [ ] `EmitJob` appears as an option in the job-class filter dropdown
- [ ] No unknown/fallback rendering for `EmitJob` in the monitoring UI filter
- [ ] `source/static/` is rebuilt with the change

## Solution
- Add an `'EmitJob'` entry to the `JOB_CLASSES` array in `frontend/src/constants/jobClasses.js`, following the existing string-entry convention (the list has no per-entry label/metadata object — each entry is just the job class name string).
- `ExtractionJob` already appears in the list; no changes needed there.
- `frontend/src/components/pages/FilterPanel.jsx` is the only component that consumes `JOB_CLASSES` — confirmed via repo-wide search — so no other filters/legends/icons need updating.
- Rebuild frontend assets (`yarn build`) so `source/static/` picks up the change, per `docs/agents/frontend.md`.

## Related
Part of #671. Depends on #693 (EmitJob landing on the backend), already merged.
