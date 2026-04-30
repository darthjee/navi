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

- Related files for each component are grouped together, either by moving Helper and View files into sub-folders per component, or by organizing them into dedicated `helpers/` and `views/` sub-directories.
- The view file naming may be revisited to better reflect its responsibility (data management rather than view rendering).

## Solution

- Define and apply a folder structure that groups component-related files by responsibility or by component.
- Rename view files if a more descriptive name is agreed upon.
- Update all imports across the codebase to reflect the new paths.

## Benefits

- Cleaner and easier-to-navigate frontend source tree.
- Better modularization as the number of components grows.
- Consistent structure that scales with future additions.

---
See issue for details: https://github.com/darthjee/navi/issues/464
