# Issue: Refactor Components in Frontend

## Description

The components in `frontend/src/components/` currently mix three concerns in a single file: the component logic, data manipulation, and HTML rendering. This separation of concerns has already been solved for the `Job` component and needs to be applied to all other components.

## Problem

- Components in `frontend/src/components/` mix component logic, data manipulation, and HTML rendering in a single file.
- Only the `Jobs` component has been properly split into all three files (`Jobs.jsx`, `JobsHelper.jsx`, `JobsView.jsx`).
- Several components are missing their `Helper` or `View` counterparts.

## Expected Behavior

Each component should be split into three distinct files following the pattern established by `Jobs`:

- `<Name>.jsx` — the component itself (state, effects, orchestration)
- `<Name>Helper.jsx` — HTML rendering helpers
- `<Name>View.jsx` — data manipulation logic (fetch, handlers, derived state)

Components that are trivially simple (`CollapsibleSection`, `Layout`, `StatItem`, `JobStatItem`) do not need splitting.

## Components to Refactor

| Component | Current state | Missing |
|---|---|---|
| `Job` | `Job.jsx` + `JobHelper.jsx` (Helper mixes HTML and data logic) | `JobView.jsx` (extract data loading from Helper) |
| `BaseUrlsMenu` | `BaseUrlsMenu.jsx` + `BaseUrlsMenuHelper.jsx` (component calls client directly) | `BaseUrlsMenuView.jsx` (extract data fetching) |
| `EngineControls` | `EngineControls.jsx` + `EngineControlsHelper.jsx` (Helper mixes HTML and action logic) | `EngineControlsView.jsx` (extract data/action logic) |
| `LogsPage` | `LogsPage.jsx` + `LogsPageHelper.jsx` (Helper mixes HTML and polling logic) | `LogsPageView.jsx` (extract polling logic) |
| `StatsHeader` | All inline in `StatsHeader.jsx` (fetch + HTML mixed) | `StatsHeaderHelper.jsx` + `StatsHeaderView.jsx` |
| `JobDetails` | All inline in `JobDetails.jsx` (logic + HTML mixed) | `JobDetailsHelper.jsx` |
| `ReadyCountdown` | `ReadyCountdownTimer` class and component in the same file | `ReadyCountdownHelper.jsx` (extract timer class) |

## Solution

- For each component in the table above, extract the missing files according to the three-file pattern.

## Benefits

- Improved separation of concerns across the frontend codebase.
- Consistent component structure that is easier to navigate and maintain.
- Aligns all components with the already-established pattern from the `Job` component refactor.

---
See issue for details: https://github.com/darthjee/navi/issues/461
