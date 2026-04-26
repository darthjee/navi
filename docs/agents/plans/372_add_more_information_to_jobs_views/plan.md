# Plan: Add More Information to Jobs Views

## Overview

Enrich the jobs views by exposing more job fields in both the backend API and the frontend UI. The backend requires a serializer refactor (split by view and job class); the frontend requires updating the index and show components to display the new fields.

## Context

The current jobs API returns only id, status, and attempts. Operators need richer data — job class, arguments, remaining attempts, and retry countdown — to debug and monitor queued work. The serializer must be restructured so index and show responses can carry different payloads, and so each job class can contribute its own fields.

## Implementation Steps

### Step 1 — Refactor the backend serializer (`source/`)

Split the current job serializer into a hierarchy:

- **Index serializer** — returns the fields currently shown plus `jobClass`.
- **Show serializer** — extends index; also returns `arguments`, `remainingAttempts`, and `readyAt` (the timestamp when the job becomes eligible for retry, derived from cooldown; `null` when ready immediately).
- **Per-job-class serializers** — one subclass per job type (`ResourceRequestJob`, `ActionProcessingJob`, `HtmlParseJob`, `AssetDownloadJob`) that overrides `arguments` to expose the relevant job-specific fields.
- **Master serializer** — dispatcher that picks the correct serializer based on job class and view (index vs. show), then calls `serialize`.

### Step 2 — Update the web server API endpoints (`source/`)

Update `JobsRequestHandler` (index) and `JobRequestHandler` (show) to use the master serializer instead of the current ad-hoc serialization.

### Step 3 — Update the frontend index component (`frontend/`)

Add the `jobClass` field to each row in the jobs list view.

### Step 4 — Update the frontend show component (`frontend/`)

Add the following fields to the job detail view:
- Job class
- Arguments
- Remaining attempts
- Retry countdown — a live countdown to `readyAt`; displays "ready" when `readyAt` is null or in the past.

## Files to Change

- `source/lib/` — new serializer classes (index, show, per-class, master); exact file paths to be confirmed by inspecting the codebase
- `source/lib/server/` — `JobsRequestHandler` and `JobRequestHandler` updated to use the master serializer
- `frontend/src/` — jobs index component and job show component (exact files to be confirmed)

## Notes

- `readyAt` should be computed from the job's last failure timestamp plus `retryCooldown` from `WorkersConfig`; when the job has never failed or is not in cooldown, it is `null`.
- The countdown on the frontend can be a simple interval-based component that re-renders every second.
- Splitting serializers per job class is important because `arguments` differs across job types (e.g., `ResourceRequestJob` has a URL; `ActionProcessingJob` has an action + item).
- The exact file locations for existing serialization logic and frontend components are not yet known — a codebase pass is needed before implementation.
