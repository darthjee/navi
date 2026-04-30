# Plan: Restructure Frontend Folder Organization for Component Files

## Overview

Reorganize `frontend/src/components/` by moving Helper and View files into dedicated sub-directories (`helpers/` and `controllers/`), and rename all `*View.jsx` files to `*Controller.jsx` to better reflect their responsibility (data management, event handling, derived state).

## Context

After issue #461 is complete, the `components/` directory will contain three types of files per component:
- `<Name>.jsx` — the component
- `<Name>Helper.jsx` — HTML rendering helpers
- `<Name>View.jsx` — data/logic layer (to be renamed to `<Name>Controller.jsx`)

This issue addresses the flat structure by grouping files by responsibility and adopting a clearer naming convention.

## Target Folder Structure

```
frontend/src/components/
├── Job.jsx
├── Jobs.jsx
├── BaseUrlsMenu.jsx
├── EngineControls.jsx
├── LogsPage.jsx
├── StatsHeader.jsx
├── JobDetails.jsx
├── ReadyCountdown.jsx
├── CollapsibleSection.jsx
├── Layout.jsx
├── StatItem.jsx
├── JobStatItem.jsx
├── helpers/
│   ├── JobHelper.jsx
│   ├── JobsHelper.jsx
│   ├── BaseUrlsMenuHelper.jsx
│   ├── EngineControlsHelper.jsx
│   ├── LogsPageHelper.jsx
│   ├── StatsHeaderHelper.jsx
│   ├── JobDetailsHelper.jsx
│   └── ReadyCountdownHelper.jsx
└── controllers/
    ├── JobController.jsx
    ├── JobsController.jsx
    ├── BaseUrlsMenuController.jsx
    ├── EngineControlsController.jsx
    ├── LogsPageController.jsx
    └── StatsHeaderController.jsx
```

## Implementation Steps

### Step 1 — Rename `*View` → `*Controller` and move to `controllers/`

For each existing View file, rename and move it:

| From | To |
|---|---|
| `components/JobsView.jsx` | `components/controllers/JobsController.jsx` |
| `components/JobView.jsx` | `components/controllers/JobController.jsx` |
| `components/BaseUrlsMenuView.jsx` | `components/controllers/BaseUrlsMenuController.jsx` |
| `components/EngineControlsView.jsx` | `components/controllers/EngineControlsController.jsx` |
| `components/LogsPageView.jsx` | `components/controllers/LogsPageController.jsx` |
| `components/StatsHeaderView.jsx` | `components/controllers/StatsHeaderController.jsx` |

Also rename the class name inside each file from `<Name>View` to `<Name>Controller`.

### Step 2 — Move Helper files to `helpers/`

Move all `*Helper.jsx` files into the new `helpers/` sub-directory (no class renaming needed):

| From | To |
|---|---|
| `components/JobHelper.jsx` | `components/helpers/JobHelper.jsx` |
| `components/JobsHelper.jsx` | `components/helpers/JobsHelper.jsx` |
| `components/BaseUrlsMenuHelper.jsx` | `components/helpers/BaseUrlsMenuHelper.jsx` |
| `components/EngineControlsHelper.jsx` | `components/helpers/EngineControlsHelper.jsx` |
| `components/LogsPageHelper.jsx` | `components/helpers/LogsPageHelper.jsx` |
| `components/StatsHeaderHelper.jsx` | `components/helpers/StatsHeaderHelper.jsx` |
| `components/JobDetailsHelper.jsx` | `components/helpers/JobDetailsHelper.jsx` |
| `components/ReadyCountdownHelper.jsx` | `components/helpers/ReadyCountdownHelper.jsx` |

### Step 3 — Update all imports

Update import paths in every component file that references a Helper or View/Controller:

- `./JobHelper` → `./helpers/JobHelper`
- `./JobsHelper` → `./helpers/JobsHelper`
- `./JobsView` → `./controllers/JobsController`
- etc.

### Step 4 — Update documentation

Update `docs/agents/frontend.md`:
- Reflect the new folder structure in the source layout tree.
- Update the "Component conventions" section (added in issue #461) to reference `controllers/` and `helpers/` sub-directories and the `Controller` naming.

## Files to Change

- `frontend/src/components/*.jsx` — update imports in all component files
- `frontend/src/components/helpers/` — **new folder** with all Helper files
- `frontend/src/components/controllers/` — **new folder** with all Controller files (renamed from View)
- `docs/agents/frontend.md` — update source layout and component conventions

## Notes

- This issue depends on #461 being merged first, since the Controller files are created there (as View files).
- Each step can be committed independently: rename+move controllers → move helpers → update imports → update docs.
- No logic changes — purely structural.
