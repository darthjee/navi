# Issue: Show Logs on Job View

## Description

Display job-scoped logs at the bottom of the job detail view (`/#/jobs/:job_id`), reusing the same visual component and behaviour already present on the global logs page (`/#/logs`).

## Problem

- The job detail page shows job metadata and status but has no log visibility. Users must navigate away to the global logs page and manually filter.
- The logs display logic (fetching, pagination, polling when idle) is currently implemented directly on the logs page rather than in a reusable component, making it impossible to embed it elsewhere without duplication.
- Logs are fetched via `GET /logs.json`; per-job logs are available at `GET /jobs/:id/logs.json` (introduced in #457), but the frontend does not yet consume this endpoint.

## Expected Behavior

- The bottom of the job detail view (`/#/jobs/:job_id`) shows a logs section that displays only the logs for that job.
- The logs section is visually identical to the one on `/#/logs`.
- Pagination works the same way: the component appends newer entries as they arrive using `last_id`.
- The same polling/idle-wait behaviour applies: when no new logs are returned the component waits and retries.
- The global logs page (`/#/logs`) continues to work unchanged, now backed by the same shared component.

## Solution

- Extract the current logs display into a reusable `LogsPanel` component (or equivalent) that accepts a `logsUrl` (or `jobId`) prop to control which endpoint is fetched.
- Replace the inline logs implementation on `/#/logs` with the new component (no behavioural change).
- Add the `LogsPanel` component to the job detail view (`/#/jobs/:job_id`), passing the job-specific logs URL `GET /jobs/:job_id/logs.json`.
- Add frontend tests for the new component covering both the default and job-scoped URL cases.

## Benefits

- Single source of truth for logs display logic — fixes bugs or style changes in one place.
- Unlocks per-job log visibility directly in the job detail view, reducing context switching for users.
- Sets the pattern for adding logs to other views (e.g. per-worker) without further structural changes.

---
See issue for details: https://github.com/darthjee/navi/issues/458
