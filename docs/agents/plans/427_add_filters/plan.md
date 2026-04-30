# Plan: Add Filters

## Overview

Add job-class filtering to all job views. A multi-select dropdown lets users pick one or more job classes; the selection is reflected in the URL query string and persists as the user navigates between job status tabs; the backend parses and applies those filters before returning the job list.

## Context

- All job views (enqueued, processing, failed, finished, dead, etc.) currently show every job for a given status with no way to narrow by class.
- The existing jobs API endpoint is `GET /jobs/:status.json`, handled by `JobsRequestHandler`.
- The issue asks for a dedicated filter class on the backend.
- Filters must be visible and persistent across all job status views.

## Sub-plans

- [Backend](plan_backend.md) — `JobsFilter` class and `JobsRequestHandler` update
- [Frontend](plan_frontend.md) — static job-class registry, multi-select dropdown, URL-based filter persistence, and cross-view navigation

## Files to Change

See each sub-plan for the detailed file list.

## Notes

- Filters are stored in the URL query string so they survive page refresh and are shareable/bookmarkable.
- When navigating between job status tabs, the router carries the active `filters` query params to the new route.
- The frontend maintains a static list of known job classes (`src/constants/jobClasses.js`). **Whenever a new job class is added to the backend, this file must also be updated** — documented in `docs/agents/contributing.md`.
- Open question: should there be a "clear filters" button? Not in scope for now; deselecting all options in the dropdown naturally clears the filter.
