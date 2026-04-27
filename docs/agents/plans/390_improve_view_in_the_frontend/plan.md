# Plan: Improve View in the Frontend

## Overview

This plan covers making job detail (show) views status-aware. Currently all statuses render the same set of fields. After this change, each status will display only the fields relevant to it, and two fields (Arguments and Last Error) will be collapsible. The work spans the backend serializer and the React frontend.

## Context

The `Job` detail page always shows the same fields regardless of status. Some fields (`remainingAttempts`, `readyInMs`) are meaningless for finished or dead jobs, and the backend does not yet expose `lastError` or backtrace at all. The fix requires changes on both sides: the serializer must expose the new data, and the frontend must render it conditionally per status.

## Implementation Steps

### Step 1 — Extend `JobShowSerializer` (backend)

Add `lastError` and `backtrace` to the serialized output. Both fields must be optional: return `null` (or omit them) when no error has been recorded. All existing fields are kept.

New output shape:

| Field | Statuses present |
|-------|-----------------|
| `id` | all |
| `status` | all |
| `attempts` | all |
| `jobClass` | all |
| `arguments` | all |
| `remainingAttempts` | enqueued, processing, failed |
| `readyInMs` | failed |
| `lastError` | failed, dead |
| `backtrace` | dead |

### Step 2 — Add / update serializer tests (backend)

Cover:
- Each status with all expected fields present and correctly valued.
- Cases where `lastError` / `backtrace` are absent (e.g. a freshly enqueued job that has never failed).

### Step 3 — Refactor the `Job` component (frontend)

Split the single `Job` component into a base component plus status-specific sub-components (or use conditional rendering blocks inside `Job`). The base renders the common fields; each status variant adds its own fields.

Status-specific rendering:
- `enqueued` — Remaining Attempts
- `processing` — Remaining Attempts
- `failed` — Remaining Attempts, Ready In, Last Error (collapsible)
- `finished` — (no additions)
- `dead` — Last Error + backtrace (collapsible)

### Step 4 — Make Arguments and Last Error collapsible (frontend)

Wrap the Arguments JSON block and the Last Error / backtrace sections in a collapsible element (e.g. an HTML `<details>`/`<summary>` or a Bootstrap `Collapse` component).

### Step 5 — Update frontend tests

Add or update component tests to verify that each status renders the correct fields and hides the irrelevant ones.

### Step 6 — Update documentation

Update `docs/agents/web-server.md` (serializer output table) and `docs/agents/frontend.md` (component hierarchy and field descriptions) to reflect the new behaviour.

## Files to Change

- `source/lib/server/serializers/JobShowSerializer.js` — add `lastError` and `backtrace` fields.
- `spec/lib/server/serializers/JobShowSerializer_spec.js` — extend tests for new fields and empty-field cases.
- `frontend/src/components/Job.jsx` — refactor into status-aware rendering.
- `frontend/src/components/` — add status-specific sub-components if needed.
- `frontend/spec/` — update / add component tests.
- `docs/agents/web-server.md` — update serializer output table.
- `docs/agents/frontend.md` — update component hierarchy description.

## Notes

- `backtrace` is only required for `dead` jobs; the serializer should not include it for other statuses to keep the payload small.
- The collapsible behaviour for Arguments and Last Error should default to collapsed to keep the view clean.
- The component split strategy (separate files vs. conditional rendering in one file) should follow existing frontend conventions — check before implementing.
- Open question: does `lastError` refer to a single error message string, or a structured object? Needs to be confirmed from the Job model before implementing the serializer.
