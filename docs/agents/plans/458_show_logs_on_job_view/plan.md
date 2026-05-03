# Plan: Show Logs on Job View

## Overview

Extract the log stream display from `LogsPage` into a reusable `Logs` component, then embed that component at the bottom of the job detail page, pointing it at `GET /jobs/:job_id/logs.json`.

## Context

The live log stream on `/#/logs` (fetching `GET /logs.json`, paginating with `last_id`, polling for new entries) is fully self-contained inside `LogsPage` and its controller. Issue #457 added the `GET /jobs/:job_id/logs.json` endpoint. This issue reuses that endpoint to display job-scoped logs inside the job detail view using the same component.

## Implementation Steps

### Step 1 — Create `LogsClient`

Create `frontend/src/clients/LogsClient.js`.

Wraps the log fetch calls:
- `fetchLogs({ lastId } = {})` — `GET /logs.json` with optional `?last_id=<lastId>`
- `fetchJobLogs(jobId, { lastId } = {})` — `GET /jobs/:jobId/logs.json` with optional `?last_id=<lastId>`

Extracts the fetch logic currently embedded in `LogsPageController`, giving both the existing page and the new component a clean API boundary.

Add a spec at `frontend/spec/clients/LogsClient_spec.js`.

### Step 2 — Extract reusable `Logs` component

Create three files following the project's three-file component convention:

- `frontend/src/components/Logs.jsx` — the reusable component. Accepts a `fetchLogs` prop (a function `({ lastId }) => Promise<logs[]>`). Owns the display state; delegates polling logic to `LogsController` and rendering to `LogsHelper`.
- `frontend/src/components/helpers/LogsHelper.jsx` — extracted from `LogsPageHelper` (or the inline JSX in `LogsPage`). Renders the log table/list.
- `frontend/src/components/controllers/LogsController.jsx` — extracted from `LogsPageController`. Manages the `lastId` cursor, polling interval, and appending new entries. Accepts a `fetchLogs` prop.

Add specs at `frontend/spec/components/Logs_spec.js`, `frontend/spec/components/helpers/LogsHelper_spec.js`, and `frontend/spec/components/controllers/LogsController_spec.js`.

### Step 3 — Refactor `LogsPage` to use `Logs`

Update `LogsPage.jsx` to render `<Logs fetchLogs={LogsClient.fetchLogs} />` (no behavioural change for the user). The page itself becomes a thin wrapper.

Update `LogsPage` specs if needed to reflect the delegation.

### Step 4 — Add `Logs` to the job detail view

Update `Job.jsx` to render `<Logs fetchLogs={(opts) => LogsClient.fetchJobLogs(job.id, opts)} />` at the bottom, below the existing job detail sections.

Update `Job` / `JobController` specs to cover the presence of the logs section.

### Step 5 — Update specs

- `frontend/spec/components/Job_spec.js` — verify the logs component is rendered for a known job.
- Any existing `LogsPage` / `LogsPageController` / `LogsPageHelper` specs that tested behaviour now living in the extracted files should be moved or updated accordingly.

## Files to Change

- `frontend/src/clients/LogsClient.js` — **new** — API client for log endpoints
- `frontend/spec/clients/LogsClient_spec.js` — **new** — unit tests for LogsClient
- `frontend/src/components/Logs.jsx` — **new** — reusable log stream component
- `frontend/src/components/helpers/LogsHelper.jsx` — **new** — rendering helpers for Logs
- `frontend/src/components/controllers/LogsController.jsx` — **new** — polling/data logic for Logs
- `frontend/spec/components/Logs_spec.js` — **new** — component tests
- `frontend/spec/components/helpers/LogsHelper_spec.js` — **new** — helper tests
- `frontend/spec/components/controllers/LogsController_spec.js` — **new** — controller tests
- `frontend/src/components/LogsPage.jsx` — delegate to `Logs`; remove now-extracted logic
- `frontend/src/components/helpers/LogsPageHelper.jsx` — reduce to page-level wrapper if still needed
- `frontend/src/components/controllers/LogsPageController.jsx` — reduce to page-level wrapper if still needed
- `frontend/src/components/Job.jsx` — add `Logs` section at the bottom
- `frontend/spec/components/Job_spec.js` — add coverage for logs section

## Notes

- `LogsController` accepts a `fetchLogs` prop so it is agnostic to which endpoint is called — the caller (either `LogsPage` or `Job`) provides the bound fetch function.
- The polling / idle-wait behaviour must be identical in both contexts: same interval, same empty-array detection logic.
- Existing `LogsPage` tests must not regress; move relevant assertions to the new component spec if the logic moves.
- The `Logs` component should handle the case where no logs are yet available without showing an error.
