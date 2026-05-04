# Plan: Create Components

## Overview

Extract JSX rendering logic from helper class methods into dedicated React components across `frontend/src/components/elements/` and `frontend/src/components/pages/`. Each extraction is an atomic commit: new component file + updated helper in the same commit.

## Context

Helper classes under `frontend/src/components/*/helpers/` contain `render*` methods that return JSX inline. These belong in standalone React components for better reuse, testability, and separation of concerns. Two helpers (`StatsHeaderHelper`, `JobHelper`, `JobsHelper`) independently define near-identical `renderLoading` and `renderError` methods — these should be unified into shared components first.

## Implementation Steps

### Step 1 — Extract shared components: `LoadingSpinner` and `ErrorAlert`

Create two shared components in `frontend/src/components/elements/`:

- **`LoadingSpinner.jsx`** — replaces `StatsHeaderHelper.renderLoading()`, `JobHelper.renderLoading()`, and `JobsHelper.renderLoading()`.
- **`ErrorAlert.jsx`** — replaces `StatsHeaderHelper.renderError(error)`, `JobHelper.renderError(error)`, and `JobsHelper.renderError(error)`.

Update all three helpers to import and use the new components. Remove the now-redundant `renderLoading` and `renderError` methods from each helper.

### Step 2 — Extract `BaseUrlsMenuHelper` components

Create in `frontend/src/components/elements/`:

- **`SingleUrlLink.jsx`** — extracted from `renderSingleUrl()`. Props: `url`.
- **`DropdownMenuContent.jsx`** — extracted from `renderDropdownMenu()`. Props: `baseUrls`, `menuStyle`.
- **`DropdownMenu.jsx`** — extracted from `renderDropdown(containerRef, open, setOpen)`. Props: `containerRef`, `open`, `setOpen`, `baseUrls`.

Update `BaseUrlsMenuHelper` to use the new components. Evaluate whether the helper methods can be removed entirely after extraction.

### Step 3 — Extract `EngineControlsHelper` components

Create in `frontend/src/components/elements/`:

- **`TransitionSpinner.jsx`** — extracted from `renderSpinner()`. No props.
- **`PauseButton.jsx`** — extracted from `renderPauseButton(view)`. Props: `onClick`, `show` (or render conditionally in caller).
- **`StopButton.jsx`** — extracted from `renderStopButton(view)`. Props: `onClick`, `show`.
- **`RestartButton.jsx`** — extracted from `renderRestartButton(view)`. Props: `onClick`, `show`.
- **`ContinueButton.jsx`** — extracted from `renderContinueButton(view)`. Props: `onClick`, `show`.
- **`StartButton.jsx`** — extracted from `renderStartButton(view)`. Props: `onClick`, `show`.
- **`ShutdownButton.jsx`** — extracted from `renderShutdownButton(view)`. Props: `onClick`, `show`.

Update `EngineControlsHelper` to use the new components.

### Step 4 — Extract `StatsHeaderHelper` component

Create in `frontend/src/components/elements/`:

- **`StatsDisplay.jsx`** — extracted from `StatsHeaderHelper.render(stats)`. Props: `stats`.

Update `StatsHeaderHelper.render()` to delegate to `StatsDisplay`. After Steps 1 and 4, `StatsHeaderHelper` may be empty enough to remove entirely — evaluate and remove if appropriate.

### Step 5 — Extract `JobDetailsHelper` components

Create in `frontend/src/components/elements/`:

- **`RemainingAttempts.jsx`** — extracted from `#renderRemainingAttempts(job)`. Props: `job` (or `remainingAttempts`, `status`).
- **`ReadyInRow.jsx`** — extracted from `#renderReadyIn(job)`. Props: `job` (or `readyInMs`, `status`).
- **`LastErrorSection.jsx`** — extracted from `#renderLastError(job)`. Props: `job` (or `lastError`, `backtrace`, `status`).
- **`RetryButton.jsx`** — extracted from `#renderRetryButton(job, onRetry)`. Props: `job` (or `status`), `onRetry`.

Update `JobDetailsHelper` to use the new components. Remove the private methods after extraction.

### Step 6 — Extract `JobsHelper` components

Create in `frontend/src/components/pages/`:

- **`StatusTabs.jsx`** — extracted from `renderStatusTabs(status, filterQuery)`. Props: `status`, `filterQuery`.
- **`StatusTab.jsx`** — extracted from `renderStatusTab(s, status, filterQuery)`. Props: `s`, `status`, `filterQuery`.
- **`FilterPanel.jsx`** — extracted from `renderFilterPanel(activeFilters, handleClassFilterChange)`. Props: `activeFilters`, `handleClassFilterChange`.
- **`FilterCheckbox.jsx`** — extracted from `renderFilterCheckbox(jobClass, activeFilters, handleClassFilterChange)`. Props: `jobClass`, `activeFilters`, `handleClassFilterChange`.

Update `JobsHelper` to use the new components. After Steps 1 and 6, evaluate whether `JobsHelper` still needs to exist.

## Files to Change

- `frontend/src/components/elements/LoadingSpinner.jsx` — new
- `frontend/src/components/elements/ErrorAlert.jsx` — new
- `frontend/src/components/elements/SingleUrlLink.jsx` — new
- `frontend/src/components/elements/DropdownMenuContent.jsx` — new
- `frontend/src/components/elements/DropdownMenu.jsx` — new
- `frontend/src/components/elements/TransitionSpinner.jsx` — new
- `frontend/src/components/elements/PauseButton.jsx` — new
- `frontend/src/components/elements/StopButton.jsx` — new
- `frontend/src/components/elements/RestartButton.jsx` — new
- `frontend/src/components/elements/ContinueButton.jsx` — new
- `frontend/src/components/elements/StartButton.jsx` — new
- `frontend/src/components/elements/ShutdownButton.jsx` — new
- `frontend/src/components/elements/StatsDisplay.jsx` — new
- `frontend/src/components/elements/RemainingAttempts.jsx` — new
- `frontend/src/components/elements/ReadyInRow.jsx` — new
- `frontend/src/components/elements/LastErrorSection.jsx` — new
- `frontend/src/components/elements/RetryButton.jsx` — new
- `frontend/src/components/pages/StatusTabs.jsx` — new
- `frontend/src/components/pages/StatusTab.jsx` — new
- `frontend/src/components/pages/FilterPanel.jsx` — new
- `frontend/src/components/pages/FilterCheckbox.jsx` — new
- `frontend/src/components/elements/helpers/BaseUrlsMenuHelper.jsx` — updated
- `frontend/src/components/elements/helpers/EngineControlsHelper.jsx` — updated
- `frontend/src/components/elements/helpers/StatsHeaderHelper.jsx` — updated or removed
- `frontend/src/components/elements/helpers/JobDetailsHelper.jsx` — updated
- `frontend/src/components/pages/helpers/JobHelper.jsx` — updated or removed
- `frontend/src/components/pages/helpers/JobsHelper.jsx` — updated or removed

## Notes

- Each step should be one atomic commit (component file + helper update together).
- After Steps 1–4, `StatsHeaderHelper` may become trivial (or empty) — remove it if so.
- After Steps 1 and 6, `JobHelper` and `JobsHelper` may become trivial — remove them if so.
- The `view` object passed to `EngineControlsHelper` render methods (e.g. `renderPauseButton(view)`) needs careful analysis: the new button components should accept flat props (`onClick`, `show`) rather than the full `view` object to keep components decoupled from the helper's abstraction.
- No backend changes required; this is a pure frontend refactor.
