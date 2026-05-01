# Plan: Reorganize Engine Control Buttons

## Overview

Replace the current "all buttons always visible, some disabled" pattern with conditional rendering — each button is only rendered when the corresponding action is valid for the current engine state.

## Context

`EngineControlsHelper.jsx` currently renders all six buttons unconditionally and uses `disabled={!view.isX()}` to grey out inapplicable ones. The issue requires that buttons be **hidden** rather than disabled when they don't apply to the current state.

Current disable rules:
- Pause, Stop, Restart → disabled unless `running`
- Continue → disabled unless `paused`
- Start → disabled unless `stopped`
- Shut Down → always enabled

Required visibility rules:
| Button    | Show when              |
|-----------|------------------------|
| Shutdown  | Always                 |
| Stop      | `running` or `paused`  |
| Pause     | `running` only         |
| Continue  | `paused` only          |
| Start     | `stopped` only         |
| Restart   | `running` or `paused`  |

Note: Stop and Restart gain visibility in the `paused` state (currently they were disabled there). During transitional states (`pausing`, `stopping`) all buttons except Shutdown are hidden; the spinner already provides visual feedback for those states.

## Implementation Steps

### Step 1 — Add visibility predicates to `EngineControlsController`

Add `show*()` methods alongside the existing `is*()` methods:

```js
showShutdown() { return true; }
showPause()    { return this.isRunning(); }
showStop()     { return this.isRunning() || this.isPaused(); }
showContinue() { return this.isPaused(); }
showStart()    { return this.isStopped(); }
showRestart()  { return this.isRunning() || this.isPaused(); }
```

### Step 2 — Update `EngineControlsHelper` to use conditional rendering

Replace every `disabled={!view.isX()}` with a conditional render guard. Remove the `disabled` props entirely — a visible button is always active:

```jsx
{view.showPause() && (
  <button className="btn btn-sm btn-outline-warning" onClick={() => view.handlePause()}>
    Pause
  </button>
)}
{view.showStop() && (
  <button className="btn btn-sm btn-outline-danger" onClick={() => view.handleStop()}>
    Stop
  </button>
)}
{view.showRestart() && (
  <button className="btn btn-sm btn-outline-primary" onClick={() => view.handleRestart()}>
    Restart
  </button>
)}
{view.showContinue() && (
  <button className="btn btn-sm btn-outline-success" onClick={() => view.handleContinue()}>
    Continue
  </button>
)}
{view.showStart() && (
  <button className="btn btn-sm btn-outline-success" onClick={() => view.handleStart()}>
    Start
  </button>
)}
<button className="btn btn-sm btn-danger" onClick={() => view.handleShutdown()}>
  Shut Down
</button>
```

### Step 3 — Update `EngineControls_spec.js`

Replace assertions that check `button.disabled` with presence/absence checks:

- **when running**: Pause/Stop/Restart are present; Continue/Start are absent; Shut Down is present
- **when paused**: Continue/Stop/Restart are present; Pause/Start are absent; Shut Down is present
- **when stopped**: Start is present; Pause/Stop/Continue/Restart are absent; Shut Down is present
- **when transitioning**: no action buttons except Shut Down; spinner is shown

Example change:
```js
// Before
it('renders the Continue button disabled', () => {
  const button = findButtonByText(container, 'Continue');
  expect(button).not.toBeNull();
  expect(button.disabled).toBeTrue();
});

// After
it('does not render the Continue button', () => {
  const button = findButtonByText(container, 'Continue');
  expect(button).toBeNull();
});
```

## Files to Change

- `frontend/src/components/controllers/EngineControlsController.jsx` — add `show*()` visibility predicates
- `frontend/src/components/helpers/EngineControlsHelper.jsx` — switch from `disabled` props to conditional rendering
- `frontend/spec/components/EngineControls_spec.js` — update assertions from `disabled` checks to presence/absence checks

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `frontend/`: `docker-compose run --rm navi_frontend bash -c "yarn spec && yarn lint"` (CircleCI job: `frontend-tests`)
