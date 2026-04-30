# Plan: Refactor `LogsPage` Component

## Current State

- `LogsPage.jsx` — already thin; delegates everything to `LogsPageHelper`
- `LogsPageHelper.jsx` — mixes HTML rendering with polling/data logic

## Target State

- `LogsPage.jsx` — unchanged
- `LogsPageHelper.jsx` — HTML rendering only (`render`, `#renderEntry`)
- `LogsPageView.jsx` — data/polling logic (`buildPollingEffect`, `buildScrollEffect`, `#poll`, `#handleEntries`, `#appendEntries`, `#hasEntries`)

## Implementation Steps

### Step 1 — Create `LogsPageView.jsx`

Move all non-rendering logic from `LogsPageHelper` into a new `LogsPageView` class:
- `build(logs)` static factory
- `buildPollingEffect(cancelledRef, lastIdRef, setLogs)`
- `buildScrollEffect(bottomRef)`
- Private: `#poll`, `#handleEntries`, `#appendEntries`, `#hasEntries`

The `fetchLogs` import and `POLL_DELAY_MS` constant also move to `LogsPageView`.

### Step 2 — Update `LogsPageHelper.jsx`

Remove all polling/data methods and the `fetchLogs` import. Keep only `render(bottomRef)` and `#renderEntry(log)`, plus the `LEVEL_CLASS` constant and `build` factory.

### Step 3 — Update `LogsPage.jsx`

Import `LogsPageView` alongside `LogsPageHelper`. Use `LogsPageView.build(logs)` for the view instance and `LogsPageHelper.build(logs)` for rendering.

## Files to Change

- `frontend/src/components/LogsPageHelper.jsx` — keep only rendering methods
- `frontend/src/components/LogsPage.jsx` — import and use `LogsPageView` for data logic
- `frontend/src/components/LogsPageView.jsx` — **new file**

## Notes

- `buildScrollEffect` depends on `logs` (to check length). It may remain in the Helper if considered presentational, or move to View if considered data-derived. Prefer View since it depends on data state.
