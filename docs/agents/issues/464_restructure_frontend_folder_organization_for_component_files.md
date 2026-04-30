# Issue: Restructure Frontend Folder Organization for Component Files

## Description

Currently, all files related to a component (e.g. `Job.jsx`, `JobView.jsx`, `JobHelper.jsx`) live flat in the same `components/` directory. As the number of components and their companion files grows, this structure becomes harder to navigate. This issue proposes reorganizing the folder structure to improve modularity and maintainability.

## Problem

- All component files (`<Name>.jsx`, `<Name>Helper.jsx`, `<Name>View.jsx`) are co-located in a single flat `components/` directory.
- As more Helper and View files are added (e.g. as part of issue #461), the directory becomes cluttered.
- There is no clear visual grouping between the component, its rendering helpers, and its data logic.

## Affected Components

After issue #461 is complete, the following components will each have multiple companion files that need organizing:

| Component | Files |
|---|---|
| `Job` | `Job.jsx`, `JobHelper.jsx`, `JobView.jsx` |
| `Jobs` | `Jobs.jsx`, `JobsHelper.jsx`, `JobsView.jsx` |
| `BaseUrlsMenu` | `BaseUrlsMenu.jsx`, `BaseUrlsMenuHelper.jsx`, `BaseUrlsMenuView.jsx` |
| `EngineControls` | `EngineControls.jsx`, `EngineControlsHelper.jsx`, `EngineControlsView.jsx` |
| `LogsPage` | `LogsPage.jsx`, `LogsPageHelper.jsx`, `LogsPageView.jsx` |
| `StatsHeader` | `StatsHeader.jsx`, `StatsHeaderHelper.jsx`, `StatsHeaderView.jsx` |
| `JobDetails` | `JobDetails.jsx`, `JobDetailsHelper.jsx` |
| `ReadyCountdown` | `ReadyCountdown.jsx`, `ReadyCountdownHelper.jsx` |

Single-file components (`CollapsibleSection`, `Layout`, `StatItem`, `JobStatItem`) are not affected.

## Expected Behavior

- Helper and View files are moved into dedicated sub-directories by responsibility: `helpers/` and `controllers/`.
- Component files (`<Name>.jsx`) remain in the `components/` root.
- All `*View.jsx` files are renamed to `*Controller.jsx` to better reflect their responsibility (data management, event handling, derived state).

## Solution

- Create `components/helpers/` and move all `*Helper.jsx` files there.
- Create `components/controllers/` and move all `*View.jsx` files there, renaming them to `*Controller.jsx`.
- Update all imports across the codebase to reflect the new paths.
- Update `docs/agents/frontend.md` to document the new structure and naming convention.

## Benefits

- Cleaner and easier-to-navigate frontend source tree.
- Better modularization as the number of components grows.
- Consistent structure that scales with future additions.

---
See issue for details: https://github.com/darthjee/navi/issues/464
