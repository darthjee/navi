# Frontend Plan: Crawler: register ExtractionJob and EmitJob in the frontend job-class constants

Main plan: [plan.md](plan.md)

## Overview
`frontend/src/constants/jobClasses.js` exports `JOB_CLASSES`, a flat array of known job-class name strings used as the single source of truth for the job-class filter dropdown (consumed only by `frontend/src/components/pages/FilterPanel.jsx`, confirmed via repo-wide search — no other filters/legends/icons key off this list). `ExtractionJob` is already present (added by #674/#681). `EmitJob` (landed on the backend via #693, `source/lib/jobs/EmitJob.js`) is still missing, so jobs of that type fall back to unknown/generic rendering in the filter.

## Context
Part of #671, the crawler epic that introduced `ExtractionJob` and `EmitJob` on the backend. This is the final piece: making the frontend aware of `EmitJob` so it appears as a real filter option.

## Implementation Steps

### Step 1 — Add `EmitJob` to `JOB_CLASSES`
Add `'EmitJob'` as a new entry in the `JOB_CLASSES` array in `frontend/src/constants/jobClasses.js`, following the existing plain-string entry convention (there is no per-entry label/metadata object in this list — just the job class name).

### Step 2 — Rebuild frontend assets
Run `yarn build` inside `frontend/` so `source/static/` picks up the change, per `docs/agents/frontend.md`'s contribution note. Commit the resulting `source/static/` output alongside the source change.

## Files to Change
- `frontend/src/constants/jobClasses.js` — add `'EmitJob'` to the `JOB_CLASSES` array
- `source/static/` — rebuilt output from `yarn build`

## CI Checks
- `frontend`: `npm run lint` (CI job: `checks-frontend`)
- `frontend`: `npm run coverage` (CI job: `jasmine-frontend`)

## Notes
- `ExtractionJob` already appears in `JOB_CLASSES`; no change needed for it.
- The dependency on `EmitJob` existing on the backend is already satisfied — it landed via #693 (merged).
