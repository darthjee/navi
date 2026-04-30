# Plan: Add Filters — Backend

## Overview

Introduce a `JobsFilter` class that encapsulates job-class filtering logic, and update `JobsRequestHandler` to parse and apply class filters from the request query string.

## Implementation Steps

### Step 1 — Create `JobsFilter`

Create `source/lib/server/JobsFilter.js`:

- Constructor receives an array of jobs and a filters object (e.g. `{ class: ['ResourceRequestJob', 'ActionProcessingJob'] }`).
- Exposes a `filter()` method that returns only jobs whose class matches any of the requested classes.
- When the class filter is absent or empty, `filter()` returns all jobs unchanged.
- Normalises the `class` value to always be an array — Express's `qs` parser collapses a single `filters[class][]=Foo` value to a plain string instead of a one-element array.

Add spec: `source/spec/lib/server/JobsFilter_spec.js`.

### Step 2 — Update `JobsRequestHandler`

Update `source/lib/server/JobsRequestHandler.js` to:

- Read `req.query.filters` (Express + `qs` deserialises `filters[class][]=Foo&filters[class][]=Bar` into `{ class: ['Foo', 'Bar'] }` automatically).
- Instantiate `JobsFilter` with the job list and the parsed filters object.
- Return `jobsFilter.filter()` instead of the raw job list.

Update `source/spec/lib/server/JobsRequestHandler_spec.js` to cover:
- No filter param → all jobs returned.
- Single class filter → only matching jobs returned.
- Multiple class filters → union of matching jobs returned.
- Unknown class → empty list returned.

## Files to Change

- `source/lib/server/JobsFilter.js` — new filter class
- `source/spec/lib/server/JobsFilter_spec.js` — new spec
- `source/lib/server/JobsRequestHandler.js` — parse filters, apply `JobsFilter`
- `source/spec/lib/server/JobsRequestHandler_spec.js` — add filtered scenario specs

## Notes

- Express's built-in query parser (`qs`) handles the `filters[class][]` bracket syntax automatically — no custom parsing needed.
- `JobsFilter` must normalise single-string values to arrays to handle the one-item edge case.
- `JobsFilter` should be a pure, dependency-free class so it is easy to unit-test in isolation.
