# Issue: Add Routes to Webserver

## Description

The Navi webserver needs additional JSON routes to expose job information so the front-end can display richer data.

## Problem

- There is no endpoint to list jobs filtered by status (enqueued, failed, etc.).
- There is no endpoint to inspect a specific job's details (e.g., last error).
- The front-end currently lacks the data it needs to show meaningful job information.

## Expected Behavior

- `GET /jobs/:status.json` — returns a list of jobs in the given status (e.g., `enqueued`, `failed`).
- `GET /job/:id.json` — returns details for a specific job, including fields like `lastError`.

## Solution

- Add a route handler for `GET /jobs/:status.json` that queries the job queue and filters by status.
- Add a route handler for `GET /job/:id.json` that looks up a job by ID and returns its full detail object.
- Return responses as JSON.
- Update the dev proxy configuration to forward requests matching `/jobs/:status.json` and `/job/:id.json` to the backend, since the JSON data originates from the Navi application (not from static assets or the front-end).

## Benefits

- Enables the front-end to display real-time job status and error information.
- Provides a foundation for richer observability into Navi's internal queue state.

---
See issue for details: https://github.com/darthjee/navi/issues/352
