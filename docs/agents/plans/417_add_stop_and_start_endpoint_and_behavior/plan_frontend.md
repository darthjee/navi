# Plan: Frontend Engine Controls

## Context

The frontend needs 5 action buttons for Engine lifecycle control, placed in the header
(visible across all views). Button availability depends on the current Engine status,
fetched from `GET /engine/status`.

## Availability Matrix

| Button | Available when |
|--------|---------------|
| Pause | `running` |
| Stop | `running` |
| Restart | `running` |
| Continue | `paused` |
| Start | `stopped` |
| *(all disabled)* | `pausing`, `stopping` |

## Implementation

### Step 1 — Add API client methods

In the existing frontend API client, add:

- `getEngineStatus()` — `GET /engine/status` → returns `{ status }`.
- `pauseEngine()` — `PATCH /engine/pause`.
- `stopEngine()` — `PATCH /engine/stop`.
- `continueEngine()` — `PATCH /engine/continue`.
- `startEngine()` — `PATCH /engine/start`.
- `restartEngine()` — `PATCH /engine/restart`.

### Step 2 — Add `EngineControls` component

Create a new `EngineControls` React component in `frontend/src/` that:

1. Fetches `GET /engine/status` on mount and on a short polling interval (e.g. every 2s)
   to detect when transitional states (`pausing`, `stopping`) complete.
2. Renders the 5 buttons, each disabled unless its required status matches the current
   Engine status (see matrix above).
3. On button click, calls the corresponding API method and immediately refreshes the status.
4. During `pausing` / `stopping`, all buttons are disabled and a visual indicator (e.g.
   spinner or muted label) shows the engine is transitioning.

### Step 3 — Integrate into the header

Add `EngineControls` to the existing header component, in a dedicated section visually
separated from the workers/jobs controls (consistent with issue #408).

## Files to Change

- `frontend/src/` — API client updates
- `frontend/src/` — new `EngineControls` component
- `frontend/src/` — header component update (integrate `EngineControls`)

## Notes

- Polling interval for status refresh should be configurable or at least a named constant
  to make it easy to tune.
- The component should cancel its polling interval on unmount to avoid memory leaks.
