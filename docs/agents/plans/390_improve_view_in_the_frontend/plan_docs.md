# Plan: Improve View in the Frontend — Documentation

## Overview

Update the existing agent documentation to reflect the new serializer output shape and the refactored frontend component hierarchy.

## Implementation Steps

### Step 1 — Update `docs/agents/web-server.md`

In the **`JobShowSerializer` (detail view)** table, add the new fields and annotate which statuses each field appears in:

| Field | Type | Statuses | Description |
|-------|------|----------|-------------|
| `id` | string | all | Job identifier. |
| `status` | string | all | Current status name. |
| `attempts` | number | all | Number of retry attempts made. |
| `jobClass` | string | all | Constructor name. |
| `arguments` | object | all | Job-specific parameters. |
| `remainingAttempts` | number | enqueued, processing, failed | `maxRetries − attempts`. |
| `readyInMs` | number | failed | Milliseconds until the job is eligible for retry. |
| `lastError` | string\|null | failed, dead | Exception message from `job._fail(error)`; omitted when no error has been recorded. |
| `backtrace` | string\|null | failed, dead | Stack trace of the last error; included whenever `lastError` is present, omitted otherwise. Never present in index views. |

### Step 2 — Update `docs/agents/frontend.md`

- Update the **Component hierarchy** section to describe the status-aware rendering inside `Job`.
- Document the collapsible behaviour for Arguments and Last Error / backtrace.
- Update the `Job` component description to list the per-status field matrix.

## Files to Change

- `docs/agents/web-server.md` — update `JobShowSerializer` output table.
- `docs/agents/frontend.md` — update `Job` component description and hierarchy.
