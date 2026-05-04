# Plan: Reorganize Frontend Components

## Overview

Restructure `frontend/src/components/` by introducing two sub-folders — `pages/` for full page/view-level components (with their controllers and helpers) and `elements/` for reusable UI widgets (with their controllers and helpers) — and update all imports and documentation accordingly.

## Context

The current `frontend/src/components/` folder mixes full-page views with small reusable UI elements in a flat layout, and `controllers/` and `helpers/` are shared top-level sub-folders. Moving each controller and helper alongside the component it belongs to keeps related files co-located and makes the structure easier to navigate.

Route registration in `frontend/src/main.jsx` was used as the authoritative source to determine which components are pages.

## Component Classification

### `pages/` — top-level route components (registered in `main.jsx`)

| File | Route |
|------|-------|
| `Layout.jsx` | `/` (root layout) |
| `LogsPage.jsx` | `/logs` |
| `LogsPage.css` | (stylesheet for LogsPage) |
| `Jobs.jsx` | `/jobs` and `/jobs/:status` |
| `Job.jsx` | `/job/:id` |

### `pages/controllers/`

| File | Belongs to |
|------|-----------|
| `JobController.jsx` | `Job.jsx` |
| `JobsController.jsx` | `Jobs.jsx` |
| `LogsPageController.jsx` | `LogsPage.jsx` |

### `pages/helpers/`

| File | Belongs to |
|------|-----------|
| `JobHelper.jsx` | `Job.jsx` |
| `JobsHelper.jsx` | `Jobs.jsx` |
| `LogsPageHelper.jsx` | `LogsPage.jsx` |

### `elements/` — reusable UI components (not registered as routes)

| File | Used by |
|------|---------|
| `BaseUrlsMenu.jsx` | Layout |
| `CollapsibleSection.jsx` | various |
| `EngineControls.jsx` | Layout |
| `JobDetails.jsx` | Job page |
| `JobStatItem.jsx` | StatsHeader |
| `Logs.jsx` | LogsPage |
| `ReadyCountdown.jsx` | various |
| `StatItem.jsx` | StatsHeader |
| `StatsHeader.jsx` | Layout |

### `elements/controllers/`

| File | Belongs to |
|------|-----------|
| `BaseUrlsMenuController.jsx` | `BaseUrlsMenu.jsx` |
| `EngineControlsController.jsx` | `EngineControls.jsx` |
| `LogsController.jsx` | `Logs.jsx` |
| `StatsHeaderController.jsx` | `StatsHeader.jsx` |

### `elements/helpers/`

| File | Belongs to |
|------|-----------|
| `BaseUrlsMenuHelper.jsx` | `BaseUrlsMenu.jsx` |
| `EngineControlsHelper.jsx` | `EngineControls.jsx` |
| `JobDetailsHelper.jsx` | `JobDetails.jsx` |
| `LogsHelper.jsx` | `Logs.jsx` |
| `ReadyCountdownHelper.jsx` | `ReadyCountdown.jsx` |
| `StatsHeaderHelper.jsx` | `StatsHeader.jsx` |

## Implementation Steps

### Step 1 — Create sub-folders

Create the new directories:
- `frontend/src/components/pages/`
- `frontend/src/components/pages/controllers/`
- `frontend/src/components/pages/helpers/`
- `frontend/src/components/elements/`
- `frontend/src/components/elements/controllers/`
- `frontend/src/components/elements/helpers/`

### Step 2 — Move page components and their controllers/helpers

Move to `frontend/src/components/pages/`:
- `Layout.jsx`, `LogsPage.jsx`, `LogsPage.css`, `Jobs.jsx`, `Job.jsx`

Move to `frontend/src/components/pages/controllers/`:
- `JobController.jsx`, `JobsController.jsx`, `LogsPageController.jsx`

Move to `frontend/src/components/pages/helpers/`:
- `JobHelper.jsx`, `JobsHelper.jsx`, `LogsPageHelper.jsx`

### Step 3 — Move element components and their controllers/helpers

Move to `frontend/src/components/elements/`:
- `BaseUrlsMenu.jsx`, `CollapsibleSection.jsx`, `EngineControls.jsx`, `JobDetails.jsx`, `JobStatItem.jsx`, `Logs.jsx`, `ReadyCountdown.jsx`, `StatItem.jsx`, `StatsHeader.jsx`

Move to `frontend/src/components/elements/controllers/`:
- `BaseUrlsMenuController.jsx`, `EngineControlsController.jsx`, `LogsController.jsx`, `StatsHeaderController.jsx`

Move to `frontend/src/components/elements/helpers/`:
- `BaseUrlsMenuHelper.jsx`, `EngineControlsHelper.jsx`, `JobDetailsHelper.jsx`, `LogsHelper.jsx`, `ReadyCountdownHelper.jsx`, `StatsHeaderHelper.jsx`

### Step 4 — Update imports

Update import paths in:
- `frontend/src/main.jsx` — imports `Layout`, `LogsPage`, `Jobs`, `Job`
- Every moved component that imports another component, controller, or helper — all relative paths must be adjusted to reflect the new directory depth

### Step 5 — Remove empty old folders

Delete the now-empty `frontend/src/components/controllers/` and `frontend/src/components/helpers/` folders.

### Step 6 — Update documentation

Update `docs/agents/frontend.md` to describe the new `components/pages/` and `components/elements/` structure, including the co-located `controllers/` and `helpers/` sub-folders.

## Files to Change

- `frontend/src/components/pages/` — new folder tree (pages + controllers + helpers)
- `frontend/src/components/elements/` — new folder tree (elements + controllers + helpers)
- `frontend/src/main.jsx` — update import paths
- All moved `.jsx` files — update their internal relative imports
- `docs/agents/frontend.md` — document new structure

## Notes

- No logic changes — this is a pure structural refactor.
- After moving files, run `yarn lint` inside the container to catch any missed import updates.
