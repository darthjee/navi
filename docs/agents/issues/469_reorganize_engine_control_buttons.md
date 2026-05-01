# Issue: Reorganize Engine Control Buttons

## Description

The engine control buttons in the web UI are all visible at all times, regardless of the current engine state. Each button should only be shown when it is actually applicable to the current state, so the UI always presents only active, valid actions to the user.

## Problem

- All engine buttons are shown unconditionally, including actions that are invalid for the current state (e.g. "Pause" is shown even when the engine is already stopped)
- This can confuse users and potentially trigger unintended state transitions

## Expected Behavior

Button visibility rules based on engine state:

| Button     | Visible when                        |
|------------|-------------------------------------|
| Shutdown   | Always                              |
| Stop       | Running **or** Paused               |
| Pause      | Running only                        |
| Continue   | Paused only                         |
| Start      | Stopped only                        |
| Restart    | Running **or** Paused               |

## Solution

- Read the current engine status from the API (already exposed via `/status.json` or equivalent)
- Conditionally render each button based on the status rules above
- Update the frontend component (EngineControls or equivalent) to apply these visibility conditions

## Benefits

- Users only see buttons for actions that are valid in the current state
- Reduces risk of accidental invalid state transitions
- Cleaner, less cluttered control panel

---
See issue for details: https://github.com/darthjee/navi/issues/469
