# Plan: Fix Jobs Filters

## Overview

The job class filter in the queues view has no effect — all jobs for a queue are returned regardless of the selected class filter. This plan covers fixing the filter end-to-end: from the frontend filter UI sending the filter value, through the API handler passing it along, down to the job registry applying it when querying jobs by status.

## Context

The queues view in the React frontend displays jobs grouped by status. A job class filter control exists in the UI, but selecting a class does not narrow the displayed results. The backend `GET /jobs/:status.json` endpoint (`JobsRequestHandler`) currently returns all jobs for a given status via `JobRegistry.jobsByStatus(status)` with no support for class-based filtering.

## Implementation Steps

### Step 1 — Add class filter support to `JobRegistryInstance`

Extend `jobsByStatus(status)` (or add an overload/option) to accept an optional `jobClass` parameter. When provided, the returned array should be filtered to only include jobs whose class matches the given value.

### Step 2 — Expose the filter through `JobRegistry`

Propagate the `jobClass` option through the `JobRegistry` static facade so callers can pass it to `JobRegistryInstance`.

### Step 3 — Update `JobsRequestHandler` to accept and forward the filter

Read the `class` (or `jobClass`) query parameter from the incoming request and pass it to `JobRegistry.jobsByStatus(status, { jobClass })`. No class param → no filtering (backward-compatible).

### Step 4 — Fix the frontend to send the filter in the API request

In the queues view component, when a job class filter is selected, include the filter value as a query parameter in the fetch call to `/jobs/:status.json`. When the filter is cleared, omit the parameter so all jobs are returned.

### Step 5 — Add/update tests

- Unit test `JobRegistryInstance.jobsByStatus` with a class filter.
- Unit test `JobsRequestHandler` with and without the class query param.
- Frontend component test verifying the filter param is included in the request.

## Files to Change

- `source/lib/background/JobRegistryInstance.js` — add optional class filtering in `jobsByStatus`
- `source/lib/background/JobRegistry.js` — propagate the filter option through the facade
- `source/lib/server/JobsRequestHandler.js` — read `class` query param and forward to registry
- `frontend/src/` — queues view/page component: send filter value in the API fetch call
- Corresponding spec files under `source/spec/` and `frontend/`

## Notes

- The filter should be optional and backward-compatible; omitting it must return all jobs as before.
- The exact query parameter name (`class`, `jobClass`, etc.) should be consistent between frontend and backend.
- Need to confirm how jobs store/expose their class name to know what field to filter on.
