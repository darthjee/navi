# Plan: Refactor `EngineControls` Component

## Current State

- `EngineControls.jsx` — already thin; delegates everything to `EngineControlsHelper`
- `EngineControlsHelper.jsx` — mixes HTML rendering, data fetching, action handling, polling, and status queries

## Target State

- `EngineControls.jsx` — unchanged
- `EngineControlsHelper.jsx` — HTML rendering only (`render`, `renderSpinner`)
- `EngineControlsView.jsx` — everything non-rendering: `fetchStatus`, `handleAction`, `buildPollingEffect`, `isRunning`, `isPaused`, `isStopped`, `isTransitioning`, `build`

## Implementation Steps

### Step 1 — Create `EngineControlsView.jsx`

Move all non-rendering logic from `EngineControlsHelper` into a new `EngineControlsView` class:
- Static: `build(status, refreshStatus)`, `fetchStatus(setStatus)`
- Instance: `isTransitioning()`, `isRunning()`, `isPaused()`, `isStopped()`, `handleAction(action)`, `buildPollingEffect(intervalRef, refreshStatus)`

### Step 2 — Update `EngineControlsHelper.jsx`

Remove all moved methods and their engine client imports. Keep only `render()` and `renderSpinner()`. The `render` method will need to receive the view (or its state) as argument, or delegate action callbacks through the component.

### Step 3 — Update `EngineControls.jsx`

Use `EngineControlsView` instead of `EngineControlsHelper` for data/action logic, and `EngineControlsHelper` only for rendering.

## Files to Change

- `frontend/src/components/EngineControlsHelper.jsx` — keep only `render` and `renderSpinner`
- `frontend/src/components/EngineControls.jsx` — wire `EngineControlsView` for logic, `EngineControlsHelper` for render
- `frontend/src/components/EngineControlsView.jsx` — **new file**

## Notes

- `render()` in `EngineControlsHelper` calls methods like `isRunning()`, `handleAction()`, etc. These will move to `EngineControlsView`, so `render()` will need to receive the view instance or individual callbacks as parameters.
