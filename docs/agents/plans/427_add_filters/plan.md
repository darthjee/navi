# Plan: Add Filters

## Overview

Add job-class filtering to the jobs view. A multi-select dropdown in the React frontend lets users pick one or more job classes; the selection is sent as `?filters[class][]=<class>` query parameters; the backend parses and applies those filters before returning the job list.

## Context

- The jobs view currently shows all jobs for a given status with no way to narrow them by class.
- The existing jobs API endpoint is `GET /jobs/:status.json`, handled by `JobsRequestHandler`, which delegates to `JobRegistry.jobsByStatus(status)`.
- The issue asks for a dedicated filter class on the backend that receives the collection and the filter, rather than putting filter logic directly in the handler.

## Implementation Steps

### Step 1 — Backend: Create `JobsFilter`

Create a new class `source/lib/server/JobsFilter.js` that encapsulates filtering logic:

- Constructor receives an array of jobs and a filters object (e.g. `{ class: ['ResourceRequestJob', 'ActionProcessingJob'] }`).
- Exposes a `filter()` method that returns the subset of jobs whose class matches any of the requested classes.
- When no class filter is provided (empty or absent), `filter()` returns all jobs unchanged.
- Add a corresponding spec at `source/spec/lib/server/JobsFilter_spec.js`.

### Step 2 — Backend: Update `JobsRequestHandler`

Update `JobsRequestHandler` to:

- Parse `req.query.filters` (Express will deserialize `filters[class][]=Foo` into `{ class: ['Foo'] }` automatically).
- Instantiate `JobsFilter` with the job list and the parsed filters.
- Return `jobsFilter.filter()` instead of the raw job list.

Update the spec for `JobsRequestHandler` to cover filtered and unfiltered scenarios.

### Step 3 — Frontend: Collect available job classes

In the jobs view, after loading the job list for the current status, derive the set of unique job classes present in the response. This list populates the multi-select dropdown options.

### Step 4 — Frontend: Add multi-select dropdown component

Add a multi-select dropdown (or a set of checkboxes) to the jobs view UI that:

- Renders one option per unique job class found in the current job list (or fetched from the API).
- Tracks selected classes in local component state.
- Is initially empty (no filter applied — all jobs shown).

### Step 5 — Frontend: Wire filter to API request

When the selected classes change, re-fetch the jobs list with the filter query string:

- Build `?filters[class][]=<class>` for each selected class.
- Pass the constructed query string to the existing API client call for `GET /jobs/:status.json`.
- Re-render the job list with the filtered results.

## Files to Change

- `source/lib/server/JobsFilter.js` — new filter class
- `source/spec/lib/server/JobsFilter_spec.js` — new spec for the filter class
- `source/lib/server/JobsRequestHandler.js` — parse filters, apply `JobsFilter`
- `source/spec/lib/server/JobsRequestHandler_spec.js` — add filtered scenario specs
- `frontend/src/` — jobs view component and API client (exact paths TBD after code inspection)

## Notes

- Express's built-in query parser (`qs`) handles `filters[class][]=Foo&filters[class][]=Bar` → `{ class: ['Foo', 'Bar'] }` automatically; no custom parsing needed.
- If only one class is selected, Express may parse it as a string instead of an array — `JobsFilter` should normalise the value to always be an array.
- The frontend dropdown options could be derived from the current job list or from a dedicated API endpoint; for now, deriving from the loaded list is simpler and avoids a new endpoint.
- Open question: should the filter persist across status-tab changes (e.g., moving from "enqueued" to "failed")? Not specified in the issue — assume no persistence for now.
