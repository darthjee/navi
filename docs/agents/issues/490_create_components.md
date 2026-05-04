# Issue: Create Components

## Description

There is a significant amount of HTML rendering logic embedded directly in helper class methods that could be extracted into reusable React components. Refactoring this code improves separation of concerns, maintainability, and reusability across the frontend.

## Problem

Helper classes under `frontend/src/components/*/helpers/` contain `render*` methods that return JSX. These methods would be better expressed as standalone React components, which are easier to test, reuse, and compose.

The following methods are candidates for extraction:

### `BaseUrlsMenuHelper` (`elements/helpers/BaseUrlsMenuHelper.jsx`)

| Method | Proposed Component |
|--------|--------------------|
| `renderSingleUrl()` | `SingleUrlLink` |
| `renderDropdownMenu()` | `DropdownMenuContent` |
| `renderDropdown(containerRef, open, setOpen)` | `DropdownMenu` |

### `EngineControlsHelper` (`elements/helpers/EngineControlsHelper.jsx`)

| Method | Proposed Component |
|--------|--------------------|
| `renderSpinner()` | `TransitionSpinner` |
| `renderPauseButton(view)` | `PauseButton` |
| `renderStopButton(view)` | `StopButton` |
| `renderRestartButton(view)` | `RestartButton` |
| `renderContinueButton(view)` | `ContinueButton` |
| `renderStartButton(view)` | `StartButton` |
| `renderShutdownButton(view)` | `ShutdownButton` |

### `StatsHeaderHelper` (`elements/helpers/StatsHeaderHelper.jsx`)

| Method | Proposed Component |
|--------|--------------------|
| `renderLoading()` | `LoadingSpinner` |
| `renderError(error)` | `ErrorAlert` |
| `render(stats)` | `StatsDisplay` |

### `JobDetailsHelper` (`elements/helpers/JobDetailsHelper.jsx`)

| Method | Proposed Component |
|--------|--------------------|
| `#renderRemainingAttempts(job)` | `RemainingAttempts` |
| `#renderReadyIn(job)` | `ReadyInRow` |
| `#renderLastError(job)` | `LastErrorSection` |
| `#renderRetryButton(job, onRetry)` | `RetryButton` |

### `JobsHelper` (`pages/helpers/JobsHelper.jsx`)

| Method | Proposed Component |
|--------|--------------------|
| `renderStatusTabs(status, filterQuery)` | `StatusTabs` |
| `renderStatusTab(s, status, filterQuery)` | `StatusTab` |
| `renderFilterPanel(activeFilters, handler)` | `FilterPanel` |
| `renderFilterCheckbox(jobClass, filters, handler)` | `FilterCheckbox` |
| `renderLoading()` | `LoadingSpinner` |
| `renderError(error)` | `ErrorAlert` |

## Expected Behavior

- Each `render*` method listed above is replaced by a dedicated React component file.
- The helper class calls the component (or is simplified/removed) rather than building JSX inline.
- Shared components like `LoadingSpinner` and `ErrorAlert` are extracted once and reused across helpers.

## Solution

- For each candidate method, create a new component file inside the appropriate `components/elements/` or `components/pages/` directory.
- Update the helper to import and use the new component.
- Where a helper method becomes trivial after extraction, consider removing the method entirely and having the parent component call the child directly.

## Benefits

- Improved code reuse (e.g., a single `LoadingSpinner` component used everywhere).
- Easier to unit-test individual UI pieces in isolation.
- Cleaner separation between logic (helpers/controllers) and presentation (components).
- Consistent component naming and structure across the codebase.

---
See issue for details: https://github.com/darthjee/navi/issues/490
