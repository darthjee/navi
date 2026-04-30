# Plan: Refactor `ReadyCountdown` Component

## Current State

- `ReadyCountdown.jsx` — contains both the `ReadyCountdownTimer` helper class and the `ReadyCountdown` component in the same file.

## Target State

- `ReadyCountdown.jsx` — component only; imports `ReadyCountdownHelper`
- `ReadyCountdownHelper.jsx` — **new file**: contains the `ReadyCountdownTimer` logic (renamed to `ReadyCountdownHelper`)

## Implementation Steps

### Step 1 — Create `ReadyCountdownHelper.jsx`

Move the `ReadyCountdownTimer` class into a new file, renaming it to `ReadyCountdownHelper`:
- `static decrementRemaining(prev)`
- `static tick(interval, prev)`
- `static initialize(readyInMs, setRemaining)`

### Step 2 — Update `ReadyCountdown.jsx`

- Remove the `ReadyCountdownTimer` class definition.
- Import `ReadyCountdownHelper` and replace all `ReadyCountdownTimer.*` calls with `ReadyCountdownHelper.*`.

## Files to Change

- `frontend/src/components/ReadyCountdown.jsx` — remove timer class, import Helper
- `frontend/src/components/ReadyCountdownHelper.jsx` — **new file** with timer logic
