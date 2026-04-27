# Plan: Improve View in the Frontend — Frontend

## Overview

Refactor the `Job` detail component to render status-specific fields and add collapsible sections for Arguments and Last Error / backtrace.

## Context

The `Job` page currently shows the same fields for every status. After the backend serializer is extended (see `plan_backend.md`), the frontend must consume the new fields and display only the ones relevant to each status.

## Implementation Steps

### Step 1 — Refactor `Job` into status-aware rendering

Break the single `Job` component into a shared base and status-specific sections. Follow the existing component conventions (check before choosing between separate files vs. conditional rendering in one file).

Common fields (all statuses):
- ID
- Status (badge)
- Attempts
- Class
- Arguments (collapsible — see Step 2)

Status-specific additions:
- `enqueued` — Remaining Attempts
- `processing` — Remaining Attempts
- `failed` — Remaining Attempts · Ready In · Last Error (collapsible)
- `finished` — (no additions)
- `dead` — Last Error + backtrace (collapsible)

### Step 2 — Make Arguments and Last Error collapsible

Wrap the Arguments JSON block and the Last Error / backtrace section in a collapsible element. Default state: collapsed. Use `<details>`/`<summary>` or Bootstrap `Collapse` — follow whichever pattern is already used in the project.

### Step 3 — Update frontend tests

Add or update component tests to assert:
- Each status renders exactly its expected fields.
- Fields not belonging to a status are not rendered.
- Collapsible sections start collapsed.

## Files to Change

- `frontend/src/components/Job.jsx` — refactor into status-aware rendering.
- `frontend/src/components/` — add status-specific sub-components if needed.
- `frontend/spec/` — update / add component tests.

## Notes

- Collapsible sections should be collapsed by default to keep the view clean.
- The component split strategy must follow existing frontend conventions — check before implementing.
