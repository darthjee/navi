# Issue: Add Logs Per Job Endpoint

## Description

Add a dedicated REST endpoint `GET /jobs/:job_id/logs.json` for retrieving logs scoped to a specific job. This mirrors the existing `GET /logs.json` endpoint and supports the same `last_id` pagination parameter.

## Problem

- There is no dedicated route for fetching logs by job ID. Callers must currently use `GET /logs.json?jobId=<id>` (added in #428), but a clean REST path under `/jobs/:job_id/logs.json` is more idiomatic and easier to consume from the frontend.
- The `last_id` pagination mechanism available on the default logs endpoint should also be available for per-job log queries.

## Expected Behavior

- `GET /jobs/:job_id/logs.json` returns logs for the given job ID in the same serialized format as `GET /logs.json`.
- The `last_id` query parameter works identically: when provided, only logs newer than that ID are returned.
- The response is paginated with the same page-size limit as the default logs endpoint.
- An unknown job ID returns an empty array (not a 404).

## Solution

- Add a new `JobLogsRequestHandler` (or reuse `LogsRequestHandler` with the job ID injected from the route param) that delegates to `LogRegistry.getLogsByJobId(jobId)`.
- Register the route `GET /jobs/:job_id/logs.json` in the router/route register.
- Apply `LogFilter` with `lastId` just as `LogsRequestHandler` does for the default buffer.
- Add unit tests for the handler and integration/route tests for the new path.

## Benefits

- Provides a cleaner, more RESTful API surface for clients that need per-job log streams.
- Builds directly on the `LogBufferCollection` infrastructure introduced in #428 with no additional storage changes.
- Enables the frontend monitoring dashboard to display job-scoped log views without client-side filtering.

---
See issue for details: https://github.com/darthjee/navi/issues/457
